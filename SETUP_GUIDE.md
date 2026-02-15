# Sustainable Products Finder - Complete Setup Guide

This guide will walk you through setting up the Sustainable Products Finder extension to work on ecommerce sites like Amazon, Target, and more.

## Quick Start (5 minutes)

### 1. Start the Backend Server

Open PowerShell and navigate to the webapp folder:

```powershell
cd "C:\Users\naray\Downloads\fb_app\fb_marketplace\fb-marketplace-webapp"
pip install -r requirements.txt
python app.py
```

You should see:
```
WARNING in app.run_simple
 * Running on http://0.0.0.0:5001
```

Leave this window open - the backend API needs to be running.

### 2. Load the Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **Developer mode** (top-right corner)
4. Click **Load unpacked**
5. Navigate to `C:\Users\naray\Downloads\fb_app\fb_marketplace\` and click Select Folder
6. The extension should now be installed! ✅

### 3. Test It Out

1. Go to https://www.amazon.com/s?k=iphone
2. Click on any iPhone product
3. You should see a green **"🌍 Sustainable Alternatives"** section appearing below the product info
4. Wait a moment for it to load alternatives

**If it's not showing:**
- Make sure the backend is running (step 1)
- Check the Chrome Console (F12 → Console tab) for errors
- Reload the page

---

## Detailed Setup

### Backend Setup

The backend provides the sustainable product alternatives data. 

**Folder:** `C:\Users\naray\Downloads\fb_app\fb_marketplace\fb-marketplace-webapp\`

**Required Files:**
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies

**Installation:**

```bash
# Navigate to webapp directory
cd fb-marketplace-webapp

# Install dependencies (only needed once)
pip install -r requirements.txt

# Run the server
python app.py
```

**Expected Output:**
```
WARNING in app.run_simple
 * Running on http://0.0.0.0:5001
 * Press CTRL + C to quit
```

**Verify it's working:**
- Open browser: http://localhost:5001/api/find-sustainable-products
- This should show an error (expected, since it needs POST data)
- If you see it, the API is working ✅

---

## Extension Setup

### Files Modified for This Release

1. **manifest.json** - Now supports 5 ecommerce sites instead of just Target
2. **content.js** - Complete rewrite for dynamic product detection
3. **background.js** - Simplified for the new architecture
4. **styles.css** - New styling for sustainable alternatives
5. **app.py** - Added `/api/find-sustainable-products` endpoint

### How the Extension Works

```
User visits product page
        ↓
Extension detects site (Amazon, Target, etc.)
        ↓
Extracts product name, price, description
        ↓
Sends to backend API: http://localhost:5001/api/find-sustainable-products
        ↓
Backend finds sustainable alternatives
        ↓
Extension displays beautiful green div with options
        ↓
User sees sustainable choices!
```

### Supported Sites

✅ Amazon (amazon.com)
✅ Target (target.com)  
✅ Best Buy (bestbuy.com)
✅ Walmart (walmart.com)
✅ eBay (ebay.com)

### Adding More Sites

To add a new site like Costco:

#### Step 1: Update manifest.json

```json
"content_scripts": [
  {
    "matches": [
      "https://www.costco.com/p/*"
    ],
    "js": ["content.js"]
  }
]
```

#### Step 2: Add site handler to content.js

Find the `SITE_HANDLERS` object and add:

```javascript
"costco.com": {
  getProductTitle: () => {
    // Find the right CSS selector for Costco's site
    return document.querySelector(".product-title")?.textContent;
  },
  getProductPrice: () => {
    return parseFloat(document.querySelector(".price")?.textContent);
  },
  getProductDescription: () => {
    return document.querySelector(".product-description")?.textContent;
  }
}
```

**Finding CSS selectors:**
1. Right-click element on website
2. Select "Inspect"
3. Find the CSS selector in DevTools
4. Use that selector in the handler

---

## Testing

### Test on Amazon

1. Visit: https://www.amazon.com/dp/B0BVBYY6RH (or any product)
2. Wait 2-3 seconds for the extension to load
3. Should see green "🌍 Sustainable Alternatives" section

**Example Products to Test:**
- Phones: https://www.amazon.com/s?k=iphone
- Laptops: https://www.amazon.com/s?k=laptop
- Furniture: https://www.amazon.com/s?k=office+chair

### Test on Target

1. Visit: https://www.target.com/s?searchTerm=phone
2. Click a product
3. Should see alternatives

### Debugging

If it's not working:

**Step 1: Check Backend**
```powershell
# In PowerShell, test the API
curl http://localhost:5001/api/find-sustainable-products -Method POST -Body '{"productName":"iphone"}' -ContentType "application/json"
```

**Step 2: Check Extension Console**
- Press F12 on ecommerce site
- Click **Console** tab
- Should see: "Found product: {title, price, ...}"
- Look for any red errors

**Step 3: Check Network Tab**
- In DevTools, go to **Network** tab
- Reload the product page
- Look for requests to `localhost:5001`
- Should see a successful POST request

---

## Customizing the Sustainable Products Data

### Current Data Source

The backend currently uses a mock database with categories like:
- Phone → Refurbished iPhones
- Chair → Upcycled office chairs
- Table → Reclaimed wood tables
- Laptop → Certified refurbished laptops
- Clothing → Organic cotton & recycled materials

### Adding Real Data

#### Option 1: Connect to a Database

Edit `app.py`:

```python
from your_database import eSustainable_Product

def _get_sustainable_alternatives(product_name, data):
    # Query your database
    alternatives = db.session.query(Sustainable_Product).filter(
        Sustainable_Product.product_type.ilike(f"%{product_name}%")
    ).limit(5).all()
    
    return [
        {
            "name": alt.name,
            "price": alt.price,
            "co2_savings": alt.carbon_saved,
            "reason": alt.sustainability_reason
        }
        for alt in alternatives
    ]
```

#### Option 2: Use an External API

```python
import requests

def _get_sustainable_alternatives(product_name, data):
    # Example: Using an external sustainability API
    response = requests.get(
        f"https://api.example.com/sustainable-products",
        params={"q": product_name}
    )
    return response.json()
```

#### Option 3: Use CSV Data

```python
import pandas as pd

# Load once when server starts
PRODUCTS_DB = pd.read_csv("sustainable_products.csv")

def _get_sustainable_alternatives(product_name, data):
    # Filter for matching products
    matches = PRODUCTS_DB[
        PRODUCTS_DB['name'].str.contains(product_name, case=False)
    ]
    return matches.to_dict('records')
```

### Data Format

The backend should return data in this format:

```python
[
    {
        "name": "Product Name",
        "price": 99.99,  # Can be float or string like "Contact seller"
        "co2_savings": 45.5,  # kg CO₂ or "50-70%" string also works
        "reason": "Why this is sustainable",
        "source": "amazon",  # Optional: where to buy
        "url": "https://link-to-product.com"  # Optional
    },
    # ... more products
]
```

---

## Monitoring & Logging

### View Extension Logs

1. Go to `chrome://extensions/`
2. Find "Sustainable Products Finder"
3. Click **Details**
4. Click **"Errors"** link (if there's an error count)

### View Backend Logs

```powershell
# The backend prints logs to the console
# Look for request logs like:
# 127.0.0.1 - - [15/Feb/2026 10:30:45] "POST /api/find-sustainable-products HTTP/1.1" 200 -
```

### Enable Debug Mode

In `content.js`, add at the top:

```javascript
const DEBUG = true;

if (DEBUG) {
  console.log("DEBUG: Extension running on", window.location.hostname);
}
```

---

## Common Issues & Solutions

### ❌ "Finding sustainable alternatives..." never completes

**Problem:** Backend not responding

**Solution:**
1. Check backend is running: `python app.py`
2. Verify it's on port 5001
3. Test manually: Open PostMan or test API
4. Check firewall isn't blocking port 5001

### ❌ No product information extracted

**Problem:** CSS selectors don't match the website

**Solution:**
1. Inspect the product page (right-click → Inspect)
2. Find the product title element
3. Copy its CSS selector
4. Update the SITE_HANDLERS in content.js

### ❌ Extension shows on some sites but not others

**Problem:** Site not in manifest.json or CSS selectors don't match

**Solution:**
1. Add site to manifest.json host_permissions
2. Add site to content_scripts matches
3. Add site handler with correct CSS selectors

### ❌ Getting CORS errors

**Problem:** Browser blocking API requests

**Solution:**
- The backend should already have CORS enabled (check app.py)
- If not, add to Flask app:
```python
from flask_cors import CORS
CORS(app)
```

---

## Performance Tips

### Reduce Loading Time

1. **Cache alternatives**
   ```javascript
   const cache = new Map();
   ```

2. **Timeout API calls**
   ```javascript
   const alternatives = await fetchWithTimeout(
     fetchSustainableAlternatives(productInfo),
     3000  // 3 second timeout
   );
   ```

3. **Lazy load** (only when user scrolls to section)

### Optimize Backend

1. Use database indexes on product names
2. Cache query results
3. Implement pagination (show top 5, load more on demand)
4. Use CDN for product images

---

## Security Considerations

1. **Validate API responses** - Sanitize HTML in alternatives
2. **Rate limiting** - Add rate limit to prevent abuse
3. **Authentication** - If using paid API, protect keys
4. **HTTPS only** - Use HTTPS in production
5. **CSP headers** - Add Content Security Policy

---

## Next Steps

1. ✅ Start backend server
2. ✅ Load extension in Chrome
3. ✅ Test on product pages
4. ✅ Monitor logs for issues
5. 📊 Add real sustainability data (CSV, database, API)
6. 🎨 Customize styling to match your brand
7. 🌐 Deploy backend to production (Heroku, AWS, etc.)
8. 📱 Consider mobile app version

---

## Support & Troubleshooting

**For issues:**
1. Check the Console (F12 → Console)
2. Check Network tab for API calls
3. Verify backend is running
4. Try reloading the extension from `chrome://extensions/`

**Need help?**
- Review the README.md
- Check the code comments
- Test with a simple product first

---

Enjoy helping users find sustainable products! 🌍💚
