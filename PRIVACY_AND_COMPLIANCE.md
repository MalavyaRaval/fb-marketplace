# Privacy & Compliance Policy

**IMPORTANT:** This document outlines legal and regulatory considerations for using credit reporting data. **Consult with legal counsel before deploying to production.**

## Regulatory Framework

### Fair Credit Reporting Act (FCRA)

The FCRA governs how credit information can be obtained, used, and shared. **Your extension must comply.**

#### What Requires FCRA Compliance:

✅ **Compliance Needed:**
- Accessing credit reports
- Using credit scores for decisions
- Using credit data to filter/recommend products
- Accessing consumer financial profiles

❌ **NOT Covered (you're doing this):**
- Storing financial info
- Making lending decisions
- Employment screening
- Tenant screening

#### FCRA Requirements You Must Follow:

1. **Consumer Consent**
   - Must explicitly disclose you'll access credit data
   - Must get signed consent before lookup
   - Must explain how data will be used
   - "I consent to credit profile lookup for personalized product recommendations"

2. **Disclosures**
   - State that CRS data will be accessed
   - Explain type of information used
   - Show how it affects recommendations
   - Provide opt-out option

3. **Accuracy**
   - CRS data must be current
   - Must allow consumer disputes
   - Must remove inaccurate data

4. **Privacy**
   - Don't share credit data with third parties
   - Don't use for purposes beyond personalization
   - Must delete after recommendation
   - Secure all transmissions (HTTPS)

### CFPB Oversight

The Consumer Financial Protection Bureau (CFPB) oversees FCRA compliance.

**Penalties for Non-Compliance:**
- Civil penalties: $43,280+ per violation (2024)
- Corrective action orders
- Public enforcement actions
- Class action lawsuits (up to $5,000 per consumer)

### California Consumer Privacy Act (CCPA)

If users are in California, you must comply with CCPA.

#### CCPA Requires:
- Right to know what data is collected
- Right to delete personal data
- Right to opt-out of data sale
- Do Not Sell signal support
- Privacy policy explaining practices

#### Your Obligations:
✅ Keep privacy policy updated  
✅ Allow data deletion requests  
✅ Don't use credit data beyond stated purposes  
✅ Secure all consumer data  
✅ Respond to data requests within 45 days  

### Other Regulations

**GDPR (Europe):**
- Consent before ANY data collection
- Data processing agreements
- Right to erasure
- Data portability rights

**Gramm-Leach-Bliley Act (GLBA):**
- If handling financial data
- Requires privacy notices
- Limits sharing of financial info
- Must secure consumer information

## Implementation Checklist

### Before Going Live:

- [ ] Consult with legal counsel (FCRA specialist)
- [ ] Draft privacy policy
- [ ] Create user consent form
- [ ] Implement explicit consent flow
- [ ] Add data deletion functionality
- [ ] Add opt-out option
- [ ] Setup HTTPS everywhere
- [ ] Audit data handling
- [ ] Setup data retention policy
- [ ] Create dispute resolution process
- [ ] Setup incident response plan
- [ ] Get E&O insurance (errors & omissions)

### Privacy Policy Elements Required:

```markdown
# Privacy Policy

## 1. What Data We Collect
- Name and date of birth (for CRS lookup)
- Email address (if logged in)
- Product search history
- Credit profile tier (not full credit report)
- Approximate location

## 2. How We Use It
- To find sustainable product alternatives
- To personalize recommendations based on price tier
- To show products within your financial capacity
- NOT for lending, employment, or other decisions

## 3. Credit Data Usage
- We access credit profile data via [CRS Provider]
- Data is used ONLY for personalization
- Full credit score is not shown
- Data is deleted after recommendation is shown
- You can opt-out anytime

## 4. Your Rights
- Right to know what data we have
- Right to delete your data
- Right to opt-out of personalization
- Right to dispute inaccurate recommendations

## 5. Data Security
- All data transmitted over HTTPS
- Data stored encrypted at rest
- Access limited to necessary personnel
- Regular security audits

## 6. Contact Us
[email/contact info]
```

### Consent Form Template:

```html
<form id="crs-consent">
  <h3>Credit Profile Personalization</h3>
  
  <p>To provide personalized product recommendations, we'll look up your credit profile.</p>
  
  <label>
    <input type="checkbox" name="crs_consent" required>
    I consent to an inquiry into my credit profile to help personalize sustainable product
    recommendations. This will not affect my credit score.
  </label>
  
  <label>
    <input type="checkbox" name="understand" required>
    I understand my credit profile tier will be used to filter recommendations by price range,
    but my actual credit score will not be shown or used for lending decisions.
  </label>
  
  <label>
    <input type="checkbox" name="privacy" required>
    I have read and agree to the <a href="/privacy" target="_blank">Privacy Policy</a>
  </label>
  
  <button type="submit">Personalize for Me</button>
  <button type="button" onclick="skipPersonalization()">Show Generic Recommendations</button>
</form>
```

### Data Deletion Endpoint:

```python
@app.route("/api/delete-user-data", methods=["DELETE"])
def delete_user_data():
    """Delete all stored data for a user"""
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "email required"}), 400
    
    # Delete from all tables/caches
    # 1. Delete from cache
    # 2. Delete from database
    # 3. Send deletion notice to CRS provider
    # 4. Log deletion for compliance
    
    return jsonify({
        "success": True,
        "message": "All data has been deleted"
    })
```

## Example Compliant Flow

```javascript
// 1. Check if user has consented
const hasConsent = localStorage.getItem("crs_consent");

if (!hasConsent) {
  // 2. Show consent form
  showConsentModal({
    title: "Personalized Recommendations",
    message: "We'll look up your credit profile to show you options within your price range",
    onConsent: () => {
      // 3. Mark consent
      localStorage.setItem("crs_consent", "true");
      localStorage.setItem("crs_consent_date", new Date().toISOString());
      
      // 4. Proceed with CRS lookup
      lookupUserInCRS(userInfo);
    },
    onDecline: () => {
      // 5. Show generic recommendations
      fetchSustainableAlternatives(productInfo);
    }
  });
}
```

## Data Retention Policy

**How long we keep data:**

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Consent records | 3 years | Legal compliance |
| Search history | 90 days | Log analysis |
| Credit profile | Session only | Personalization |
| User email | Until deleted | Account management |
| IP address | 30 days | Security logging |

**After retention period:**
- Automatically deleted
- Encrypted before deletion
- Logging shows deletion
- Notified to user on request

## Incident Response Plan

**If data is breached:**

1. **Immediate (24 hours)**
   - Identify scope of breach
   - Secure affected systems
   - Alert internal team

2. **Quick (48-72 hours)**
   - Notify affected users (if credit data)
   - Report to state attorney general (if 500+)
   - Contact CRS provider
   - Begin investigation

3. **Follow-up (30 days)**
   - Complete investigation
   - Implement fixes
   - Notify other stakeholders
   - Document lessons learned

4. **Long-term**
   - File reports with authorities
   - Offer credit monitoring (if payment data breached)
   - Update security practices
   - Insurance claim (E&O policy)

## Sample Notifications

### Pre-Lookup Notification

```
Before we personalize recommendations:

🔐 We'll look up your credit profile tier
(This does not affect your credit score)

✓ Your actual credit score is not shown
✓ Data is only used for price filtering
✓ Data is deleted after this session
✓ You can opt-out anytime

Once you proceed, we'll be able to:
• Filter products by your price capacity
• Show you the best value options
• Match you with lenders if needed

Continue?  [Personalize] [Skip]
```

### Post-Lookup Display

```
📊 Personalized for You

Based on your profile, we're showing options
in the $20-800 range

This helps us recommend products you're 
more likely to achieve with better financing.

[Settings] [Opt-out] [More info]
```

## Audit Trail Example

```python
# Log all CRS access for compliance
def log_crs_access(email, name, dob, result):
    audit_log = {
        "timestamp": datetime.now().isoformat(),
        "user": email,
        "action": "crs_lookup",
        "result": "success" if result else "failed",
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
        "consent_obtained": get_consent_status(email),
        "reason": "sustainable product personalization"
    }
    
    # Store in immutable audit log
    AuditLog.create(**audit_log)
    
    # Alert on suspicious activity
    if too_many_lookups(email):
        alert_security_team(audit_log)
```

## Warning Signs of Non-Compliance

🚨 **RED FLAGS:**

- Using credit data for lending decisions
- Sharing credit profile with advertisers
- Storing full credit reports
- Denying access when user asks
- No privacy policy posted
- No opt-out option
- Not responding to data deletion requests
- Using credit data beyond stated purpose
- No consent before lookup
- Not using HTTPS

## Legal Boilerplate

**Add to your privacy policy:**

```
By using this extension, you acknowledge:

1. We access credit reporting data via [Provider]
2. This is for personalization only
3. Your credit score is not affected
4. You can opt-out at any time
5. You can request data deletion
6. We comply with FCRA and CCPA
7. We secure all personal information

For FCRA compliance: [CRS Provider] is a
[select one] Credit Reporting Agency that
compiles and maintains consumer credit
information files that contain credit
information about consumers.
```

## Questions Before Launch

Ask your legal team:

1. ✅ Do we have proper FCRA licensing?
2. ✅ Is our consent flow compliant?
3. ✅ Do we have data processing agreements?
4. ✅ Is our privacy policy adequate?
5. ✅ Do we have E&O insurance?
6. ✅ Have we tested complaint procedures?
7. ✅ Do we have incident response plan?
8. ✅ Are we GDPR compliant (if EU users)?
9. ✅ Are we CCPA compliant (if CA users)?
10. ✅ Do we comply with GLBA (if financial)?

## Resources

- [FCRA Overview](https://www.ftc.gov/business-guidance/privacy-security/fcra)
- [CFPB Better Information](https://www.consumerfinance.gov/)
- [CCPA Compliance](https://oag.ca.gov/privacy/ccpa)
- [GDPR Guide](https://gdpr.eu/)
- [Credit Bureau Rights](https://www.ftc.gov/article/your-rights-under-fcra)

---

## TL;DR Compliance Checklist

```
BEFORE DEPLOYING:

[ ] Get written legal approval
[ ] Add privacy policy
[ ] Create consent flow
[ ] Implement data deletion
[ ] Add opt-out option
[ ] Switch to HTTPS
[ ] Use sanitize_data()
[ ] Don't log credit scores
[ ] Get E&O insurance
[ ] Setup audit logs
[ ] Create incident plan
[ ] Test data retention
[ ] Document everything
[ ] Get CRS provider approval
[ ] Beta test with real users
[ ] Get legal sign-off again

AFTER DEPLOYING:

[ ] Monitor FCRA compliance
[ ] Respond to user requests
[ ] Track data access
[ ] Update privacy policy if needed
[ ] Review frequently for changes
[ ] Keep audit logs
[ ] Report to authorities if breach
[ ] Annual compliance review

IF BREACH OCCURS:

[ ] Notify users within 24h
[ ] Contact authorities
[ ] Begin investigation
[ ] Document everything
[ ] Follow incident response plan
```

---

**⚠️ This is NOT legal advice. Consult with a lawyer specializing in financial services law and data privacy before deploying.**
