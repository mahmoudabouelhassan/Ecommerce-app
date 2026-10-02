# 🛍️ MyStore — Full-Stack E-Commerce Platform

A complete e-commerce web application built with the MERN stack, featuring secure authentication, real-time cart synchronization, and integrated online payments via Stripe.

## 🚀 Live Demo
- Frontend: [your-frontend-url]
- Backend API: [your-backend-url]

## 📋 Features

- **Product Catalog** — Browse 100+ products across multiple categories with search, filtering, sorting, and pagination
- **User Authentication** — Secure registration/login with httpOnly cookie-based JWT sessions
- **Password Recovery** — Email-based password reset flow with expiring, hashed tokens
- **Shopping Cart & Wishlist** — Persisted per-user in the database, synced across devices and sessions
- **Stock Management** — Real-time stock validation with out-of-stock handling
- **Admin Dashboard** — Catalog editing, inventory adjustments with an audit trail, low-stock alerts, cash orders, and store settings
- **Related Products** — Smart product recommendations based on category
- **Secure Checkout** — Stripe Checkout with webhook-verified card payments or cash on delivery
- **Cash Collection** — COD stock reservation, customer cancellation with stock restoration, and admin-only collection confirmation
- **Order History** — Full order tracking with payment and shipping status
- **Dark/Light Mode** — Theme toggle with persisted user preference
- **Rate Limiting** — Protection against brute-force attacks on auth endpoints
- **Fully Responsive** — Optimized for mobile, tablet, and desktop

## 🛠️ Tech Stack

### Frontend
- React + Vite
- Redux Toolkit + RTK Query
- Redux Persist
- React Router DOM
- Tailwind CSS v4
- React Hook Form
- SweetAlert2
- Swiper.js
- Lucide React (icons)

### Backend
- Node.js + Express (ES Modules)
- MongoDB Atlas + Mongoose
- JWT Authentication (httpOnly cookies)
- Bcrypt.js (password hashing)
- Stripe API (Checkout + Webhooks)
- Resend (transactional emails)
- Express Rate Limit

## 🔒 Security Highlights

- Passwords hashed with bcrypt (12 salt rounds)
- JWT stored in httpOnly, secure cookies (XSS-resistant)
- Password reset tokens are hashed before storage and expire after 15 minutes
- Card payment confirmation relies solely on Stripe webhook signatures; COD payment is confirmed by an authorized admin after collection
- Rate limiting on authentication endpoints
- Generic error messages on password reset to prevent user enumeration

## ⚙️ Environment Variables

### Backend (`.env`)

Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` for the backend. The frontend build needs `VITE_API_URL` set to the backend's `/api` URL.

### Cash on delivery operations

Cash orders are created as `unpaid` and `pending`, with their stock reserved immediately. The customer can cancel a pending cash order from their profile, which restores stock. The admin dashboard is at `/admin`; its cash orders page at `/admin/cash-orders` lists cash orders. Use **Confirm cash collected & delivered** only after handing over the order and receiving the cash. That action records the collector, payment time, and delivered status. It cannot be repeated or applied to a cancelled order.

If a card payment completes after cash orders have reserved the remaining stock, the card order is recorded as paid with `stock_issue` and shown to the admin on the same page. The admin must arrange fulfillment or refund the customer through Stripe; do not treat such an order as unpaid.

To grant access, register the intended admin account first. From the `server` directory, with `MONGODB_URI` pointing to the correct database, run:

```sh
npm run admin:promote -- admin@example.com
```

The account must sign in again or refresh for the admin link to appear. Customers cannot grant themselves the admin role through registration or the API. MongoDB transactions are required for cash order creation and cancellation, so use a replica set or MongoDB Atlas for the backend database.

### Admin products and store settings

The dashboard lets an admin create products, edit their catalog details, and adjust stock with a required reason. The product form offers existing categories, a new-category option, and an image preview. Manual stock changes are atomic and recorded with the admin, previous quantity, new quantity, and time. The overview highlights low-stock and out-of-stock products, cash still due, paid card orders needing stock review, and recent stock changes. Settings control the store name and support email shown in the site plus the low-stock alert threshold.

The product form always takes an original price. For a discount, choose a final customer price or enter/select a percentage; the server calculates and stores the final price to cents. Product listings and detail pages show both prices when discounted. Cart, cash on delivery, and Stripe Checkout charge the final price. Existing products without an `originalPrice` continue to display their current price normally.

**Import JSON** on `/admin/products` accepts one product, an array, or `{ "products": [...] }` (up to 100 products / 1 MB). Each product needs `title`, `price`, `category`, and `stock`; `image`, `images`, and `description` are optional. Products without images display a built-in placeholder. If only `images` is supplied, its first URL becomes the main image. The dashboard offers a downloadable example and a server-side preview with each row's description, validation, and duplicate results. Select individual ready rows or toggle all ready rows before confirming; only selected products are sent for import. Import checks again when saving, adds only valid new products, and never overwrites existing ones. Duplicate matching uses product title and category without case sensitivity; removed products also count as duplicates and can be restored instead.

For JSON imports, `price` is the original price. An optional `discount` can be `{ "type": "price", "value": 39.99 }` for a final customer price, or `{ "type": "percentage", "value": 20 }` for a percentage discount. Omit `discount` when there is no discount. The preview shows the computed customer and original prices.

New products reuse the existing category spelling when the supplied name differs only in letter case. New category names keep the spelling first supplied. Public category lists and filters group legacy case variants together without changing existing database records. The downloadable [two-product JSON example](client/public/products-example.json) shows one product with plain image URLs and one without images.

### Categories and badges

Admins can manage categories and product badges under `/admin/catalog`. Existing product categories appear automatically, even if they predate this page. Renaming a category updates its products and catalog keys. Deleting a category with products requires choosing another category; products, including removed products, are moved there. A move that would produce duplicate product names is rejected. Categories can also be created from the product form.

The initial badge choices are New, Sale, Best Seller, Limited, and Featured. Admins can create, rename, recolor, and delete badges using a preset color or a custom Hex color such as `#e5e7eb`. A badge edit updates products using it; deleting one removes its label from products without deleting those products. The product form can select an existing badge, add a new one, or leave it blank. JSON imports may include an optional `badge` matching an existing badge name. Badges are visual labels and do not change prices; discounts are configured separately.

**Delete** removes a product from the storefront and blocks new purchases, but keeps its database record for historical orders and stock returns. The **Removed products** filter lets an admin restore it. An already-created card checkout can still complete and use the preserved product record.

The demo seed does not delete or overwrite existing products and refuses to run when `NODE_ENV=production`. To add missing demo products to a non-production database, confirm its actual MongoDB database name explicitly:

```sh
cd server
npm run seed -- --confirm-db=YOUR_DATABASE_NAME
```

The command aborts before changing data if the connected database name differs from the confirmation.
