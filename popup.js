// Popup script to control the background search

let isRunning = false;
const searchInput = document.getElementById('searchInput');

// Load saved search term
chrome.storage.sync.get(['searchKeyword'], (result) => {
  if (result.searchKeyword) {
    searchInput.value = result.searchKeyword;
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
  } else {
    statusDiv.textContent = 'Status: Stopped';
    statusDiv.className = 'status stopped';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    searchInput.disabled = false;
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
  
  if (!keyword) {
    alert('Please enter a search term (e.g., chair, bike, laptop)');
    searchInput.focus();
    return;
  }
  
  // Save the search keyword
  chrome.storage.sync.set({ searchKeyword: keyword }, () => {
    chrome.runtime.sendMessage({ action: 'start', keyword: keyword }, (response) => {
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

