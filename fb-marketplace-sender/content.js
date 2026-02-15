// FB Marketplace Message Sender - Find & Send or Paste & Send

const BUTTON_ID = "fb-marketplace-sender-btn";

function extractPrice(el) {
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
    
      // Generate message using Gemini if API key is available
      let messageToSend = "Hi! Is this still available? I'm very interested.";
    
      if (GEMINI_API_KEY && currentListingInfo && typeof generateInitialMessage !== 'undefined') {
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
