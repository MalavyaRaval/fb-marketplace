console.log("🚀 Single Bike Finder Active");

const KEYWORD = "bike";
const MESSAGE_TEXT = "Hi! Is this bike still available? I'm very interested.";

let isProcessing = false; // Flag to prevent multiple openings

function scanForBikes() {
  // If we are already messaging someone, don't look for more
  if (isProcessing) return;

  const listings = document.querySelectorAll('a[href*="/marketplace/item/"]');
  
  for (let listing of listings) {
    const listingText = listing.innerText.toLowerCase();

    if (listingText.includes(KEYWORD)) {
      console.log(`🚲 First bike found! Opening: ${listingText.split('\n')[0]}`);
      
      isProcessing = true; // Lock the script
      listing.click();
      
      // Give the listing page/modal 2 seconds to load before messaging
      setTimeout(() => handleMessaging(), 2000);
      
      break; // Exit the loop immediately after finding the FIRST one
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
        
        // Final Step: Close the modal
        setTimeout(() => {
          const closeBtn = document.querySelector('div[aria-label="Close"]');
          if (closeBtn) closeBtn.click();
          console.log("🔒 Done. Refresh the page to find another.");
        }, 1000);
      }
    }, 1000);
  } else {
    console.log("❌ Failed to find the textarea.");
    isProcessing = false; // Unlock if it failed so you can try again
  }
}

// Start the observer
const observer = new MutationObserver(() => {
  scanForBikes();
});

observer.observe(document.body, { childList: true, subtree: true });

// Also run once on start
scanForBikes();
