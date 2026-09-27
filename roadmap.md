# Roadmap

- [ ] Fix category counts to match real sample products (Skincare 2, Makeup 1, Hair 1, Fragrance 0 → show "Coming soon")
- [ ] Enable email/password auth + Google sign-in (Lovable Cloud)
- [ ] Migration: profiles (name, phone — phone later used for bulk SMS), addresses, wishlist_items, cart_items + RLS + grants + signup trigger
- [ ] /auth page (email sign-in/up with name+phone, Google button)
- [ ] Session-aware header (Sign in ↔ account) + root auth listener
- [ ] Account-based bag sync: merge local bag on sign-in, sync changes to cart_items, works across devices
- [ ] Account page: real profile, addresses, wishlist wired to tables
- [ ] Bearer middleware in src/start.ts
- [ ] Verify in browser end-to-end (sign up → add to bag → reload → bag persists)
