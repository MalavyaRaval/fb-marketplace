# CRS Feature - Setup in 3 Steps

Got the extension? Now try personalized recommendations!

## ⚡ Quick Setup (5 minutes)

### Step 1: Start Backend

```powershell
# Open PowerShell
cd C:\Users\naray\Downloads\fb_app\fb_marketplace\fb-marketplace-webapp

# Run backend (uses mock data - no setup needed!)
python app.py
```

**Expected output:**
```
WARNING in app.run_simple
 * Running on http://0.0.0.0:5001
```

✅ Backend is ready

### Step 2: Install Extension (if not done)

1. Go to `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select `C:\Users\naray\Downloads\fb_app\fb_marketplace\`
5. Extension installed ✅

### Step 3: Test It

#### Test Personalized (With Login)

1. Go to https://www.amazon.com
2. **Log in to your Amazon account**
3. Search for and click on any product (phone, laptop, chair, etc.)
4. Wait a moment...
5. See green box: **"🌍 Sustainable Alternatives"** with badge **"📊 Personalized"**
6. If prompted: Enter your date of birth (MM/DD/YYYY) for demo data
7. See products with **"💡 Recommended for you"** badges!

#### Test Generic (Without Login)

1. Open **Incognito tab** (Ctrl + Shift + N)
2. Go to https://www.amazon.com (DON'T log in)
3. Click any product
4. See green box with sustainable alternatives
5. NO "📊 Personalized" badge (because no login)
6. All products shown at all price points

## 🎯 How to Use

### When Logged In:
- Extension detects you're logged in
- Shows products **within your financial capacity**
- Gives "Recommended for you" suggestions
- Only shows your credit tier price range

### When Not Logged In:
- Extension shows all sustainable options  
- No filtering by price
- Same recommendations for everyone

## 💡 What You'll See

### Good Credit (Logged In)
```
🌍 Sustainable Alternatives [📊 Personalized]

💡 Recommended for you
🌱 Refurbished iPhone 12
✔️ In your price range
💚 Save 65 kg CO₂  |  💰 $399

💚 Also great choice
🌱 Used iPhone 11  
✔️ In your price range
💚 Save 70 kg CO₂  |  💰 $299
```

### Fair Credit (Logged In)
```
🌍 Sustainable Alternatives [📊 Personalized]

💡 Recommended for you
🌱 Refurbished iPhone 11
✔️ In your price range
💚 Save 70 kg CO₂  |  💰 $349

💡 Second choice
🌱 Used iPhone XS Max
✔️ In your price range
💚 Save 75 kg CO₂  |  💰 $249

⚠️ Premium option
🌱 iPhone 12 Standard
Note: Outside your typical price range
💚 Save 65 kg CO₂  |  💰 $599
```

### Not Logged In
```
🌍 Sustainable Alternatives

🌱 Refurbished iPhone 12
Refurbished reduces manufacturing emissions
💚 Save 65 kg CO₂  |  💰 $399

🌱 Used iPhone 11
Pre-owned reduces production waste
💚 Save 70 kg CO₂  |  💰 $299

🌱 Used iPhone XS
Extend product lifespan
💚 Save 72 kg CO₂  |  💰 $249
```

## 🔧 Configuration

### Use Mock Data (Default)
```bash
python app.py
# Works immediately - no API key needed!
```

### Use Real CRS Provider

Create `.env` file in `fb-marketplace-webapp/`:
```
CRS_API_KEY=your_api_key_from_provider
CRS_API_BASE=https://api.your-provider.com
```

Then restart:
```bash
python app.py
```

## ✅ Supported Sites

✅ Amazon.com  
✅ Target.com  
✅ Best Buy.com  
✅ Walmart.com  
✅ eBay.com

More sites can be added (see docs).

## 🧪 Testing Checklist

- [ ] Backend runs without errors
- [ ] Extension loads in Chrome
- [ ] Can visit Amazon product page
- [ ] Sustainable alternatives appear
- [ ] When logged in: see "📊 Personalized" badge
- [ ] When NOT logged in: no personalization badge
- [ ] Personalized filtering works (checks price range)
- [ ] Badges show: "💡 Recommended for you"
- [ ] DOB prompt appears when needed
- [ ] No red errors in console (F12)

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| Extension says "Finding alternatives..." but doesn't complete | Check backend is running in terminal |
| Always shows generic (no personalization) | Make sure you're actually logged in to Amazon/Target |
| Never prompts for DOB | Try logging in again, reload page |
| "User not found" error | Use MM/DD/YYYY format for date of birth |
| Chrome shows CORS error | Backend might not be running, restart it |

## 📚 Learn More

- **Full Guide:** `CRS_INTEGRATION_GUIDE.md`
- **Legal/Privacy:** `PRIVACY_AND_COMPLIANCE.md`
- **Developer Reference:** `CRS_QUICK_REFERENCE.md`
- **Technical Details:** `CRS_IMPLEMENTATION_SUMMARY.md`

## 🎉 You're All Set!

You now have:
✅ Personalized recommendations by credit tier  
✅ Smart filtering by price capacity  
✅ Location-aware suggestions  
✅ Privacy-protected personal data  

**Enjoy finding the perfect sustainable products! 🌍💚**

### Quick Commands Reference

```bash
# Start backend
cd fb-marketplace-webapp && python app.py

# Test API (in another terminal)
curl http://localhost:5001/api/lookup-user \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","dob":"03/15/1980"}'

# Stop backend
Ctrl + C
```

### Chrome Developer Tools

If having issues:

1. Open DevTools: **F12**
2. Go to **Console** tab
3. Look for red errors
4. Go to **Network** tab
5. Reload page
6. Look for requests to `localhost:5001`
7. Check response status (should be 200)

### If Everything Works:

🎊 **Congratulations!**

Your extension is:
- ✅ Detecting user logins
- ✅ Looking up credit profiles  
- ✅ Filtering by price tier
- ✅ Showing personalized recommendations
- ✅ Protecting user privacy

You're ready to deploy! 🚀

---

**Questions?** Check the documentation files or look at the code comments!
