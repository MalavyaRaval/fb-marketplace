// Popup script to control the background search

let isRunning = false;
const searchInput = document.getElementById('searchInput');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');

// Load saved search term and price range
chrome.storage.sync.get(['searchKeyword', 'minPrice', 'maxPrice'], (result) => {
  if (result.searchKeyword) {
    searchInput.value = result.searchKeyword;
  }
  if (result.minPrice) {
    minPriceInput.value = result.minPrice;
  }
  if (result.maxPrice) {
    maxPriceInput.value = result.maxPrice;
  }
});

// Update UI based on status
function updateUI(status) {
  const statusDiv = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  isRunning = status;
  
  if (status) {
    statusDiv.textContent = 'Status: Running';
    statusDiv.className = 'status running';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    searchInput.disabled = true;
    minPriceInput.disabled = true;
    maxPriceInput.disabled = true;
  } else {
    statusDiv.textContent = 'Status: Stopped';
    statusDiv.className = 'status stopped';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    searchInput.disabled = false;
    minPriceInput.disabled = false;
    maxPriceInput.disabled = false;
  }
}

// Get current status
chrome.runtime.sendMessage({ action: 'status' }, (response) => {
  if (response && response.success) {
    updateUI(response.isRunning);
  }
});

// Start button
document.getElementById('startBtn').addEventListener('click', () => {
  const keyword = searchInput.value.trim();
  const minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : null;
  const maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
  
  if (!keyword) {
    alert('Please enter a search term (e.g., chair, bike, laptop)');
    searchInput.focus();
    return;
  }
  
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    alert('Minimum price cannot be greater than maximum price');
    return;
  }
  
  // Save the search keyword and price range
  chrome.storage.sync.set({ 
    searchKeyword: keyword,
    minPrice: minPrice,
    maxPrice: maxPrice
  }, () => {
    chrome.runtime.sendMessage({ 
      action: 'start', 
      keyword: keyword,
      minPrice: minPrice,
      maxPrice: maxPrice
    }, (response) => {
      if (response && response.success) {
        updateUI(true);
      }
    });
  });
});

// Stop button
document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
    if (response && response.success) {
      updateUI(false);
    }
  });
});

