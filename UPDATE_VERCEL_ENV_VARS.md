# ⚠️ IMPORTANT: Update Vercel Environment Variables

## The payment is now working locally, but Vercel still has the OLD Razorpay keys!

### Steps to Update Vercel:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `praahis-restaurant`

2. **Navigate to Settings → Environment Variables**
   - URL: https://vercel.com/prashanthkr7799/praahis-restaurant/settings/environment-variables

3. **Update These Variables:**

   **VITE_RAZORPAY_KEY_ID**
   - Current (wrong): `rzp_test_RQzRCNUa5BpCt6`
   - New (correct): `rzp_test_Rh6FjJwAtY7xRk`
   - Environments: Production, Preview, Development (check all)

   **VITE_RAZORPAY_KEY_SECRET**
   - Current (wrong): `OnuEiPkNtBgRqfF5E5qBSsaC`
   - New (correct): `LiGE03TjEpHw4EetxGkiQdd3`
   - Environments: Production, Preview, Development (check all)

4. **Redeploy**
   - After saving, click "Redeploy" or wait for auto-deploy from Git push
   - OR go to Deployments → Click ⋯ → Redeploy

## ✅ What's Already Done:
- ✅ Local `.env.local` updated with new keys
- ✅ Supabase Edge Function secrets updated
- ✅ Edge Function TypeScript errors fixed
- ✅ Code pushed to GitHub
- ✅ Test HTML confirms new keys work

## 🧪 Test After Vercel Update:
1. Scan QR code on mobile
2. Add items to cart
3. Click "Pay Now"
4. ✅ Razorpay modal should open WITHOUT errors
5. Use test card: 4111 1111 1111 1111, CVV: 123, Expiry: 12/25

---

**Keys Source:** Downloaded from Razorpay Dashboard on 18 Nov 2025, 11:43 AM
**File:** `/Users/prashanth/Downloads/rzp-key (1).csv`
