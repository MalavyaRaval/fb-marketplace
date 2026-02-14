console.log("🚀 FB Marketplace Finder Active");

let KEYWORD = "bike"; // Default, will be loaded from storage
let MIN_PRICE = null;
let MAX_PRICE = null;
const MESSAGE_TEXT = "Hi! Is this still available? I'm very interested.";

let isProcessing = false; // Flag to prevent multiple openings at the same time
let messagedListings = new Set(); // Track which listings we've already messaged
let pendingListings = []; // Queue of listings to message

// Load keyword, price range, and messaged listings from storage
chrome.storage.sync.get(['searchKeyword', 'minPrice', 'maxPrice', 'messagedListings'], (result) => {
  if (result.searchKeyword) {
    KEYWORD = result.searchKeyword.toLowerCase();
    console.log(`🔍 Searching for: "${KEYWORD}"`);
  }
  if (result.minPrice !== undefined) {
    MIN_PRICE = result.minPrice;
  }
  if (result.maxPrice !== undefined) {
    MAX_PRICE = result.maxPrice;
  }
  if (MIN_PRICE !== null || MAX_PRICE !== null) {
    console.log(`💰 Price range: $${MIN_PRICE || 0} - $${MAX_PRICE || '∞'}`);
  }
  if (result.messagedListings) {
    messagedListings = new Set(result.messagedListings);
    console.log(`📋 Loaded ${messagedListings.size} previously messaged listings`);
  }
});

// Save messaged listings to storage
function saveMessagedListings() {
  chrome.storage.sync.set({ 
    messagedListings: Array.from(messagedListings) 
  });
}

// Notify background script that content script is loaded
try {
  chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });
} catch (e) {
  // Ignore if background script is not available
}

/**
 * Extract price from listing text or element
 */
function extractPrice(listingElement) {
  // Try to find price in various formats
  const listingText = listingElement.innerText || listingElement.textContent || '';
  
  // Look for price patterns: $50, $1,234, $50.00, etc.
  const pricePatterns = [
    /\$([\d,]+\.?\d*)/,  // $50, $1,234, $50.00
    /([\d,]+\.?\d*)\s*dollars?/i,  // 50 dollars
    /([\d,]+\.?\d*)\s*USD/i  // 50 USD
  ];
  
  for (let pattern of pricePatterns) {
    const match = listingText.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, ''); // Remove commas
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  
  // Try to find price in span elements with common price classes
  const priceElements = listingElement.querySelectorAll('span[dir="auto"], span[class*="price"], span[class*="Price"]');
  for (let el of priceElements) {
    const text = el.innerText || el.textContent || '';
    const match = text.match(/\$([\d,]+\.?\d*)/);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  
  return null;
}

/**
 * Check if price is within budget
 */
function isWithinBudget(price) {
  if (price === null) {
    // If we can't determine price, include it (user can decide)
    return true;
  }
  
  if (MIN_PRICE !== null && price < MIN_PRICE) {
    return false;
  }
  
  if (MAX_PRICE !== null && price > MAX_PRICE) {
    return false;
  }
  
  return true;
}

function scanForItems() {
  // Reload keyword and price range from storage in case it changed
  chrome.storage.sync.get(['searchKeyword', 'minPrice', 'maxPrice'], (result) => {
    if (result.searchKeyword) {
      KEYWORD = result.searchKeyword.toLowerCase();
    }
    if (result.minPrice !== undefined) {
      MIN_PRICE = result.minPrice;
    }
    if (result.maxPrice !== undefined) {
      MAX_PRICE = result.maxPrice;
    }
  });

  const listings = document.querySelectorAll('a[href*="/marketplace/item/"]');
  
  if (listings.length === 0) {
    console.log("No listings found on page");
    return;
  }

  console.log(`🔍 Scanning ${listings.length} listings for: "${KEYWORD}"`);
  
  // Find all matching listings that haven't been messaged yet
  const matchingListings = [];
  
  for (let listing of listings) {
    const listingText = listing.innerText.toLowerCase();
    const listingHref = listing.getAttribute('href');
    
    // Extract item ID from href to use as unique identifier
    const itemIdMatch = listingHref.match(/\/marketplace\/item\/(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : listingHref;

    if (listingText.includes(KEYWORD) && !messagedListings.has(itemId)) {
      const price = extractPrice(listing);
      
      if (isWithinBudget(price)) {
        matchingListings.push({
          id: itemId,
          element: listing,
          text: listingText.split('\n')[0],
          price: price || 999999 // Use high number for sorting if price unknown
        });
      } else {
        console.log(`❌ Listing out of budget: ${listingText.split('\n')[0]} (Price: ${price ? '$' + price : 'Unknown'})`);
      }
    }
  }

  // Sort by price (lowest first - best deals)
  matchingListings.sort((a, b) => a.price - b.price);
  
  // Limit to top 3
  const top3Listings = matchingListings.slice(0, 3);
  
  console.log(`💰 Found ${matchingListings.length} listings within budget`);
  console.log(`📋 Top 3 listings:`, top3Listings.map(l => `${l.text} - $${l.price === 999999 ? '?' : l.price}`));
  
  // Add top 3 to pending queue (avoid duplicates)
  for (let listing of top3Listings) {
    if (!pendingListings.find(l => l.id === listing.id)) {
      pendingListings.push(listing);
    }
  }
  
  // Process the next listing in queue if not already processing
  if (!isProcessing && pendingListings.length > 0) {
    processNextListing();
  }
}

function processNextListing() {
  if (isProcessing || pendingListings.length === 0) {
    return;
  }

  const listing = pendingListings.shift(); // Get first item from queue
  const itemId = listing.id;
  
  // Mark as messaged immediately to avoid duplicates
  messagedListings.add(itemId);
  saveMessagedListings();
  
  isProcessing = true;
  console.log(`💬 Processing listing: ${listing.text}`);
  
  // Re-find the element by its ID (in case DOM reference is stale)
  const listings = document.querySelectorAll('a[href*="/marketplace/item/"]');
  let targetElement = null;
  
  for (let el of listings) {
    const href = el.getAttribute('href');
    const idMatch = href.match(/\/marketplace\/item\/(\d+)/);
    const elId = idMatch ? idMatch[1] : href;
    
    if (elId === itemId) {
      targetElement = el;
      break;
    }
  }
  
  if (!targetElement) {
    console.log(`❌ Could not find listing element for ID: ${itemId}. Skipping.`);
    isProcessing = false;
    // Try next listing
    setTimeout(() => processNextListing(), 1000);
    return;
  }
  
  // Scroll element into view
  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Notify background script
  try {
    chrome.runtime.sendMessage({ action: 'found', item: listing.text });
  } catch (e) {
    // Ignore if background script is not available
  }
  
  // Small delay before clicking to ensure element is visible
  setTimeout(() => {
    targetElement.click();
    // Give the listing page/modal 2 seconds to load before messaging
    setTimeout(() => handleMessaging(), 2000);
  }, 500);
}

/**
 * Handles finding the message box and inserting text
 */
async function handleMessaging() {
  console.log("🔍 Looking for messaging interface...");

  const waitFor = (selector, timeout = 4000) => {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el || Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(el);
        }
      }, 200);
    });
  };

  // 1. Look for the textarea
  let textArea = document.querySelector('textarea.x1i10hfl') || document.querySelector('textarea');

  // 2. If no textarea, try to click the "Message" button
  if (!textArea) {
    const messageButton = Array.from(document.querySelectorAll('div[role="button"]'))
      .find(el => el.innerText === "Message" || el.innerText === "Send Message");

    if (messageButton) {
      messageButton.click();
      textArea = await waitFor('textarea'); 
    }
  }

  // 3. Insert and Send
  if (textArea) {
    textArea.focus();
    textArea.value = MESSAGE_TEXT;
    textArea.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log("✅ Message inserted!");

    setTimeout(() => {
      const sendBtn = Array.from(document.querySelectorAll('div[role="button"]'))
        .find(el => el.innerText === "Send" || el.ariaLabel === "Send");
      
      if (sendBtn) {
        sendBtn.click();
        console.log("📤 Message Sent!");
        
        // Final Step: Close the modal and process next listing
        setTimeout(() => {
          const closeBtn = document.querySelector('div[aria-label="Close"]');
          if (closeBtn) closeBtn.click();
          
          // Reset processing flag and continue with next listing
          isProcessing = false;
          console.log("✅ Done with this listing. Processing next...");
          
          // Wait a bit before processing next listing to avoid rate limiting
          setTimeout(() => {
            processNextListing();
          }, 2000);
        }, 1000);
      } else {
        console.log("❌ Failed to find send button.");
        isProcessing = false;
        // Try next listing
        setTimeout(() => processNextListing(), 2000);
      }
    }, 1000);
  } else {
    console.log("❌ Failed to find the textarea.");
    isProcessing = false; // Unlock if it failed so you can try again
    // Try next listing
    setTimeout(() => processNextListing(), 2000);
  }
}

// Start the observer
const observer = new MutationObserver(() => {
  scanForItems();
});

observer.observe(document.body, { childList: true, subtree: true });

// Also run once on start, with a delay to ensure page is loaded
setTimeout(() => {
  scanForItems();
}, 2000);
