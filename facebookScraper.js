function extractPriceFromText(text) {
  const match = text.match(/\$\s?\d+(?:,\d{3})*(?:\.\d{2})?/);
  return match ? match[0].replace(/\s+/g, "") : null;
}

function findPrice() {
  const elements = document.querySelectorAll("span, div");

  for (let el of elements) {
    const text = el.innerText?.trim();
    if (!text) continue;

    const price = extractPriceFromText(text);

    if (price) {
      return price;
    }
  }

  return null;
}

function waitForPrice() {
  return new Promise((resolve) => {
    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;

      const price = findPrice();

      if (price) {
        clearInterval(interval);
        resolve(price);
      }

      if (attempts > 40) {
        clearInterval(interval);
        resolve("Price not found");
      }

    }, 250);
  });
}

waitForPrice().then(price => {
  chrome.runtime.sendMessage({
    type: "FB_PRICE",
    price: price
  });
});
