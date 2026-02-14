console.log("🚀 Background Service Worker Started");

// Configuration
const SEARCH_INTERVAL = 30000; // Check every 30 seconds
const MAX_TABS = 1; // Maximum number of background tabs

let activeTabId = null;
let isRunning = false;
let searchInterval = null;
let currentKeyword = "bike"; // Default keyword

/**
 * Gets the marketplace search URL for a given keyword
 */
function getMarketplaceUrl(keyword) {
  if (!keyword || keyword.trim() === "") {
    return "https://www.facebook.com/marketplace";
  }
  // Facebook Marketplace search URL format
  return `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(keyword.trim())}`;
}

/**
 * Creates a background tab for Facebook Marketplace
 */
async function createBackgroundTab(keyword) {
  try {
    const marketplaceUrl = getMarketplaceUrl(keyword);
    
    // Check if we already have an active tab
    if (activeTabId) {
      try {
        const tab = await chrome.tabs.get(activeTabId);
        if (tab && !tab.url.includes('marketplace')) {
          // Tab exists but is not on marketplace, update it
          await chrome.tabs.update(activeTabId, { url: marketplaceUrl });
          return activeTabId;
        } else if (tab && tab.url !== marketplaceUrl) {
          // Tab is on marketplace but different search, update it
          await chrome.tabs.update(activeTabId, { url: marketplaceUrl });
          return activeTabId;
        } else if (tab) {
          // Tab is already on the correct marketplace URL
          return activeTabId;
        }
      } catch (e) {
        // Tab doesn't exist anymore, reset
        activeTabId = null;
      }
    }

    // Create new background tab
    const tab = await chrome.tabs.create({
      url: marketplaceUrl,
      active: false // Open in background
    });

    activeTabId = tab.id;
    console.log(`✅ Created background tab: ${tab.id} for search: "${keyword}"`);

    // Wait for tab to load, then inject script
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === activeTabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        injectContentScript(tabId);
      }
    });

    return tab.id;
  } catch (error) {
    console.error("❌ Error creating background tab:", error);
    return null;
  }
}

/**
 * Injects the content script into the tab
 */
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    console.log(`✅ Content script injected into tab ${tabId}`);
  } catch (error) {
    console.error("❌ Error injecting content script:", error);
  }
}

/**
 * Starts the background search process
 */
async function startSearch(keyword) {
  if (isRunning) {
    console.log("⚠️ Search is already running");
    return;
  }

  if (!keyword || keyword.trim() === "") {
    console.error("❌ No search keyword provided");
    return;
  }

  currentKeyword = keyword.trim();
  isRunning = true;
  console.log(`🔍 Starting background search for: "${currentKeyword}"`);

  // Save keyword to storage
  chrome.storage.sync.set({ searchKeyword: currentKeyword });

  // Create initial tab
  await createBackgroundTab(currentKeyword);

  // Set up periodic refresh
  searchInterval = setInterval(async () => {
    if (activeTabId) {
      try {
        // Refresh the marketplace page
        await chrome.tabs.reload(activeTabId);
        console.log(`🔄 Refreshed marketplace page for: "${currentKeyword}"`);
      } catch (error) {
        console.error("❌ Error refreshing tab:", error);
        // Tab might be closed, create a new one
        activeTabId = null;
        await createBackgroundTab(currentKeyword);
      }
    } else {
      await createBackgroundTab(currentKeyword);
    }
  }, SEARCH_INTERVAL);
}

/**
 * Stops the background search process
 */
function stopSearch() {
  if (!isRunning) {
    console.log("⚠️ Search is not running");
    return;
  }

  isRunning = false;
  
  if (searchInterval) {
    clearInterval(searchInterval);
    searchInterval = null;
  }

  // Close the background tab
  if (activeTabId) {
    chrome.tabs.remove(activeTabId).catch(() => {
      // Tab might already be closed
    });
    activeTabId = null;
  }

  console.log("🛑 Stopped background search");
}

/**
 * Listen for messages from popup or content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    // Save price range to storage
    if (request.minPrice !== undefined || request.maxPrice !== undefined) {
      chrome.storage.sync.set({
        minPrice: request.minPrice,
        maxPrice: request.maxPrice
      });
    }
    startSearch(request.keyword || currentKeyword);
    sendResponse({ success: true, message: 'Search started' });
  } else if (request.action === 'stop') {
    stopSearch();
    sendResponse({ success: true, message: 'Search stopped' });
  } else if (request.action === 'status') {
    sendResponse({ 
      success: true, 
      isRunning: isRunning,
      activeTabId: activeTabId,
      keyword: currentKeyword
    });
  } else if (request.action === 'found') {
    console.log("🎉 Item found! Tab ID:", sender.tab?.id);
    // Optionally handle when an item is found
  }
  
  return true; // Keep message channel open for async response
});

// Load saved keyword on startup
chrome.storage.sync.get(['searchKeyword'], (result) => {
  if (result.searchKeyword) {
    currentKeyword = result.searchKeyword;
  }
});

/**
 * Clean up when extension is disabled/uninstalled
 */
chrome.runtime.onSuspend.addListener(() => {
  stopSearch();
});

/**
 * Handle tab closure
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    activeTabId = null;
    if (isRunning) {
      // Recreate tab if search is still running
      setTimeout(() => createBackgroundTab(currentKeyword), 2000);
    }
  }
});

// Auto-start on extension load (optional - you can remove this if you want manual start)
// Uncomment the line below if you want it to start automatically
// startSearch();

