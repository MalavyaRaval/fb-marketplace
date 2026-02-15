# CRS Integration Guide - Credit-Based Personalization

This guide explains how the extension now uses CRS (Credit Reporting Service) API to personalize sustainable product recommendations based on user credit profiles and location.

## Overview

The extension now has two modes:

### 1. **Generic Recommendations** (No User Logged In)
- Shows sustainable alternatives for all users
- No personalization
- Same recommendations for everyone

### 2. **Personalized Recommendations** (User Logged In)
- Detects if user is logged into ecommerce site (Amazon, Target, etc.)
- Looks up user credit profile in CRS database
- Filters alternatives by:
  - **Credit tier** (excellent, good, fair, poor)
  - **Price range** (matches financial capacity)
  - **Location** (shows nearest sustainable options)
- Highlights "Recommended for you" products

## Architecture

```
User visits product page
        ↓
Extension detects login status
        ↓
┌─ If logged in:                │ If NOT logged in:
│ • Detect user info (email)     │ • Show generic sustainable
│ • Call CRS API                 │   alternatives
│ • Get credit profile           │
│ • Filter by price range        │
│ • Show personalized            │
│   recommendations              │
└────────────────────────────────┘
```

## Setup

### 1. Install CRS Integration

The CRS service module is already installed:
- `fb-marketplace-webapp/crs_service.py` - CRS client

### 2. Configure API Keys

Create a `.env` file in the webapp directory:

```bash
cd fb-marketplace-webapp

# Create .env file with your CRS credentials
echo "CRS_API_KEY=your_api_key_here" > .env
echo "CRS_API_BASE=https://your-crs-provider.com" >> .env
```

**Mock Mode (Default):**
If no API key is set, the extension uses a mock CRS database for testing.

### 3. Restart Backend

```bash
python app.py
```

The system will now support both generic and personalized recommendations.

## How User Detection Works

The extension detects logged-in users automatically on supported sites:

### Amazon.com
✅ Detects "Hello, [Name]" greeting in top navigation  
✅ Looks for account link  
✅ Prompts for DOB if available

### Target.com
✅ Detects account icon in header  
✅ Prompts for user info for CRS lookup

### Walmart.com
✅ Detects account link in header

### Best Buy .com
✅ Detects account navigation

### eBay.com
✅ Detects "My eBay" link

## API Endpoints

### 1. Look Up User by Name + DOB

```bash
POST /api/lookup-user
Content-Type: application/json

{
  "name": "John Doe",
  "dob": "01/15/1990"
}

Response:
{
  "success": true,
  "user_profile": {
    "score_tier": "good",
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    },
    "price_range": {
      "min": 50,
      "max": 2000
    },
    "availability": 85
  },
  "data_source": "mock"
}
```

### 2. Look Up User by Email

```bash
POST /api/lookup-user-by-email
Content-Type: application/json

{
  "email": "user@amazon.com"
}

Response:
{
  "success": true,
  "user_profile": {...},
  "data_source": "mock"
}
```

### 3. Find Personalized Alternatives

```bash
POST /api/find-sustainable-products
Content-Type: application/json

{
  "productName": "iPhone 13",
  "currentPrice": 999,
  "userProfile": {
    "score_tier": "good",
    "price_range": {"min": 50, "max": 2000},
    "location": {"city": "SF", "state": "CA", "zip": "94105"}
  }
}

Response:
{
  "success": true,
  "alternatives": [
    {
      "name": "Refurbished iPhone 12",
      "price": 399,
      "co2_savings": 65,
      "reason": "Refurbished reduces manufacturing emissions",
      "badge": "💡 Recommended for you"
    },
    {
      "name": "Used iPhone 11",
      "price": 299,
      "co2_savings": 70,
      "reason": "Pre-owned reduces production waste",
      "badge": "💚 Also great choice"
    }
  ],
  "personalized": true
}
```

## Credit Tiers & Pricing

The system automatically adjusts price ranges based on credit profile:

| Tier | Score | Price Range | Availability |
|------|-------|-------------|--------------|
| Excellent | 750-800 | $100-5000 | 95% |
| Good | 670-740 | $50-2000 | 85% |
| Fair | 580-660 | $20-800 | 70% |
| Poor | 300-580 | $10-300 | 50% |

### How Filtering Works

1. **User views product page**
2. **Extension detects login** → Gets email/name
3. **CRS lookup** → Returns credit tier and price range
4. **Filter alternatives** → Only show products within price range
5. **Sort by CO₂** → Prioritize environmental impact
6. **Add badges** → "Recommended for you" / "Also great choice"
7. **Show personalization indicator** → "📊 Personalized" badge

## Privacy & Data Protection

### Sensitive Data Handling

✅ **What we don't send to client:**
- Actual credit score (750, 670, etc.)
- Debt-to-income ratio
- Payment history details
- Full address
- Social Security number
- Full credit report

✅ **What we sanitize & send:**
- Score tier only (excellent/good/fair/poor)
- Location (city/state/zip)
- Price range (min/max)
- Availability score

### Data Flow

```
User Login
    ↓
Extract email/name
    ↓
Call CRS API with credentials
    ↓
CRS returns full credit report ← [Private, not sent to extension]
    ↓
Secretary sanitize/extract only:
    • Tier (excellent/good/fair/poor)
    • Price range
    • Location
    ↓
Send sanitized data to browser extension
    ↓
Extension uses for filtering only
    ↓
Never logs or stores sensitive data
```

### Compliance Considerations

⚠️ **IMPORTANT - Before deploying to production:**

1. **FCRA Compliance** (Fair Credit Reporting Act)
   - Ensure CRS API usage complies with FCRA
   - Requires proper licensing and disclosures
   - Users must consent to credit check

2. **Privacy Policy**
   - Add to extension and website
   - Disclose credit profile usage
   - Explain data deletion

3. **User Consent**
   - Prompt user before CRS lookup
   - Show what data is being accessed
   - Provide opt-out option

4. **Data Retention**
   - Don't store credit data in browser storage
   - Delete after session ends
   - Allow user data deletion on request

5. **Encryption**
   - Always use HTTPS
   - Encrypt sensitive API communications
   - Use API keys safely (never in client code)

## Testing

### Test with Mock Data

Mock CRS is enabled by default (no API key needed):

```bash
# Start backend
python app.py

# Test lookup endpoint
curl http://localhost:5001/api/lookup-user \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","dob":"05/20/1985"}'

# Response:
# {
#   "success": true,
#   "user_profile": {
#     "score_tier": "fair",
#     "price_range": {"min": 20, "max": 800},
#     ...
#   },
#   "data_source": "mock"
# }
```

### Test Personalization

1. Install extension in Chrome
2. Go to Amazon and search for a product
3. When prompted, enter name and DOB
4. Should see personalized recommendations

### Test Without Login

Same process, but don't log into ecommerce site:
- Should see generic alternatives
- No personalization badge

## Connecting to Real CRS Provider

To use a real CRS API (Equifax, Experian, etc.):

### Step 1: Update `.env`

```bash
CRS_API_KEY=your_actual_api_key
CRS_API_BASE=https://api.equifax.com  # or your provider
```

### Step 2: Update `crs_service.py`

Replace the mock data section with actual API calls:

```python
def lookup_user(self, name: str, dob: str):
    """Make actual CRS API call instead of mock"""
    try:
        import requests
        response = requests.post(
            f"{self.api_base}/lookup",
            json={"name": name, "dob": dob},
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=self.timeout
        )
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        logger.error(f"CRS API error: {e}")
        return None
```

### Step 3: Test

```bash
# Restart backend
python app.py

# Extension will now use real CRS data
```

## Troubleshooting

### Issue: "User not found" error

**Causes:**
- Name/DOB not in CRS database
- Typo in name or date
- CRS API not responding

**Solution:**
- Verify name spelling exactly
- Use format MM/DD/YYYY for DOB
- Check CRS API status
- Look at backend logs

### Issue: Extension not requesting user info

**Causes:**
- User not logged in on ecommerce site
- Site login detection not working
- Extension not seeing login state

**Solution:**
- Log in to Amazon/Target manually
- Check browser console (F12) for errors
- Reload page after logging in

### Issue: Alternatives not filtered by price

**Causes:**
- User profile not fetched
- Price range not set
- API error

**Solution:**
- Check "📊 Personalized" badge appears
- Look at browser Network tab for API calls
- Check backend logs for errors

### Issue: Mock data always used

**Causes:**
- CRS_API_KEY not set
- Or set to empty string

**Solution:**
- Add to `.env`: `CRS_API_KEY=your_key`
- Restart backend: `python app.py`

## Example User Scenarios

### Scenario 1: Excellent Credit User

1. Logs into Amazon
2. Extension detects "Hello, Jane Doe"
3. Prompts for DOB → "03/15/1980"
4. CRS lookup → credit_tier: "excellent"
5. Price range: $100-5000
6. Shows premium refurbished options up to $2000
7. Badge: "💡 Recommended for you"

### Scenario 2: Fair Credit User

1. Logs into Target
2. Extension detects login
3. CRS lookup finds fair credit
4. Price range: $20-800
5. Filters to budget-friendly sustainable options
6. Shows "⚠️ Outside your typical price range" for higher-priced items

### Scenario 3: No User Logged In

1. Visits Best Buy and looks at a product
2. Extension detects no login
3. Shows generic sustainable alternatives
4. No personalization or filtering
5. All price ranges shown

## Security Best Practices

1. **Never log sensitive data**
   ```python
   # ❌ BAD
   logger.info(f"User credit score: {score}")
   
   # ✅ GOOD
   logger.info("User profile fetched successfully")
   ```

2. **Always sanitize before client**
   ```python
   # Use sanitize_data() method
   sanitized = crs.sanitize_data(raw_data)
   ```

3. **Use HTTPS in production**
   ```
   https://yourdomain.com NOT http://
   ```

4. **Protect API keys**
   ```
   # .env (never commit to git)
   CRS_API_KEY=xxx
   CRS_API_BASE=https://...
   ```

5. **Validate all inputs**
   ```python
   if not name or not dob:
       return error
   ```

## Future Enhancements

🚀 **Planned Features:**
- Multi-factor authentication for CRS lookup
- Caching user profiles (with expiry)
- Alternative income-based filtering
- Recommendations based on spending patterns
- Carbon offset scoring + personalization
- Integration with budgeting apps
- Real-time savings calculator

---

## Support

**Questions about CRS setup?**
1. Check `.env` file is created with API key
2. Verify backend is running on port 5001
3. Check browser console (F12) for errors
4. Check `app.py` logs for backend errors

**Privacy concerns?**
- Review Privacy Policy section above
- Ensure FCRA compliance before production
- Add user consent flows
- Test data sanitization

---

**Ready to personalize recommendations! 🎯💚**
