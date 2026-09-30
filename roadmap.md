# Roadmap

## Done
- Customer storefront (home, shop, product, cart, checkout, track, salon, account) — visual, burgundy/gold brand
- Staff ERP section (dashboard, orders, POS, inventory, salon ops, audit log)
- Cart provider mounted at root; branded error boundary with recovery screen
- Lovable Cloud: email/password + Google sign-in, /auth page, session-aware header with sign-out
- Account-based bag sync (guest localStorage merges into cart_items on sign-in, syncs across devices) — verified end-to-end
- Profiles (name + phone for future bulk SMS), addresses, wishlist — tables, RLS, signup trigger; account page wired to real data
- Category product counts computed from real products; Fragrance shows "Coming soon"
- Branded root meta (no "Lovable App")

## Open
- ERP blueprint modules not yet built: products, customers, suppliers, finance, reports, settings (see mem://features/erp-blueprint)
- ERP pages browser-tested only partially
- Checkout creates no real orders yet (demo payment flow)
- Bulk SMS integration using collected phone numbers (future)
