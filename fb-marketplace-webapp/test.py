# post_payload.py
import requests

payload = {
  "message": "Hello, is this still available?",
  "searchKeyword": "bike",
  "maxPrice": 200
}

r = requests.post("http://127.0.0.1:5001/api/store-message", json=payload)
print(r.status_code, r.text)