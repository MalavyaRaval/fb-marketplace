console.log("🚀 FB Marketplace Finder Active");

let KEYWORD = "bike"; // Default, will be loaded from storage
let MIN_PRICE = null;
let MAX_PRICE = null;
let GEMINI_API_KEY = "";
let USER_PERSONA = "";

let isProcessing = false; // Flag to prevent multiple openings at the same time
let messagedListings = new Set(); // Track which listings we've already messaged
let pendingListings = []; // Queue of listings to message
let currentListingInfo = null; // Store current listing info for messaging
let messagesSentCount = 0; // Track how many messages have been sent
let MAX_MESSAGES = 3; // Maximum number of messages to send (configurable)

// Load keyword, price range, API key, max messages, and messaged listings from storage
chrome.storage.sync.get(['searchKeyword', 'minPrice', 'maxPrice', 'geminiApiKey', 'userPersona', 'maxMessages', 'messagedListings'], (result) => {
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
  if (result.geminiApiKey) {
    GEMINI_API_KEY = result.geminiApiKey;
    console.log("✅ Gemini API key loaded");
  }
  if (result.userPersona) {
    USER_PERSONA = result.userPersona;
  }
  if (result.maxMessages) {
    MAX_MESSAGES = parseInt(result.maxMessages) || 3;
    console.log(`📊 Max messages set to: ${MAX_MESSAGES}`);
  }
  if (result.messagedListings) {
    messagedListings = new Set(result.messagedListings);
    console.log(`📋 Loaded ${messagedListings.size} previously messaged listings`);
  }
});

// Listen for storage changes to update MAX_MESSAGES
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.maxMessages) {
    MAX_MESSAGES = parseInt(changes.maxMessages.newValue) || 3;
    console.log(`📊 Max messages updated to: ${MAX_MESSAGES}`);
  }
});

// Check for webapp payload (sent from the web app via background.js polling)
chrome.storage.local.get(['findAndSendPayload'], (result) => {
  if (result.findAndSendPayload) {
    const payload = result.findAndSendPayload;
    KEYWORD = (payload.searchKeyword || "").toLowerCase();
    MIN_PRICE = payload.minPrice !== undefined ? payload.minPrice : null;
    MAX_PRICE = payload.maxPrice !== undefined ? payload.maxPrice : null;
    console.log(`🎯 Using webapp payload: keyword="${KEYWORD}" minPrice=${MIN_PRICE} maxPrice=${MAX_PRICE}`);
    // Store this message to use when sending (it will be used in handleMessaging)
    if (payload.message) {
      sessionStorage.setItem('_webappMessage', payload.message);
      console.log(`💬 Stored webapp message for sending`);
    }
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
  
  // Limit to max messages, but only add as many as we still need
  const remainingMessages = MAX_MESSAGES - messagesSentCount;
  const listingsToAdd = matchingListings.slice(0, Math.min(MAX_MESSAGES, remainingMessages));
  
  console.log(`💰 Found ${matchingListings.length} listings within budget`);
  console.log(`📊 Messages sent: ${messagesSentCount}/${MAX_MESSAGES}`);
  console.log(`📋 Adding ${listingsToAdd.length} listings to queue:`, listingsToAdd.map(l => `${l.text} - $${l.price === 999999 ? '?' : l.price}`));
  
  // Add listings to pending queue (avoid duplicates)
  for (let listing of listingsToAdd) {
    if (!pendingListings.find(l => l.id === listing.id)) {
      pendingListings.push(listing);
    }
  }
  
  // Process the next listing in queue if not already processing and haven't reached max
  if (!isProcessing && pendingListings.length > 0 && messagesSentCount < MAX_MESSAGES) {
    processNextListing();
  } else if (messagesSentCount >= MAX_MESSAGES) {
    console.log(`✅ Already sent ${MAX_MESSAGES} messages. No more processing needed.`);
  }
}

function processNextListing() {
  // Check if we've already sent the maximum number of messages
  if (messagesSentCount >= MAX_MESSAGES) {
    console.log(`✅ Already sent ${MAX_MESSAGES} messages. Stopping.`);
    return;
  }
  
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
  
  // Store listing info for message generation
  currentListingInfo = {
    title: listing.text,
    price: listing.price === 999999 ? null : listing.price,
    description: listing.description || ""
  };
  
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
    setTimeout(() => {
      // Try to extract more listing details from the page
      extractListingDetails();
      handleMessaging();
    }, 2000);
  }, 500);
}

/**
 * Extract listing details from the page
 */
function extractListingDetails() {
  if (!currentListingInfo) return;
  
  // Try to get description
  const descriptionEl = document.querySelector('[data-testid*="description"]') ||
                       document.querySelector('[class*="description"]') ||
                       document.querySelector('div[dir="auto"]');
  
  if (descriptionEl && !currentListingInfo.description) {
    currentListingInfo.description = descriptionEl.innerText || descriptionEl.textContent || "";
  }
  
  // Try to get price if not already set
  if (!currentListingInfo.price) {
    const priceEl = document.querySelector('[data-testid*="price"]') ||
                    document.querySelector('[class*="price"]');
    if (priceEl) {
      const priceText = priceEl.innerText || priceEl.textContent || "";
      const priceMatch = priceText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) {
        currentListingInfo.price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }
    }
  }
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

  // 1. Try to click the "Message" button first to open the messaging interface
  const messageButton = Array.from(document.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]'))
    .find(el => {
      const text = (el.innerText || el.textContent || '').trim();
      return text === "Message" || text === "Send Message" || text.includes("Message");
    });

  if (messageButton) {
    console.log("📩 Clicking Message button...");
    messageButton.click();
    // Wait for the messaging interface to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 2. Look for textarea or contenteditable div
  let textArea = document.querySelector('textarea[placeholder*="message" i]') ||
                 document.querySelector('textarea[placeholder*="Message" i]') ||
                 document.querySelector('textarea') ||
                 document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                 document.querySelector('div[contenteditable="true"]');

  // Wait a bit more if textarea not found
  if (!textArea) {
    textArea = await waitFor('textarea, div[contenteditable="true"]');
  }

  // 3. Generate and Insert Message
  if (textArea) {
    console.log("✅ Found message input field");
    textArea.focus();
    
    // Check if there's a message from the webapp payload
    let messageToSend = "Hi! Is this still available? I'm very interested.";
    const webappMessage = sessionStorage.getItem('_webappMessage');
    
    if (webappMessage) {
      console.log("📩 Using message from webapp");
      messageToSend = webappMessage;
      // Clear it so we don't reuse it
      sessionStorage.removeItem('_webappMessage');
    } else if (GEMINI_API_KEY && currentListingInfo && typeof generateInitialMessage !== 'undefined') {
      console.log("🤖 Generating message with Gemini AI...");
      try {
        const generatedMessage = await generateInitialMessage(currentListingInfo, GEMINI_API_KEY, USER_PERSONA);
        if (generatedMessage) {
          messageToSend = generatedMessage;
        }
      } catch (error) {
        console.error("❌ Error generating message:", error);
      }
    } else {
      if (!GEMINI_API_KEY) {
        console.log("⚠️ No Gemini API key - using default message");
      }
    }
    
    sendMessage(textArea, messageToSend);
  } else {
    console.log("❌ Failed to find the textarea.");
    isProcessing = false;
    setTimeout(() => processNextListing(), 2000);
  }
}

/**
 * Send the message
 */
function sendMessage(textArea, message) {
  console.log("💬 Attempting to send message:", message);
  
  // Handle contenteditable divs (Facebook often uses these)
  if (textArea.contentEditable === 'true' || textArea.tagName === 'DIV') {
    // Clear any existing content
    textArea.innerText = '';
    textArea.textContent = '';
    
    // Set the message
    textArea.innerText = message;
    textArea.textContent = message;
    
    // Trigger input events
    textArea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textArea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    
    // Also trigger keyboard events
    textArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    textArea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    
    console.log("✅ Message inserted in contenteditable div");
  } else {
    // Handle textareas
    textArea.value = message;
    textArea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textArea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    console.log("✅ Message inserted in textarea");
  }
  
  // Focus the textarea
  textArea.focus();

  // Wait a bit for Facebook to process the input
  setTimeout(() => {
    // Try multiple ways to find and click the send button
    let sendBtn = null;
    
    // Method 1: Look for button with "Send" text
    sendBtn = Array.from(document.querySelectorAll('div[role="button"], span[role="button"], button'))
      .find(el => {
        const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim();
        return text === "Send" || text === "Send Message" || text.includes("Send");
      });
    
    // Method 2: Look for aria-label
    if (!sendBtn) {
      const allButtons = document.querySelectorAll('[aria-label]');
      sendBtn = Array.from(allButtons).find(el => {
        const label = (el.getAttribute('aria-label') || '').toLowerCase();
        return label.includes('send');
      });
    }
    
    // Method 3: Look for button with specific classes
    if (!sendBtn) {
      sendBtn = document.querySelector('div[role="button"][tabindex="0"]') ||
                document.querySelector('div[role="button"]:not([disabled])');
    }
    
    if (sendBtn) {
      console.log("🔘 Found send button, clicking...");
      sendBtn.click();
      
      // Also try dispatching mouse events
      sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      sendBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      sendBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      
      console.log("📤 Send button clicked!");
      
      // Wait a moment to verify message was sent
      setTimeout(() => {
        // Check if message was actually sent by looking for it in the conversation
        const messageSent = textArea.value === '' || textArea.innerText === '' || 
                          textArea.textContent === '';
        
        if (messageSent) {
          console.log("✅ Message appears to have been sent!");
        } else {
          console.log("⚠️ Message might not have been sent, trying Enter key...");
          // Try pressing Enter as fallback
          textArea.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'Enter', 
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }));
          textArea.dispatchEvent(new KeyboardEvent('keypress', { 
            key: 'Enter', 
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }));
          textArea.dispatchEvent(new KeyboardEvent('keyup', { 
            key: 'Enter', 
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          }));
        }
        
        // Increment message count
        messagesSentCount++;
        console.log(`📊 Messages sent: ${messagesSentCount}/${MAX_MESSAGES}`);
        
        // Notify background script about message count
        try {
          chrome.runtime.sendMessage({ 
            action: 'messageSent', 
            count: messagesSentCount,
            maxMessages: MAX_MESSAGES
          });
        } catch (e) {
          console.error("Error notifying background:", e);
        }
        
        // Try to get conversation ID for tracking and save listing info
        setTimeout(() => {
          const url = window.location.href;
          const conversationMatch = url.match(/\/t\/(\d+)/);
            if (conversationMatch) {
            const conversationId = conversationMatch[1];
            // Save conversation with listing info
            chrome.storage.sync.get(['conversationListings'], (result) => {
              const listings = result.conversationListings || {};
              listings[conversationId] = currentListingInfo;
              chrome.storage.sync.set({ conversationListings: listings });
            });
            // Notify that we've started a conversation
            chrome.storage.sync.get(['activeConversations'], (result) => {
              const conversations = result.activeConversations || [];
              if (!conversations.includes(conversationId)) {
                conversations.push(conversationId);
                chrome.storage.sync.set({ activeConversations: conversations });
                console.log(`💬 Tracking conversation: ${conversationId}`);
              }
            });
            // Save our message to history
            if (typeof saveToConversationHistory !== 'undefined') {
              saveToConversationHistory(conversationId, 'user', message);
            }

            // Attempt to POST a log to the local webapp for tracking
            try {
              const WEBAPP_URL = 'http://127.0.0.1:5001';
              fetch(`${WEBAPP_URL}/api/log-sent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: conversationId, listing: currentListingInfo, message: message })
              }).catch((err) => console.warn('Failed posting log to webapp:', err));
            } catch (e) {
              console.warn('Logging to webapp failed', e);
            }
          }
        }, 500);
        
        // Final Step: Close the modal and check if we're done
        setTimeout(() => {
          // Find close button with case-insensitive search
          const allCloseButtons = document.querySelectorAll('[aria-label]');
          const closeBtn = Array.from(allCloseButtons).find(el => {
            const label = (el.getAttribute('aria-label') || '').toLowerCase();
            return label.includes('close');
          }) || document.querySelector('div[aria-label="Close"]') ||
              document.querySelector('[aria-label="Close"]');
          
          if (closeBtn) {
            closeBtn.click();
            console.log("🔒 Closed message modal");
          }
          
          // Reset processing flag
          isProcessing = false;
          
          // Check if we've reached the maximum number of messages
          if (messagesSentCount >= MAX_MESSAGES) {
            console.log(`✅ Successfully sent ${MAX_MESSAGES} messages! Stopping search.`);
            // Notify background to stop
            try {
              chrome.runtime.sendMessage({ action: 'stop', reason: 'maxMessagesReached' });
            } catch (e) {
              console.error("Error stopping background:", e);
            }
            return; // Don't process more listings
          }
          
          console.log("✅ Done with this listing. Processing next...");
          
          // Wait a bit before processing next listing to avoid rate limiting
          setTimeout(() => {
            processNextListing();
          }, 2000);
        }, 2000);
      }, 1000);
      
    } else {
      console.log("❌ Failed to find send button. Trying Enter key as fallback...");
      // Try pressing Enter as fallback
      textArea.focus();
      textArea.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      textArea.dispatchEvent(new KeyboardEvent('keypress', { 
        key: 'Enter', 
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      textArea.dispatchEvent(new KeyboardEvent('keyup', { 
        key: 'Enter', 
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      
      // Still increment count and continue
      messagesSentCount++;
      console.log(`📊 Messages sent (via Enter): ${messagesSentCount}/${MAX_MESSAGES}`);
      
      try {
        chrome.runtime.sendMessage({ 
          action: 'messageSent', 
          count: messagesSentCount,
          maxMessages: MAX_MESSAGES
        });
      } catch (e) {
        console.error("Error notifying background:", e);
      }
      
      setTimeout(() => {
        isProcessing = false;
        if (messagesSentCount >= MAX_MESSAGES) {
          console.log(`✅ Successfully sent ${MAX_MESSAGES} messages! Stopping search.`);
          try {
            chrome.runtime.sendMessage({ action: 'stop', reason: 'maxMessagesReached' });
          } catch (e) {
            console.error("Error stopping background:", e);
          }
          return;
        }
        // Try to report the sent message to the webapp in fallback path as well
        try {
          const conversationMatch = window.location.href.match(/\/t\/(\d+)/);
          const conversationId = conversationMatch ? conversationMatch[1] : null;
          const WEBAPP_URL = 'http://127.0.0.1:5001';
          if (conversationId) {
            fetch(`${WEBAPP_URL}/api/log-sent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: conversationId, listing: currentListingInfo, message: message })
            }).catch((err) => console.warn('Failed posting log to webapp (fallback):', err));
          }
        } catch (e) {
          console.warn('Logging to webapp failed (fallback)', e);
        }

        setTimeout(() => processNextListing(), 2000);
      }, 2000);
    }
  }, 1500); // Increased wait time for Facebook to process
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
// ============================
// Content Script: content.js
// Ecommerce Sustainable Alternatives Extension
// ============================

const API_BASE_URL = "http://localhost:5001/api";

// Site detection and product extraction logic
const SITE_HANDLERS = {
  "amazon.com": {
    getProductTitle: () => {
      const titleEl = document.querySelector("h1 span") || document.querySelector("#productTitle");
      return titleEl ? titleEl.textContent.trim() : null;
    },
    getProductPrice: () => {
      const priceEl = document.querySelector(".a-price-whole") || document.querySelector("[data-a-color='price']");
      return priceEl ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, "")) : null;
    },
    getProductDescription: () => {
      const descEl = document.querySelector("#feature-bullets");
      return descEl ? descEl.textContent.trim() : null;
    }
  },
  "target.com": {
    getProductTitle: () => {
      const titleEl = document.querySelector("h1[data-testid='product-title']");
      return titleEl ? titleEl.textContent.trim() : null;
    },
    getProductPrice: () => {
      const priceEl = document.querySelector("[data-testid='product-price']");
      return priceEl ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, "")) : null;
    },
    getProductDescription: () => {
      const descEl = document.querySelector("[data-testid='product-description']");
      return descEl ? descEl.textContent.trim() : null;
    }
  },
  "bestbuy.com": {
    getProductTitle: () => {
      const titleEl = document.querySelector("h1.sku-title");
      return titleEl ? titleEl.textContent.trim() : null;
    },
    getProductPrice: () => {
      const priceEl = document.querySelector("[data-testid='priceView']");
      return priceEl ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, "")) : null;
    },
    getProductDescription: () => {
      const descEl = document.querySelector(".sku-details");
      return descEl ? descEl.textContent.trim() : null;
    }
  },
  "walmart.com": {
    getProductTitle: () => {
      const titleEl = document.querySelector("h1[itemprop='name']");
      return titleEl ? titleEl.textContent.trim() : null;
    },
    getProductPrice: () => {
      const priceEl = document.querySelector("[data-automation-id='product-price']");
      return priceEl ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, "")) : null;
    },
    getProductDescription: () => {
      return document.body.innerText.substring(0, 500);
    }
  },
  "ebay.com": {
    getProductTitle: () => {
      const titleEl = document.querySelector("h1.it-title");
      return titleEl ? titleEl.textContent.trim() : null;
    },
    getProductPrice: () => {
      const priceEl = document.querySelector(".vi-VR-cvipPrice");
      return priceEl ? parseFloat(priceEl.textContent.replace(/[^\d.]/g, "")) : null;
    },
    getProductDescription: () => {
      const descEl = document.querySelector("#viTabs_0_panel");
      return descEl ? descEl.textContent.trim() : null;
    }
  }
};

// Detect current site
function getCurrentSite() {
  const hostname = window.location.hostname;
  for (const site in SITE_HANDLERS) {
    if (hostname.includes(site)) {
      return site;
    }
  }
  return null;
}

// Extract product information
function extractProductInfo() {
  const site = getCurrentSite();
  if (!site || !SITE_HANDLERS[site]) return null;

  const handler = SITE_HANDLERS[site];
  const title = handler.getProductTitle?.();
  const price = handler.getProductPrice?.();
  const description = handler.getProductDescription?.();

  if (!title) return null;

  return {
    site,
    title,
    price,
    description
  };
}

// ============================
// User Detection & CRS Lookup
// ============================

// Detect if user is logged in on ecommerce site
function detectLoggedInUser() {
  const site = getCurrentSite();
  if (!site) return null;

  const userDetectors = {
    "amazon.com": () => {
      // Check for Amazon account info
      const accountLink = document.querySelector("a[href*='/nav/giftcards']");
      if (accountLink?.textContent?.includes("Hello")) {
        return {
          email: localStorage.getItem("amazon_email") || localStorage.getItem("user_email"),
          name: accountLink.textContent.replace("Hello,", "").trim()
        };
      }
      // Try to extract from page
      const helloText = Array.from(document.querySelectorAll("*"))
        .find(el => el.textContent?.includes("Hello,"));
      if (helloText) {
        return {
          name: helloText.textContent.replace("Hello,", "").trim(),
          source: "amazon"
        };
      }
      return null;
    },
    "target.com": () => {
      // Check Target account indicator
      const accountIcon = document.querySelector("[aria-label*='account']");
      if (accountIcon) {
        return { source: "target", logged_in: true };
      }
      return null;
    },
    "walmart.com": () => {
      // Check Walmart account
      const account = document.querySelector("a[href*='account']");
      if (account) {
        return { source: "walmart", logged_in: true };
      }
      return null;
    },
    "bestbuy.com": () => {
      // Check Best Buy account
      const acctLink = document.querySelector("[href*='account']");
      if (acctLink) {
        return { source: "bestbuy", logged_in: true };
      }
      return null;
    },
    "ebay.com": () => {
      // Check eBay account
      const myEbay = document.querySelector("a[href*='myebay']");
      if (myEbay) {
        return { source: "ebay", logged_in: true };
      }
      return null;
    }
  };

  const detector = userDetectors[site];
  if (detector) {
    try {
      return detector();
    } catch (e) {
      console.error("Error detecting user:", e);
      return null;
    }
  }
  return null;
}

// Look up user in CRS database
async function lookupUserInCRS(userInfo) {
  if (!userInfo) return null;

  try {
    // If we have email, use it
    if (userInfo.email) {
      const response = await fetch(`${API_BASE_URL}/lookup-user-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userInfo.email })
      });
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.user_profile : null;
      }
    }

    // If we have name, try name-based lookup
    if (userInfo.name) {
      console.log("Note: Using detected name for personalization");
      // Extract year of birth if possible or use default
      const dob = prompt("For personalized recommendations, please enter your date of birth (MM/DD/YYYY):");
      if (dob) {
        const response = await fetch(`${API_BASE_URL}/lookup-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userInfo.name,
            dob: dob
          })
        });
        if (response.ok) {
          const data = await response.json();
          return data.success ? data.user_profile : null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error looking up user in CRS:", error);
    return null;
  }
}

// Fetch sustainable alternatives from backend
async function fetchSustainableAlternatives(productInfo, userProfile = null) {
  try {
    const requestBody = {
      productName: productInfo.title,
      currentPrice: productInfo.price,
      description: productInfo.description
    };

    // Include user profile for personalization if available
    if (userProfile) {
      requestBody.userProfile = userProfile;
    }

    const response = await fetch(`${API_BASE_URL}/find-sustainable-products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    return data.success ? data.alternatives : [];
  } catch (error) {
    console.error("Error fetching sustainable alternatives:", error);
    return [];
  }
}

// Render the sustainable products div
function renderSustainableDiv(alternatives, userProfile = null) {
  // Avoid duplicate rendering
  if (document.getElementById("sustainable-products-container")) {
    return;
  }

  const container = document.createElement("div");
  container.id = "sustainable-products-container";
  container.style.cssText = `
    background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
    border: 2px solid #4caf50;
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  let alternativesHTML = alternatives.map((alt, index) => {
    const savingsText = typeof alt.co2_savings === 'number' 
      ? `${alt.co2_savings} kg CO₂`
      : alt.co2_savings;

    const priceText = typeof alt.price === 'number' 
      ? `$${alt.price.toFixed(2)}`
      : alt.price;

    const badge = alt.badge ? `
      <div style="
        background: #fff59d;
        color: #f57f17;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 8px;
      ">
        ${alt.badge}
      </div>
    ` : "";

    return `
      <div style="
        background: white;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 16px;
        border-left: 4px solid #4caf50;
        transition: transform 0.2s, box-shadow 0.2s;
      " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" 
         onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
        ${badge}
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
          <div style="flex: 1;">
            <h3 style="
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 600;
              color: #1b5e20;
            ">
              🌱 ${escapeHtml(alt.name)}
            </h3>
            <p style="
              margin: 0 0 10px 0;
              font-size: 13px;
              color: #555;
              line-height: 1.4;
            ">
              ${escapeHtml(alt.reason || alt.sustainable_reason || "Sustainable alternative")}
            </p>
            ${alt.note ? `<p style="font-size: 12px; color: #ff8f00; margin: 0 0 8px 0;">⚠️ ${escapeHtml(alt.note)}</p>` : ""}
            <div style="display: flex; gap: 12px; align-items: center;">
              <span style="
                background: #c8e6c9;
                color: #1b5e20;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
              ">
                💚 Save ${savingsText}
              </span>
              <span style="
                background: #e3f2fd;
                color: #1565c0;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
              ">
                💰 ${priceText}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (alternatives.length === 0) {
    alternativesHTML = `
      <div style="
        text-align: center;
        padding: 20px;
        color: #666;
      ">
        <p>🔄 No sustainable alternatives found at this time.</p>
        <p style="font-size: 12px; margin-top: 8px;">Check back soon for more options!</p>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h2 style="
        margin: 0 0 8px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1b5e20;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        🌍 Sustainable Alternatives
        ${userProfile ? `<span style="font-size: 12px; background: #4caf50; color: white; padding: 2px 8px; border-radius: 12px;">📊 Personalized</span>` : ""}
      </h2>
      <p style="
        margin: 0;
        font-size: 13px;
        color: #558b2f;
      ">
        ${userProfile ? `Recommendations tailored to your profile (${userProfile.score_tier})` : "Consider these eco-friendly options that reduce carbon emissions"}
      </p>
    </div>

    ${alternativesHTML}

    <div style="
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-top: 16px;
      font-size: 12px;
      color: #666;
      border: 1px solid #ddd;
    ">
      <strong>💡 About CO₂ Savings:</strong> Figures represent estimated reduction compared to 
      purchasing new products. Actual savings depend on shipping, usage patterns, and end-of-life disposal.
    </div>
  `;

  // Find the best place to insert the div
  const mainContent = document.querySelector("main") || 
                      document.querySelector("[role='main']") ||
                      document.body;

  // Insert near the top but below the product title
  const productTitle = document.querySelector("h1") || document.querySelector("[role='heading']");
  if (productTitle && productTitle.nextSibling) {
    productTitle.parentNode.insertBefore(container, productTitle.nextSibling);
  } else {
    mainContent.insertBefore(container, mainContent.firstChild);
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize the extension
async function init() {
  try {
    const productInfo = extractProductInfo();
    
    if (!productInfo) {
      console.log("Could not extract product information from this page");
      return;
    }

    console.log("Found product:", productInfo);

    // Detect if user is logged in and try to get their CRS profile
    let userProfile = null;
    const loggedInUser = detectLoggedInUser();
    
    if (loggedInUser) {
      console.log("Detected logged-in user:", loggedInUser);
      userProfile = await lookupUserInCRS(loggedInUser);
      if (userProfile) {
        console.log("Found user profile:", userProfile);
      }
    }

    // Add loading div
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "sustainable-products-container";
    loadingDiv.style.cssText = `
      background: #f5f5f5;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
      color: #666;
    `;
    loadingDiv.innerHTML = `
      <p style="margin: 0; font-size: 14px;">
        🔍 Finding sustainable alternatives${userProfile ? " personalized for you" : ""}...
      </p>
    `;

    const mainContent = document.querySelector("main") || 
                        document.querySelector("[role='main']") ||
                        document.body;
    const productTitle = document.querySelector("h1") || document.querySelector("[role='heading']");
    if (productTitle && productTitle.nextSibling) {
      productTitle.parentNode.insertBefore(loadingDiv, productTitle.nextSibling);
    } else {
      mainContent.insertBefore(loadingDiv, mainContent.firstChild);
    }

    // Fetch alternatives (with personalization if user profile available)
    const alternatives = await fetchSustainableAlternatives(productInfo, userProfile);
    
    // Remove loading div
    loadingDiv.remove();
    
    // Render final div with user profile info
    renderSustainableDiv(alternatives, userProfile);

  } catch (error) {
    console.error("Error in sustainability extension:", error);
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
