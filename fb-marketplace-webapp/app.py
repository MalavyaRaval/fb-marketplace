"""
FB Marketplace Helper - Web App
Serves the UI. Gemini API is called directly from the browser (avoids Python segfault on macOS).
"""
import os
import logging

from flask import Flask, Response, jsonify, render_template, request
from crs_service import get_crs_client

app = Flask(__name__)
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp
app.secret_key = os.urandom(24)

# In-memory store for the extension
_payload = {"message": "", "searchKeyword": "", "maxPrice": None, "minPrice": None}
_logs = []


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.route("/favicon.ico")
def favicon():
    return Response(status=204)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/store-message", methods=["POST"])
def store_message():
    """Store message and search params for the extension."""
    global _payload
    data = request.get_json(silent=True) or {}
    _payload = {
        "message": data.get("message", ""),
        "searchKeyword": data.get("searchKeyword", ""),
        "maxPrice": data.get("maxPrice"),
        "minPrice": data.get("minPrice"),
    }
    return jsonify({"success": True})


@app.route("/api/latest-message")
def latest_message():
    """Return the full payload (used by the sender extension)."""
    return jsonify(_payload)


@app.route("/api/log-sent", methods=["POST"])
def log_sent():
    """Store a record when the extension sends a message. Useful for tracking/testing.

    Expects JSON: { conversationId, listing: { title, price, description }, message }
    """
    data = request.get_json(silent=True) or {}
    entry = {
        "conversationId": data.get("conversationId"),
        "listing": data.get("listing"),
        "message": data.get("message"),
        "timestamp": int(__import__('time').time())
    }
    _logs.append(entry)
    return jsonify({"success": True})


@app.route("/api/logs")
def get_logs():
    return jsonify(_logs)


@app.route("/api/find-sustainable-products", methods=["POST"])
def find_sustainable_products():
    """Find sustainable product alternatives.
    
    Expected JSON body:
    {
        "productName": "string",
        "currentPrice": "float (optional)",
        "category": "string (optional)",
        "description": "string (optional)"
    }
    
    Returns:
    {
        "success": true,
        "alternatives": [
            {
                "name": "product name",
                "price": 99.99,
                "co2_savings": 45.5,
                "source": "amazon|target|ebay|etc",
                "url": "product url",
                "sustainable_reason": "reason why it's sustainable"
            }
        ]
    }
    """
    data = request.get_json(silent=True) or {}
    product_name = data.get("productName", "")
    
    if not product_name:
        return jsonify({"success": False, "error": "productName required"}), 400
    
    # Mock sustainable alternatives database
    # In production, this would query a real database or API
    alternatives = _get_sustainable_alternatives(product_name, data)
    
    return jsonify({
        "success": True,
        "alternatives": alternatives
    })


def _get_sustainable_alternatives(product_name, data):
    """Generate sustainable alternatives based on product name."""
    # This is a mock implementation. You'll want to:
    # 1. Query a real database of sustainable products
    # 2. Use AI/ML to match the current product to sustainable alternatives
    # 3. Include real pricing and carbon data
    
    alternatives = []
    product_lower = product_name.lower()
    
    # Example mapping - replace with real data source
    sustainable_db = {
        "phone": [
            {
                "name": "Refurbished iPhone 12",
                "price": 399,
                "co2_savings": 65,
                "reason": "Refurbished reduces manufacturing emissions by 65%"
            },
            {
                "name": "Used iPhone 11",
                "price": 299,
                "co2_savings": 70,
                "reason": "Pre-owned reduces new production waste"
            }
        ],
        "chair": [
            {
                "name": "Upcycled Office Chair",
                "price": 89,
                "co2_savings": 35,
                "reason": "Made from recycled materials"
            },
            {
                "name": "Wooden Sustainable Chair",
                "price": 179,
                "co2_savings": 28,
                "reason": "FSC-certified wood from sustainable forests"
            }
        ],
        "table": [
            {
                "name": "Reclaimed Wood Table",
                "price": 249,
                "co2_savings": 42,
                "reason": "Reclaimed wood reduces deforestation"
            },
            {
                "name": "Bamboo Dining Table",
                "price": 199,
                "co2_savings": 38,
                "reason": "Bamboo is highly renewable and durable"
            }
        ],
        "laptop": [
            {
                "name": "Certified Refurbished Laptop",
                "price": 599,
                "co2_savings": 85,
                "reason": "Refurbished saves up to 85% in manufacturing emissions"
            }
        ],
        "clothing": [
            {
                "name": "Organic Cotton Shirt",
                "price": 45,
                "co2_savings": 12,
                "reason": "Organic cotton uses 91% less water"
            },
            {
                "name": "Recycled Polyester Jacket",
                "price": 89,
                "co2_savings": 18,
                "reason": "Made from recycled plastic bottles"
            }
        ]
    }
    
    # Try to match to a category
    for category, products in sustainable_db.items():
        if category in product_lower:
            alternatives = products[:5]  # Return top 5
            break
    
    # If no match, return generic sustainable alternatives
    if not alternatives:
        alternatives = [
            {
                "name": "Refurbished/Pre-owned Option",
                "price": "Contact seller",
                "co2_savings": "50-70%",
                "reason": "Extending product life reduces eco impact"
            },
            {
                "name": "Rental Service",
                "price": "Variable",
                "co2_savings": "60-80%",
                "reason": "Sharing reduces manufacturing demand"
            }
        ]
    
    return alternatives


@app.route("/api/lookup-user", methods=["POST"])
def lookup_user():
    """Look up user credit profile based on name and DOB.
    
    Expected JSON:
    {
        "name": "John Doe",
        "dob": "01/15/1990"
    }
    
    Returns user profile with price tier recommendations (sensitive data sanitized)
    """
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    dob = data.get("dob", "").strip()
    
    if not name or not dob:
        return jsonify({
            "success": False,
            "error": "name and dob required"
        }), 400
    
    crs = get_crs_client()
    user_data = crs.lookup_user(name, dob)
    
    if not user_data:
        return jsonify({
            "success": False,
            "error": "User not found in credit records"
        }), 404
    
    # Sanitize sensitive data before sending to client
    sanitized = crs.sanitize_data(user_data)
    
    return jsonify({
        "success": True,
        "user_profile": sanitized,
        "data_source": user_data.get("data_source")
    })


@app.route("/api/lookup-user-by-email", methods=["POST"])
def lookup_user_by_email():
    """Look up logged-in user by email (from ecommerce site login).
    
    Expected JSON:
    {
        "email": "user@example.com"
    }
    
    Returns user profile with price tier recommendations
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    
    if not email:
        return jsonify({
            "success": False,
            "error": "email required"
        }), 400
    
    crs = get_crs_client()
    user_data = crs.get_user_by_email(email)
    
    if not user_data:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404
    
    # Sanitize sensitive data
    sanitized = crs.sanitize_data(user_data)
    
    return jsonify({
        "success": True,
        "user_profile": sanitized,
        "data_source": user_data.get("data_source")
    })


@app.route("/api/find-sustainable-products", methods=["POST"])
def find_sustainable_products():
    """Find sustainable alternatives, optionally personalized by user credit profile.
    
    Expected JSON body:
    {
        "productName": "string",
        "currentPrice": "float (optional)",
        "category": "string (optional)",
        "userProfile": {
            "score_tier": "excellent|good|fair|poor",
            "price_range": {"min": X, "max": Y},
            "location": {"city": "...", "state": "...", "zip": "..."}
        }
    }
    """
    data = request.get_json(silent=True) or {}
    product_name = data.get("productName", "")
    user_profile = data.get("userProfile")
    
    if not product_name:
        return jsonify({"success": False, "error": "productName required"}), 400
    
    # Get base alternatives
    alternatives = _get_sustainable_alternatives(product_name, data)
    
    # Personalize by user profile if available
    if user_profile:
        alternatives = _filter_by_user_profile(alternatives, user_profile)
    
    return jsonify({
        "success": True,
        "alternatives": alternatives,
        "personalized": bool(user_profile)
    })


def _filter_by_user_profile(alternatives, user_profile):
    """Filter and rank alternatives based on user credit profile and price tier."""
    
    price_range = user_profile.get("price_range", {})
    score_tier = user_profile.get("score_tier", "good")
    
    # Priority levels by credit tier (higher = more premium options shown first)
    tier_priority = {
        "excellent": 4,
        "good": 3,
        "fair": 2,
        "poor": 1
    }
    
    priority = tier_priority.get(score_tier, 3)
    
    # Filter alternatives within user's price range
    filtered = []
    for alt in alternatives:
        price = alt.get("price")
        
        # Skip if price is not a number (e.g., "Contact seller")
        if not isinstance(price, (int, float)):
            # Always include options without clear pricing for lower tiers
            if priority <= 2:
                filtered.append(alt)
            continue
        
        # Check if price is within user's recommended range
        if price_range.get("min") and price_range.get("max"):
            if price_range["min"] <= price <= price_range["max"]:
                filtered.append(alt)
        else:
            # No price range specified, include all
            filtered.append(alt)
    
    # If no alternatives match price range, show closest ones with warning
    if not filtered and alternatives:
        filtered = alternatives[:3]
        # Add note about price range
        for alt in filtered:
            alt["note"] = "Note: Outside your typical price range"
    
    # Sort by CO₂ savings (prioritize environmental impact)
    filtered = sorted(
        filtered,
        key=lambda x: (
            # First sort by carbon savings (descending)
            -float(str(x.get("co2_savings", 0)).replace("kg CO₂", "").replace("%", "").strip() or 0),
            # Then by price (if in range, prefer lower)
            x.get("price") if isinstance(x.get("price"), (int, float)) else float('inf')
        )
    )
    
    # Add personalization notes
    for i, alt in enumerate(filtered):
        if i == 0:
            alt["badge"] = "💡 Recommended for you"
        elif i == 1:
            alt["badge"] = "💚 Also great choice"
    
    return filtered[:5]  # Return top 5 filtered alternatives


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False, port=5001)
