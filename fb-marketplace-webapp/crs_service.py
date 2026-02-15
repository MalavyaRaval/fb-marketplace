"""
CRS (Credit Reporting Service) Integration Module
Handles user lookup and credit profile retrieval
"""

import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class CRSClient:
    """
    Generic CRS (Credit Reporting Service) client
    Supports integration with various credit bureaus (Equifax, Experian, TransUnion, etc.)
    """

    def __init__(self, api_key: Optional[str] = None, api_base: Optional[str] = None):
        """
        Initialize CRS client with API credentials.
        
        Args:
            api_key: API key for CRS service (from environment or config)
            api_base: Base URL for CRS API (from environment or config)
        """
        self.api_key = api_key or os.getenv("CRS_API_KEY")
        self.api_base = api_base or os.getenv("CRS_API_BASE", "https://crs-api.example.com")
        self.timeout = 10  # seconds

    def lookup_user(self, name: str, dob: str) -> Optional[Dict[str, Any]]:
        """
        Look up user in CRS database by name and date of birth.
        
        Args:
            name: Full name of user
            dob: Date of birth in format MM/DD/YYYY
            
        Returns:
            User credit profile or None if not found
        """
        if not self.api_key:
            logger.warning("CRS_API_KEY not set, using mock data")
            return self._get_mock_user_data(name, dob)
        
        # In production, make actual API call to CRS
        # This is a placeholder
        try:
            # import requests
            # response = requests.post(
            #     f"{self.api_base}/lookup",
            #     json={"name": name, "dob": dob},
            #     headers={"Authorization": f"Bearer {self.api_key}"},
            #     timeout=self.timeout
            # )
            # return response.json() if response.status_code == 200 else None
            pass
        except Exception as e:
            logger.error(f"CRS API error: {e}")
            return None

    def _get_mock_user_data(self, name: str, dob: str) -> Dict[str, Any]:
        """
        Mock user data for testing (simulates CRS response).
        In production, this would come from actual CRS API.
        """
        # Generate mock credit data based on name hash (deterministic for testing)
        name_hash = hash(name) % 100
        
        mock_profiles = {
            "excellent": {
                "credit_score": 750 + (name_hash % 50),  # 750-800
                "credit_tier": "excellent",
                "payment_history": "excellent",
                "debt_to_income": 10 + (name_hash % 15),  # 10-25%
                "availability_score": 95
            },
            "good": {
                "credit_score": 670 + (name_hash % 70),  # 670-740
                "credit_tier": "good",
                "payment_history": "good",
                "debt_to_income": 25 + (name_hash % 20),  # 25-45%
                "availability_score": 85
            },
            "fair": {
                "credit_score": 580 + (name_hash % 80),  # 580-660
                "credit_tier": "fair",
                "payment_history": "fair",
                "debt_to_income": 45 + (name_hash % 25),  # 45-70%
                "availability_score": 70
            },
            "poor": {
                "credit_score": 300 + (name_hash % 280),  # 300-580
                "credit_tier": "poor",
                "payment_history": "poor",
                "debt_to_income": 70 + (name_hash % 30),  # 70-100%
                "availability_score": 50
            }
        }
        
        # Pick tier based on name_hash
        tier = list(mock_profiles.keys())[(name_hash // 25) % 4]
        profile = mock_profiles[tier].copy()
        
        return {
            "name": name,
            "dob": dob,
            "credit_profile": profile,
            "recommended_price_range": self._get_price_range_for_tier(tier),
            "address": {
                "city": "Mock City",
                "state": "MC",
                "zip": f"{(name_hash * 13337) % 90000:05d}"
            },
            "data_source": "mock"  # Mark as mock for testing
        }

    @staticmethod
    def _get_price_range_for_tier(tier: str) -> Dict[str, float]:
        """Get recommended price range based on credit tier."""
        ranges = {
            "excellent": {"min": 100, "max": 5000},
            "good": {"min": 50, "max": 2000},
            "fair": {"min": 20, "max": 800},
            "poor": {"min": 10, "max": 300}
        }
        return ranges.get(tier, ranges["good"])

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Alternative: Look up user by email if they're logged into ecommerce site.
        This would make an API call to get associated credit profile.
        """
        if not self.api_key:
            logger.warning("CRS_API_KEY not set, using mock data")
            return self._get_mock_email_user(email)
        
        # In production, make actual API call
        # response = requests.get(
        #     f"{self.api_base}/user/{email}",
        #     headers={"Authorization": f"Bearer {self.api_key}"},
        #     timeout=self.timeout
        # )
        # return response.json() if response.status_code == 200 else None
        return None

    @staticmethod
    def _get_mock_email_user(email: str) -> Dict[str, Any]:
        """Generate mock user data from email."""
        email_hash = hash(email) % 100
        
        tiers = ["excellent", "good", "fair", "poor"]
        tier = tiers[(email_hash // 25) % 4]
        
        return {
            "email": email,
            "credit_profile": CRSClient._get_profile_for_tier(tier),
            "recommended_price_range": CRSClient._get_price_range_for_tier(tier),
            "address": {
                "city": "Mock City",
                "state": "MC",
                "zip": f"{(email_hash * 13337) % 90000:05d}"
            },
            "data_source": "mock"
        }

    @staticmethod
    def _get_profile_for_tier(tier: str) -> Dict[str, Any]:
        """Get credit profile for a tier."""
        profiles = {
            "excellent": {
                "credit_score": 770,
                "credit_tier": "excellent",
                "payment_history": "excellent",
                "debt_to_income": 15,
                "availability_score": 95
            },
            "good": {
                "credit_score": 700,
                "credit_tier": "good",
                "payment_history": "good",
                "debt_to_income": 35,
                "availability_score": 85
            },
            "fair": {
                "credit_score": 620,
                "credit_tier": "fair",
                "payment_history": "fair",
                "debt_to_income": 55,
                "availability_score": 70
            },
            "poor": {
                "credit_score": 450,
                "credit_tier": "poor",
                "payment_history": "poor",
                "debt_to_income": 85,
                "availability_score": 50
            }
        }
        return profiles.get(tier, profiles["good"])

    def sanitize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove sensitive financial details before sending to client.
        Keep only what's needed for personalization.
        """
        if not data:
            return None
        
        return {
            "score_tier": data.get("credit_profile", {}).get("credit_tier"),
            "location": data.get("address"),
            "price_range": data.get("recommended_price_range"),
            "availability": data.get("credit_profile", {}).get("availability_score"),
            # Don't send actual credit score to client
            # Don't send specific debt-to-income ratio
        }


# Global CRS client instance
_crs_client = None


def get_crs_client():
    """Get or create CRS client singleton."""
    global _crs_client
    if _crs_client is None:
        _crs_client = CRSClient()
    return _crs_client
