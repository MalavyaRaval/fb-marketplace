console.log("🚀 Background Service Worker Started");

// Configuration
const SEARCH_INTERVAL = 30000; // Check every 30 seconds
const MAX_TABS = 1; // Maximum number of background tabs

let activeTabId = null;
let isRunning = false;
let searchInterval = null;
let currentKeyword = "bike"; // Default keyword
let messagesSentCount = 0; // Track how many messages have been sent
let MAX_MESSAGES = 3; // Maximum number of messages to send (configurable)
/**
 * Gets the marketplace search URL for a given keyword
 */
function getMarketplaceUrl(keyword) {
  if (!keyword || keyword.trim() === "") {
    return "https://www.facebook.com/marketplace";
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
          } else if (tab && tab.url !== marketplaceUrl) {
            // Tab is on marketplace but different search, update it
            await chrome.tabs.update(activeTabId, { url: marketplaceUrl });
          } else if (tab) {
            // Tab is already on the correct marketplace URL
            return activeTabId;
        } catch (e) {
          // Tab doesn't exist anymore, reset
          activeTabId = null;
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
  if (!keyword || keyword.trim() === "") {
    console.error("❌ No search keyword provided");
    return;
  currentKeyword = keyword.trim();
  isRunning = true;
  messagesSentCount = 0; // Reset message count when starting new search
  // Load maxMessages from storage
  chrome.storage.sync.get(['maxMessages'], (result) => {
    if (result.maxMessages) {
      MAX_MESSAGES = parseInt(result.maxMessages) || 3;
    }
    console.log(`🔍 Starting background search for: "${currentKeyword}"`);
    console.log(`📊 Will stop after sending ${MAX_MESSAGES} messages`);
  });

  // Save keyword to storage
  chrome.storage.sync.set({ searchKeyword: currentKeyword });

  // Create initial marketplace tab
  await createBackgroundTab(currentKeyword);

  // Note: Messenger monitoring will work on facebook.com/messages automatically
  // No need to create a separate messenger.com tab

  // Set up periodic refresh (only if we haven't reached max messages)
  searchInterval = setInterval(async () => {
    // Stop refreshing if we've reached the maximum number of messages
    if (messagesSentCount >= MAX_MESSAGES) {
  console.log(`✅ Reached maximum of ${MAX_MESSAGES} messages. Stopping refresh.`);
  stopSearch();
  return;
    if (activeTabId) {
      try {
        // Refresh the marketplace page
        await chrome.tabs.reload(activeTabId);
        console.log(`🔄 Refreshed marketplace page for: "${currentKeyword}" (${messagesSentCount}/${MAX_MESSAGES} messages sent)`);
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
    // Save all settings to storage
    const settingsToSave = {};
    if (request.minPrice !== undefined || request.maxPrice !== undefined) {
      settingsToSave.minPrice = request.minPrice;
      settingsToSave.maxPrice = request.maxPrice;
    }
    if (request.maxMessages !== undefined) {
      settingsToSave.maxMessages = request.maxMessages;
      MAX_MESSAGES = parseInt(request.maxMessages) || 3;
    }
    if (request.geminiApiKey !== undefined) {
      settingsToSave.geminiApiKey = request.geminiApiKey;
    }
    if (request.userPersona !== undefined) {
      settingsToSave.userPersona = request.userPersona;
    }
    if (Object.keys(settingsToSave).length > 0) {
      chrome.storage.sync.set(settingsToSave);
  }
  startSearch(request.keyword || currentKeyword);
  sendResponse({ success: true, message: 'Search started' });
  } else if (request.action === 'stop') {
    stopSearch();
    sendResponse({ success: true, message: 'Search stopped' });
  } else if (request.action === 'messageSent') {
  // Update message count
  messagesSentCount = request.count || 0;
  const maxMessages = request.maxMessages || MAX_MESSAGES;
  console.log(`📊 Message count updated: ${messagesSentCount}/${maxMessages}`);
    
  // Stop search if we've reached the maximum
    if (messagesSentCount >= maxMessages) {
      console.log(`✅ Successfully sent ${maxMessages} messages! Stopping search automatically.`);
      stopSearch();
  }
    
  sendResponse({ success: true, messagesSent: messagesSentCount, maxMessages: maxMessages });
  } else if (request.action === 'status') {
    sendResponse({ 
      success: true, 
  isRunning: isRunning,
  activeTabId: activeTabId,
  keyword: currentKeyword,
      messagesSent: messagesSentCount,
      maxMessages: MAX_MESSAGES
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
// Background polling to fetch payload from web app and trigger sender flow
const WEBAPP_URL = "http://127.0.0.1:5001";

// Keep existing onMessage handler used by content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getMessage") {
    fetch(`${WEBAPP_URL}/api/latest-message`)
      .then((r) => r.json())
      .then((data) => sendResponse({ success: true, ...data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Poll the webapp periodically using chrome.alarms
const POLL_ALARM = "poll_webapp_latest_message";
const POLL_INTERVAL_MINUTES = 0.1; // ~6 seconds (min granularity is browser-dependent)

function scheduleAlarm() {
  try {
    chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL_MINUTES });
  } catch (e) {
    console.warn("Could not create alarm:", e);
  }
}

chrome.runtime.onInstalled.addListener(() => scheduleAlarm());
chrome.runtime.onStartup.addListener(() => scheduleAlarm());

// Helper to clear the payload on the web app after consumption
async function clearWebAppPayload() {
  try {
    await fetch(`${WEBAPP_URL}/api/store-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "", searchKeyword: "", maxPrice: null, minPrice: null }),
    });
  } catch (e) {
    console.warn("Failed clearing webapp payload:", e.message || e);
  }
}

async function handleLatestMessagePolling() {
  try {
    const res = await fetch(`${WEBAPP_URL}/api/latest-message`);
    if (!res.ok) return;
    const data = await res.json();
    const { message, searchKeyword } = data || {};
    if (!message || !message.trim() || !searchKeyword || !searchKeyword.trim()) return;

    // Avoid duplicate processing: track lastPayload in storage
    const st = await chrome.storage.local.get(["__lastConsumedMessage"]);
    const last = st.__lastConsumedMessage || "";
    const signature = `${searchKeyword}::${message}`;
    if (signature === last) return; // already processed

    // Save payload for content script to consume
    await chrome.storage.local.set({
      findAndSendPayload: {
        message: message,
        searchKeyword: searchKeyword.trim(),
        maxPrice: data.maxPrice || null,
        minPrice: data.minPrice || null,
      },
    });

    // Open Facebook Marketplace search in background (non-active)
    const url = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(searchKeyword.trim())}`;
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      // remember the tab we opened so we can close it later
      await chrome.storage.local.set({ __lastOpenedTabId: tab.id });
    } catch (e) {
      // fallback: update an existing facebook tab if available
      try {
        const tabs = await chrome.tabs.query({ url: "*://www.facebook.com/*" });
        if (tabs && tabs.length > 0) await chrome.tabs.update(tabs[0].id, { url });
        else await chrome.tabs.create({ url, active: false });
      } catch (e2) {
        console.warn("Failed to open/update FB tab:", e2);
      }
    }

    // Mark consumed so we don't re-send
    await chrome.storage.local.set({ __lastConsumedMessage: signature });

    // Optionally clear the webapp payload so it won't be re-sent
    await clearWebAppPayload();
  } catch (e) {
    console.warn("Polling error:", e.message || e);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === POLL_ALARM) {
    handleLatestMessagePolling();
  }
});

// Listen for notifications from content script that message was sent
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request && request.action === 'sent') {
    try {
      const st = await chrome.storage.local.get(['__lastOpenedTabId']);
      const tid = st.__lastOpenedTabId;
      if (tid) {
        try {
          await chrome.tabs.remove(tid);
        } catch (e) {
          // ignore
        }
        await chrome.storage.local.remove('__lastOpenedTabId');
      } else if (sender && sender.tab && sender.tab.id) {
        try { await chrome.tabs.remove(sender.tab.id); } catch (e) {}
      }

      // remove any transient payload after send
      await chrome.storage.local.remove('findAndSendPayload');
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }
});
