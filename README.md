# FB Marketplace Helper - Background Extension

A Chrome extension that automatically searches Facebook Marketplace in the background without requiring you to keep Facebook open in your active tabs.

## Features

- ✅ **Background Operation**: Works without keeping Facebook open in your active tabs
- ✅ **Automatic Search**: Continuously searches for items matching your keyword
- ✅ **Auto-refresh**: Refreshes the marketplace page every 30 seconds
- ✅ **Easy Control**: Simple popup interface to start/stop the search

## Setup Instructions

### 1. Create Icon Files

The extension requires icon files. You can create simple placeholder icons or use any 16x16, 48x48, and 128x128 pixel images:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

You can:
- Use any image editor to create simple icons
- Download free icons from sites like [Flaticon](https://www.flaticon.com)
- Use a simple colored square as a placeholder

### 2. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `fb-marketplace` folder
5. The extension should now appear in your extensions list

### 3. Configure Your Search

Edit `content.js` to customize:
- `KEYWORD`: Change "bike" to whatever you're searching for
- `MESSAGE_TEXT`: Customize the message sent to sellers

### 4. Use the Extension

1. Click the extension icon in Chrome's toolbar
2. Click **"Start Background Search"**
3. The extension will:
   - Open Facebook Marketplace in a background tab
   - Automatically search for items matching your keyword
   - Refresh every 30 seconds
   - Send messages when items are found

## How It Works

1. **Background Service Worker** (`background.js`): 
   - Creates and manages background tabs
   - Handles the search lifecycle
   - Communicates with content scripts
=======
# Sustainable Products Finder Chrome Extension

A Chrome extension that shows sustainable product alternatives on ecommerce websites like Amazon, Target, Best Buy, Walmart, and eBay. The extension displays eco-friendly alternatives with carbon emission savings and pricing information directly on product pages.

**NEW:** Now with **credit-based personalization** — shows the most relevant sustainable products based on user credit profile!

## Features

✅ **Multi-Site Support** – Works on Amazon, Target, Best Buy, Walmart, and eBay  
✅ **Sustainable Alternatives** – Shows eco-friendly product options  
✅ **Carbon Emission Data** – Displays estimated CO₂ savings for each alternative  
✅ **Price Comparison** – Shows pricing information for sustainable options  
✅ **Smart Personalization** – Uses credit profile for relevant recommendations  
✅ **Beautiful UI** – Clean, modern design with green sustainability branding  
✅ **Privacy-First** – Sanitizes sensitive financial data, keeps you in control  
✅ **Zero Configuration** – Just install and start using  

## How It Works

### Generic Mode (Not Logged In)
1. Visit product page on supported site
2. Extension shows sustainable alternatives
3. See CO₂ savings and prices for all options

### Personalized Mode (Logged In) ✨ NEW
1. Log into your account on Amazon/Target/etc.
2. Visit any product page
3. Extension **detects your login** and optionally looks up your credit profile
4. Shows **personalized recommendations** based on:
   - Your credit tier (excellent → poor)
   - Your price capacity
   - Your location
5. See "💡 Recommended for you" badges

## Installation

### Option 1: Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Navigate to the `fb-marketplace` folder and select it
5. The extension is now installed! 🎉

### Option 2: Local Setup with Backend

The extension queries a local backend API. To set up:

#### Step 1: Start the Backend Server

```bash
cd fb-marketplace-webapp
pip install -r requirements.txt
python app.py
```

The server will start at `http://localhost:5001`

#### Step 2: Load the Extension

Follow Option 1 above to load the extension in Chrome.

#### Step 3: Visit a Product Page

Go to any product page on:
- amazon.com
- target.com
- bestbuy.com
- walmart.com
- ebay.com

The extension will automatically display sustainable alternatives!

## New: CRS Integration (Credit-Based Personalization)

### What's New?

The extension can now personalize recommendations based on your credit profile:

```
User logs in → Extension detects login → Looks up credit profile
    ↓
Filters products by your price tier → Shows "Recommended for you"
```

### Credit Tiers

| Tier | Price Range | Examples |
|------|-------------|----------|
| 🟢 Excellent | $100-5000 | Premium refurbished phones, quality furniture |
| 🔵 Good | $50-2000 | Used electronics, mid-range goods |
| 🟡 Fair | $20-800 | Budget refurbs, rental services |
| 🔴 Poor | $10-300 | Entry-level rentals |

### Privacy & Security

✅ Your actual credit score is **not shown**  
✅ Your credit score is **not affected**  
✅ Sensitive data is **not stored**  
✅ You can **opt-out anytime**  
✅ You can **delete your data anytime**  

### Getting Started with Personalization

1. **With mock data (testing):** Just start the backend, it works out of the box!
2. **With real CRS data:** See `CRS_INTEGRATION_GUIDE.md`

## Configuration

### API Endpoint Configuration

Edit `content.js` to change the backend API URL:

```javascript
const API_BASE_URL = "http://localhost:5001/api";
```

To use a remote API:
```javascript
const API_BASE_URL = "https://your-api.com/api";
```

### Adding More Ecommerce Sites

Edit `manifest.json` to add more sites:

```json
"content_scripts": [
  {
    "matches": [
      "https://www.your-site.com/*"
    ],
    "js": ["content.js"]
  }
]
```

Then add a site handler in `content.js`:

```javascript
"your-site.com": {
  getProductTitle: () => {
    // Add CSS selector for product title
    return document.querySelector(".product-title")?.textContent;
  },
  getProductPrice: () => {
    // Add CSS selector for price
    return parseFloat(document.querySelector(".price")?.textContent);
  },
  getProductDescription: () => {
    // Add CSS selector for description
    return document.querySelector(".description")?.textContent;
  }
}
```

### Configuring CRS Integration

To use real credit data instead of mock:

1. Create `.env` file in `fb-marketplace-webapp/`:
```
CRS_API_KEY=your_api_key
CRS_API_BASE=https://your-crs-provider.com
```

2. Restart backend:
```
python app.py
```

See `CRS_INTEGRATION_GUIDE.md` for full details.

## Backend API

### Endpoint 1: Find Sustainable Products

**POST** `/api/find-sustainable-products`

```json
{
  "productName": "iPhone 13",
  "currentPrice": 799.99,
  "description": "Latest Apple smartphone...",
  "userProfile": {
    "score_tier": "good",
    "price_range": {"min": 50, "max": 2000},
    "location": {"city": "SF", "state": "CA", "zip": "94105"}
  }
}
```

**Response:**
```json
{
  "success": true,
  "alternatives": [
    {
      "name": "Refurbished iPhone 12",
      "price": 399,
      "co2_savings": 65,
      "reason": "Refurbished reduces manufacturing emissions by 65%",
      "badge": "💡 Recommended for you"
    }
  ],
  "personalized": true
}
```

### Endpoint 2: Look Up User Profile (NEW)

**POST** `/api/lookup-user`

```json
{
  "name": "John Doe",
  "dob": "01/15/1990"
}
```

**Response:**
```json
{
  "success": true,
  "user_profile": {
    "score_tier": "good",
    "price_range": {"min": 50, "max": 2000},
    "location": {"city": "San Francisco", "state": "CA", "zip": "94105"},
    "availability": 85
  }
}
```

### Endpoint 3: Look Up by Email (NEW)

**POST** `/api/lookup-user-by-email`

```json
{
  "email": "user@example.com"
}
```

## File Structure

```
fb-marketplace/
├── manifest.json              # Extension config
├── content.js                 # Main extension logic
├── background.js              # Background service worker
├── styles.css                 # Extension styling
├── README.md                  # This file
├── SETUP_GUIDE.md            # Detailed setup guide
├── QUICKSTART.md             # 5-minute setup
├── IMPLEMENTATION_SUMMARY.md # Technical overview
├── CRS_QUICK_REFERENCE.md    # CRS quick reference (NEW)
├── CRS_INTEGRATION_GUIDE.md  # Full CRS guide (NEW)
├── PRIVACY_AND_COMPLIANCE.md # Legal/compliance (NEW)
│
└── fb-marketplace-webapp/
    ├── app.py                 # Flask backend API
    ├── crs_service.py        # CRS integration module (NEW)
    ├── requirements.txt       # Python dependencies
    ├── templates/index.html   # Web UI
    └── README.md             # Backend documentation
```

## How Data is Collected

The extension works in these steps:

1. **Detection** – Identifies when you're on a product page
2. **Extraction** – Extracts product name, price, and description
3. **Login Detection** – Checks if you're logged in (NEW)
4. **API Query** – Sends product info to backend API
5. **Personalization** – If logged in, looks up credit profile and filters (NEW)
6. **Display** – Shows results with CO₂ savings and prices

## Customizing Sustainable Products Database

The current implementation includes a mock database. To add real data:

### Option A: Connect to a Real Database

Edit `app.py` and modify `_get_sustainable_alternatives()` to query your database:

```python
def _get_sustainable_alternatives(product_name, data):
    # Query your database instead of mock data
    alternatives = db.query(Sustainable_Product).filter(
        name.contains(product_name)
    ).limit(5)
    return alternatives
```

### Option B: Integrate with Sustainability APIs

Connect to services like:
- **Carbon Footprint API** – Get real emission data
- **EcoCart** – Ecommerce sustainability data
- **Sustain Analytics** – Product environmental impact
- **Good On You** – Fashion brand sustainability ratings

## Troubleshooting

### Extension not showing on product pages?

1. Check if you're on a supported site (Amazon, Target, etc.)
2. Verify the backend API is running: `http://localhost:5001/api/find-sustainable-products`
3. Open Chrome DevTools (F12) and check the Console for errors
4. Reload the extension from `chrome://extensions/`

### "Finding sustainable alternatives..." appears but never loads?

1. Ensure the Flask backend is running: `python app.py`
2. Check the API is accessible at `http://localhost:5001`
3. Open DevTools Network tab to see if API request succeeded
4. Check for CORS errors in the console

### Product information not extracting correctly?

The CSS selectors used to extract product info may have changed. Update the selectors in the SITE_HANDLERS in `content.js`.

### Personalization not working?

1. Make sure you're logged into the ecommerce site
2. Reload the page after logging in
3. Check if "📊 Personalized" badge appears
4. Check CRS module is installed: `crs_service.py` in webapp folder
5. See `CRS_QUICK_REFERENCE.md` for troubleshooting

## Privacy & Legal

**IMPORTANT:** This extension handles credit report data. Before deploying to production:

✅ Review `PRIVACY_AND_COMPLIANCE.md` - **REQUIRED READING**  
✅ Ensure FCRA compliance  
✅ Add privacy policy  
✅ Implement user consent  
✅ Get legal review  

## Future Enhancements

🚀 **Planned Features:**
- Real-time carbon tracking with Life Cycle Assessment (LCA) data
- Integration with shopping cart to show total environmental impact
- Browser extension options page for customization
- Subscription to track your personal carbon savings
- Direct links to buy sustainable alternatives
- Product reviews filtered by sustainability ratings
- Carbon offset calculator
- Manufacturer transparency information
- Multi-factor authentication for CRS lookup
- Offline mode for recommendations
- Mobile app version

## Contributing

Have suggestions or want to add support for more sites? Open an issue or submit a pull request!

## Security

- All CRS data transmission uses HTTPS
- Credit scores are sanitized before client use
- Sensitive data is not logged or stored
- User data is deleted after recommendation
- See `PRIVACY_AND_COMPLIANCE.md` for full security details

## License

MIT License - feel free to use and modify for your purposes

## Resources

- [Green Hosting](https://www.wholegrain.com/sustainable-web-design)
- [Carbon Footprint Calculator](https://www.carbonfootprint.com/)
- [B Corp Directory](https://www.bcorporation.net/en-us/)
- [Product Lifecycle Assessment](https://www.epa.gov/smm/sustainable-materials-management-non-hazardous-materials-and-waste-management-hierarchy)
- [FCRA Compliance Guide](https://www.ftc.gov/business-guidance/privacy-security/fcra)
- [CFPB Data Security](https://www.consumerfinance.gov/)

## Documentation

- **Getting Started:** `QUICKSTART.md`
- **Complete Setup:** `SETUP_GUIDE.md`
- **CRS Integration:** `CRS_INTEGRATION_GUIDE.md`
- **Privacy & Legal:** `PRIVACY_AND_COMPLIANCE.md`
- **Technical Details:** `IMPLEMENTATION_SUMMARY.md`
- **Quick Reference:** `CRS_QUICK_REFERENCE.md`

---

**Help the planet, make conscious choices! 🌍💚**

**Questions?** Check the documentation above or open an issue!

### Option 1: Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Navigate to the `fb-marketplace` folder and select it
5. The extension is now installed! 🎉

### Option 2: Local Setup with Backend

The extension queries a local backend API for sustainability data. To set up:

#### Step 1: Start the Backend Server

```bash
cd fb-marketplace-webapp
pip install -r requirements.txt
python app.py
```

The server will start at `http://localhost:5001`

#### Step 2: Load the Extension

Follow Option 1 above to load the extension in Chrome.

#### Step 3: Visit a Product Page

Go to any product page on:
- amazon.com
- target.com
- bestbuy.com
- walmart.com
- ebay.com

The extension will automatically display sustainable alternatives!

## Configuration

### API Endpoint Configuration

Edit `content.js` to change the backend API URL:

```javascript
const API_BASE_URL = "http://localhost:5001/api";
```

To use a remote API:
```javascript
const API_BASE_URL = "https://your-api.com/api";
```

### Adding More Ecommerce Sites

Edit `manifest.json` to add more sites:

```json
"content_scripts": [
  {
    "matches": [
      "https://www.your-site.com/*"
    ],
    "js": ["content.js"]
  }
]
```

Then add a site handler in `content.js`:

```javascript
"your-site.com": {
  getProductTitle: () => {
    // Add CSS selector for product title
    return document.querySelector(".product-title")?.textContent;
  },
  getProductPrice: () => {
    // Add CSS selector for price
    return parseFloat(document.querySelector(".price")?.textContent);
  },
  getProductDescription: () => {
    // Add CSS selector for description
    return document.querySelector(".description")?.textContent;
  }
}
```

## Backend API

### Endpoint: POST `/api/find-sustainable-products`

**Request:**
```json
{
  "productName": "iPhone 13",
  "currentPrice": 799.99,
  "description": "Latest Apple smartphone..."
}
```

**Response:**
```json
{
  "success": true,
  "alternatives": [
    {
      "name": "Refurbished iPhone 12",
      "price": 399,
      "co2_savings": 65,
      "reason": "Refurbished reduces manufacturing emissions by 65%",
      "source": "amazon"
    },
    {
      "name": "Used iPhone 11",
      "price": 299,
      "co2_savings": 70,
      "reason": "Pre-owned reduces new production waste",
      "source": "ebay"
    }
  ]
}
```

## File Structure

```
fb-marketplace/
├── manifest.json           # Extension configuration
├── content.js             # Main extension logic (runs on product pages)
├── background.js          # Background service worker
├── styles.css             # Extension styling
├── README.md              # This file
│
├── fb-marketplace-webapp/
│   ├── app.py            # Flask backend API
│   ├── requirements.txt   # Python dependencies
│   ├── templates/
│   │   └── index.html    # Web UI (optional)
│   └── README.md         # Backend documentation
```

## How Data is Collected

The extension works in these steps:

1. **Detection** – Identifies when you're on a product page
2. **Extraction** – Extracts product name, price, and description
3. **API Query** – Sends product info to backend API
4. **Matching** – Backend searches for sustainable alternatives
5. **Display** – Shows results with carbon emissions and prices

## Customizing Sustainable Products Database

The current implementation includes a mock database. To add real data:

### Option A: Connect to a Real Database

Edit `app.py` and modify `_get_sustainable_alternatives()` to query your database:

```python
def _get_sustainable_alternatives(product_name, data):
    # Query your database instead of mock data
    alternatives = db.query(Sustainable_Product).filter(
        name.contains(product_name)
    ).limit(5)
    return alternatives
```

### Option B: Integrate with Sustainability APIs

Connect to services like:
- **Carbon Footprint API** – Get real emission data
- **EcoCart** – Ecommerce sustainability data
- **Sustain Analytics** – Product environmental impact
- **Good On You** – Fashion brand sustainability ratings

## Troubleshooting

### Extension not showing on product pages?

1. Check if you're on a supported site (Amazon, Target, etc.)
2. Verify the backend API is running: `http://localhost:5001/api/find-sustainable-products`
3. Open Chrome DevTools (F12) and check the Console for errors
4. Reload the extension from `chrome://extensions/`

### "Finding sustainable alternatives..." appears but never loads?

1. Ensure the Flask backend is running: `python app.py`
2. Check the API is accessible at `http://localhost:5001`
3. Open DevTools Network tab to see if API request succeeded
4. Check for CORS errors in the console

### Product information not extracting correctly?

The CSS selectors used to extract product info may have changed. Update the selectors in the SITE_HANDLERS in `content.js`.

## Future Enhancements

🚀 **Planned Features:**
- Real-time carbon tracking with Life Cycle Assessment (LCA) data
- Integration with shopping cart to show total environmental impact
- Browser extension options page for customization
- Subscription to track your personal carbon savings
- Direct links to buy sustainable alternatives
- Product reviews filtered by sustainability ratings
- Carbon offset calculator
- Manufacturer transparency information

## Contributing

Have suggestions or want to add support for more sites? Open an issue or submit a pull request!

## License

MIT License - feel free to use and modify for your purposes

## Resources

- [Green Hosting](https://www.wholegrain.com/sustainable-web-design)
- [Carbon Footprint Calculator](https://www.carbonfootprint.com/)
- [B Corp Directory](https://www.bcorporation.net/en-us/)
- [Product Lifecycle Assessment](https://www.epa.gov/smm/sustainable-materials-management-non-hazardous-materials-and-waste-management-hierarchy)

---

**Help the planet, make conscious choices! 🌍💚**
2. **Initial Message** – Enter listing title, price, and description, then click Generate. Copy the message and paste it when messaging the seller on Facebook.
3. **Reply to Seller** – Paste the seller's message and any conversation history. Generate a reply, copy it, and paste it in Messenger.recommendation based on crs api

2. **Content Script** (`content.js`):
   - Runs on Facebook Marketplace pages
   - Scans for listings matching your keyword
   - Handles clicking and messaging

3. **Popup UI** (`popup.html`):
   - Provides start/stop controls
   - Shows current status

## Configuration

You can modify these settings in `background.js`:

- `SEARCH_INTERVAL`: How often to refresh (default: 30000ms = 30 seconds)
- `MARKETPLACE_URL`: The Facebook Marketplace URL to use

## Permissions

The extension requires:
- `tabs`: To create and manage background tabs
- `scripting`: To inject content scripts
- `storage`: For saving settings (future use)
- `host_permissions`: Access to Facebook domains

## Troubleshooting

- **Extension not working**: Check the browser console (F12) and extension service worker logs
- **Icons missing**: Create the required icon files (see Setup step 1)
- **Search not finding items**: Verify your keyword matches items on Facebook Marketplace
- **Messages not sending**: Facebook may have changed their UI - check selectors in `content.js`

## Notes

- The extension opens Facebook Marketplace in a background tab (not visible but active)
- You need to be logged into Facebook for this to work
- Facebook's UI may change, requiring updates to selectors in `content.js`

