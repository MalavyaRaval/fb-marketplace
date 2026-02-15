# 🚀 Quick Start Checklist

## Get Running in 5 Minutes

### ✅ Step 1: Start Backend (2 minutes)

```powershell
cd C:\Users\naray\Downloads\fb_app\fb_marketplace\fb-marketplace-webapp
pip install -r requirements.txt
python app.py
```

**Expected Output:**
```
WARNING in app.run_simple
 * Running on http://0.0.0.0:5001
```

✅ Leave this terminal open

---

### ✅ Step 2: Load Extension (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Turn ON **Developer mode** (top right)
4. Click **Load unpacked**
5. Select folder: `C:\Users\naray\Downloads\fb_app\fb_marketplace\`
6. ✅ Done! Extension is installed

---

### ✅ Step 3: Test It (2 minutes)

**Option A: Amazon**
1. Go to: https://www.amazon.com/s?k=iphone
2. Click on any iPhone
3. Look for green **🌍 Sustainable Alternatives** section

**Option B: Target**
1. Go to: https://www.target.com/s?searchTerm=chair
2. Click any product
3. Look for alternatives

**Option C: Best Buy**
1. Go to: https://www.bestbuy.com/site/searchpage.jsp?st=laptop
2. Click any laptop
3. Should see alternatives

---

## ✅ Troubleshooting

| Issue | Fix |
|-------|-----|
| Extension not showing on product pages | Reload page, check backend is running |
| "Finding alternatives..." never ends | Make sure backend is running on port 5001 |
| No product info extracted | Site may not be supported, check console (F12) |
| Getting errors in console | Open DevTools (F12) → Console → Check error message |

---

## 📁 Files Changed

- ✅ `manifest.json` - Multi-site support
- ✅ `content.js` - Dynamic product detection  
- ✅ `background.js` - Simplified service worker
- ✅ `styles.css` - Green sustainability theme
- ✅ `app.py` - Added `/api/find-sustainable-products`
- ✅ `README.md` - Updated documentation
- ✅ `SETUP_GUIDE.md` - Detailed setup guide (NEW)
- ✅ `IMPLEMENTATION_SUMMARY.md` - Complete overview (NEW)

---

## 🎯 What You Get

✅ **Multi-site support:** Amazon, Target, Best Buy, Walmart, eBay  
✅ **Sustainable alternatives** with CO₂ savings data  
✅ **Price comparisons** to help eco-conscious decisions  
✅ **Beautiful green design** highlighting sustainability  
✅ **Fully extensible** - easy to add more sites and data  

---

## 🌍 Next Steps

1. Test on a few product pages
2. Check the console (F12) for any errors
3. Read `SETUP_GUIDE.md` for customization
4. Add your own sustainable product data
5. Deploy backend to production

---

## 📞 Need Help?

- **Extension not working?** → Check console, see SETUP_GUIDE.md
- **Backend errors?** → Make sure port 5001 is free
- **Want to add a site?** → Read SETUP_GUIDE.md "Adding More Sites" section
- **Want real data?** → Read SETUP_GUIDE.md "Customizing Data" section

---

**You're all set! Enjoy helping users find sustainable products! 🌱💚**
