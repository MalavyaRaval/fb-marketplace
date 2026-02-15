# CRS Quick Reference

Quick reference for implementing CRS credit-based personalization.

## 📊 What is CRS Integration?

Enables the extension to:
- ✅ Detect when users are logged into ecommerce sites
- ✅ Look up their credit profile
- ✅ Filter sustainable products by price tier
- ✅ Show personalized "💡 Recommended for you" alternatives
- ✅ Fallback to generic recommendations if not logged in

## 🚀 Quick Start (5 minutes)

### 1. Start Backend with CRS Support

```bash
cd fb-marketplace-webapp
python app.py
```

✅ CRS module is ready (uses mock data by default)

### 2. Load Extension in Chrome

1. `chrome://extensions/`
2. Enable Developer Mode
3. Load unpacked `fb-marketplace` folder
4. Visit Amazon or Target

### 3. Test It

#### With Login:
1. Log into Amazon with your account  
2. Go to any product page
3. Extension asks for your DOB
4. Shows personalized recommendations
5. 📊 Personalized badge appears

#### Without Login:
1. Incognito tab
2. Go to product page WITHOUT logging in
3. Shows generic recommendations
4. No personalization

## 🔧 Configuration

### Use Mock Data (Testing)
- No setup needed  
- Default behavior
- Uses generated user profiles

### Use Real CRS Provider

Create `.env` file:
```bash
CRS_API_KEY=your_actual_key
CRS_API_BASE=https://provider-api.com
```

Restart: `python app.py`

## 📱 Supported Sites

Auto-detects login on:
- ✅ Amazon.com
- ✅ Target.com  
- ✅ Best Buy.com
- ✅ Walmart.com
- ✅ eBay.com

## 💰 Credit Tiers

| Tier | Score | Price Range | Examples |
|------|-------|-------------|----------|
| 🟢 Excellent | 750+ | $100-5000 | Refurb phones, premium furniture |
| 🔵 Good | 670-740 | $50-2000 | Used electronics, quality goods |
| 🟡 Fair | 580-660 | $20-800 | Budget refurbs, rentals |
| 🔴 Poor | <580 | $10-300 | Rental services, entry-level |

## API Endpoints (Reference)

**User Lookup:**
```bash
POST /api/lookup-user
{ "name": "John Doe", "dob": "01/15/1990" }
```

**Email Lookup:**
```bash
POST /api/lookup-user-by-email
{ "email": "user@amazon.com" }
```

**Personalized Alternatives:**
```bash
POST /api/find-sustainable-products
{
  "productName": "iPhone",
  "currentPrice": 999,
  "userProfile": { "score_tier": "good", "price_range": {...} }
}
```

## 🔒 Privacy Handling

**Sensitive data NOT sent to client:**
- Actual credit score (750, 670, etc.)
- Debt-to-income ratio
- Payment history
- SSN, full address

**Safe data sent:**
- Tier only: "excellent", "good", "fair", "poor"
- Price range: min/max
- Location: city/state/zip
- Availability: percentage

## ✅ Compliance Notes

⚠️ **Before production:**
1. Get legal review (FCRA compliance)
2. Add privacy policy
3. Implement consent flow
4. Test with real users
5. Setup data deletion
6. Log all access

See `PRIVACY_AND_COMPLIANCE.md` for full details.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "User not found" | Verify name spelling, use MM/DD/YYYY for DOB |
| No login detection | Log in again, reload page |
| Always generic | User not logged in, that's correct |
| Slow personalization | Check backend logs, API response time |
| Can't find CRS module | Make sure `crs_service.py` is in `fb-marketplace-webapp/` |

## 📂 File Structure

```
fb-marketplace/
├── content.js           ← User detection added
├── manifest.json        ← No changes needed
│
└── fb-marketplace-webapp/
    ├── app.py          ← New endpoints added
    ├── crs_service.py  ← NEW CRS module
    └── requirements.txt ← No new dependencies
```

## 🔗 More Info

- **Full CRS Guide:** `CRS_INTEGRATION_GUIDE.md`
- **Privacy/Compliance:** `PRIVACY_AND_COMPLIANCE.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`

## 💡 Examples

### Example 1: Good Credit User
```
Name: Jane Doe
DOB: 03/15/1980
↓
Credit Tier: Good
Price Range: $50-2000
↓
iPhone 12 ($399) → Shown ✅
iPhone 12 Max ($599) → Shown ✅
iPhone 13 Pro ($999) → Shown ✅
iPhone 14 Pro Max ($1,199) → Shown ✅
iPhone 14 Pro Ultra ($2,500) → Hidden ❌

Shows: "💡 Recommended for you"
```

### Example 2: Fair Credit User
```
Name: Bob Smith
DOB: 07/22/1992
↓
Credit Tier: Fair
Price Range: $20-800
↓
Used iPhone 11 ($299) → Shown ✅
Refurbished iPhone 11 ($349) → Shown ✅
Pre-owned iPhone 12 ($449) → Shown ✅
iPhone 12 ($599) → Shown ✅
iPhone 13 ($799) → Shown ✅
iPhone 13 Pro ($999) → Hidden ❌
⚠️ "Outside your typical price range"
```

### Example 3: No Login
```
User not logged in
↓
No CRS lookup
↓
Generic recommendations shown
↓
All price ranges visible
```

## Testing Checklist

- [ ] Mock data works (no API key)
- [ ] Real API works (with API key)
- [ ] Amazon login detection works
- [ ] Target/Walmart login works
- [ ] Personalization filters items correctly
- [ ] Badges show for top recommendations
- [ ] Privacy data sanitized properly
- [ ] Fallback to generic works
- [ ] Slow network handled gracefully
- [ ] No errors in console

## Environment Variables

```bash
# .env file in fb-marketplace-webapp/
CRS_API_KEY=your_api_key_here          # Optional (mock used if missing)
CRS_API_BASE=https://crs-provider.com  # Optional (defaults to example.com)
FLASK_ENV=production                    # Set to production before deployment
```

## Common Issues

**Extension shows "Finding alternatives..." forever**
- Check backend running: `python app.py`
- Check port 5001 is free
- Look at terminal for errors

**Login not detected**
- Make sure you're actually logged in
- Refresh page after login
- Check console (F12) for errors

**Mock data always used**
- That's normal if no `.env` file with API key
- Create `.env` to use real CRS

**Personalization not working**
- Check user profile badge appears
- Verify price_range in API response
- Check browser Network tab for API calls

## Next Steps

1. ✅ Test with mock data
2. ✅ Deploy to users
3. ✅ Get legal review for compliance
4. ✅ Connect real CRS provider
5. ✅ Implement consent flow
6. ✅ Launch to production

---

**Need help?** Check the full guides in the repo! 📚
