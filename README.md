# Restaura
## Quick setup (Supabase + seed)

1) Copy env template and fill values from your Supabase project

```
cp .env.example .env.local
# edit .env.local and set:
# - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (the project's anon key)
# - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service role, used by node seed scripts)
# - optional SEED_OWNER_PASSWORD
```

2) Apply database migrations for Owner support (in Supabase SQL editor)

- Open the SQL editor and run the contents of:
   - `database/18_users_is_owner.sql`
   - `database/19_is_owner_function_upgrade.sql`

3) Seed tenants + accounts (owner + managers)

```
npm run seed:tenants
```

After seeding, you should see summary URLs and credentials in the terminal, including:

- Super Admin: `admin@praahis.com` / password from `SEED_OWNER_PASSWORD` (or `Praahis@123` default)
- Manager accounts per tenant (e.g., `manager@tabun.local` / `Tabun@123`)

4) Run the app

```
npm run dev
```

Logins:

- Owner: `/superadmin/login`
- Manager: `/manager/login` (legacy alias `/admin/login`)

Notes:

- If you see "Invalid login credentials", ensure the seeder ran against the SAME project your app is configured to use.
- For production, never expose the service role key; it is for local scripts only.

# 🍽️ Tabun - Restaurant Management System# 🍽️ Tabun - Restaurant Management System# 🍽️ Tabun - Restaurant Management System# 🍽️ Tabun Restaurant Management System# MealMate – Digital Dining System



Modern QR code-based restaurant ordering system with real-time updates.



---Modern QR code-based restaurant ordering system with real-time updates.



## ✨ Features



### For Customers## Features## Project Overview

- 📱 QR code table ordering

- 🔄 Real-time order tracking

- 🛒 Interactive cart with live updates

- 💳 Secure payment integration- QR code table ordering

- ⭐ Feedback and rating system

- 🍕 Browse menu by category- Real-time order tracking



### For Staff- Waiter, Chef, and Admin dashboards**Tabun** is a modern, full-stack restaurant management system designed to streamline the dining experience for both customers and staff. It features QR code-based ordering, real-time order tracking, and comprehensive dashboards for waiters, chefs, and administrators.A modern, full-featured restaurant management platform with QR-based ordering, real-time kitchen display, and comprehensive admin portal.![React](https://img.shields.io/badge/React-18.3.1-blue) ![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC) ![React Router](https://img.shields.io/badge/React_Router-7.1.1-CA4245)

- 👨‍🍳 **Chef Dashboard** - Kitchen order queue with real-time updates

- 🧑‍💼 **Waiter Dashboard** - Table management with 5-second auto-refresh- Payment integration

- 🛡️ **Admin Panel** - Complete system control and analytics

- 📊 Real-time notifications- Customer feedback

- 📈 Sales reports and insights

- Automatic table management

### Technical Highlights

- ✅ Automatic table status management (occupied/available)## ✨ Key Features

- ✅ Real-time Supabase subscriptions

- ✅ 5-second polling fallback## Tech Stack

- ✅ Responsive design (mobile, tablet, desktop)

- ✅ Smooth animations with Framer Motion



---- React 19 + Vite



## 🛠️ Tech Stack- Supabase (PostgreSQL + Realtime)### For Customers## 📖 Complete DocumentationThis project is a **demo and marketing website** for the **MealMate restaurant solution**.  



**Frontend**- Tailwind CSS

- React 19

- Vite (build tool)- Framer Motion- **QR Code Ordering**: Scan table QR code to instantly access the menu

- Tailwind CSS

- Framer Motion

- React Router v6

- Lucide React (icons)## Quick Start- **Real-time Order Tracking**: Live updates on order preparation and serving statusIt showcases features like **QR-based ordering**, **live kitchen updates**, **secure payments**, and **analytics**.



**Backend**

- Supabase

  - PostgreSQL database```bash- **Interactive Menu**: Browse items by category with images and descriptions

  - Real-time subscriptions

  - Authentication# Install dependencies

  - Row Level Security (RLS)

npm install- **Cart Management**: Add/remove items, customize orders before checkout**For detailed information about all features, pages, routes, and setup instructions, see:**

**Other**

- QR Code generation

- Razorpay payment integration

- ESLint for code quality# Set up .env file with Supabase credentials- **Secure Payments**: Integrated payment processing



---VITE_SUPABASE_URL=your_url



## 🚀 Quick StartVITE_SUPABASE_ANON_KEY=your_key- **Feedback System**: Rate your experience and provide comments---



### 1. Install Dependencies

```bash

npm install# Run database scripts in order- **Post-Meal Options**: Choose to order more or complete your visit

```

# 1. schema.sql

### 2. Set Up Environment Variables

Create a `.env.local` file in the root:# 2. seed.sql👉 **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** 👈

```env

VITE_SUPABASE_URL=your_supabase_project_url# 3. enable-realtime.sql

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

```### For Staff



### 3. Set Up Database# Start development server

Go to your Supabase project → SQL Editor and run scripts in order:

npm run dev- **Waiter Dashboard**: ## 🚀 Features

```sql

-- 1. Create tables, functions, and triggers```

database/01_schema.sql

  - Real-time table status (Available, Occupied, Ordering, Eating)

-- 2. Add sample data (restaurant, tables, menu items, users)

database/02_seed.sql## Project Structure



-- 3. Enable real-time subscriptions  - Active order management## 🚀 Quick Start

database/03_enable_realtime.sql

```

-- 4. FOR TESTING: Disable RLS (easier development)

database/04_disable_rls_testing.sqlTabun/  - Order history and analytics



-- FOR PRODUCTION: Use this instead├── src/

-- database/05_production_rls.sql

```│   ├── pages/          # All page components  - Auto-refresh every 5 seconds### Current Features (Phase 0)



📖 **See `database/README.md` for detailed setup instructions**│   ├── Components/     # Reusable components



### 4. Start Development Server│   ├── lib/           # Supabase client

```bash

npm run dev│   └── utils/         # Helper functions

```

├── database/- **Chef Dashboard**:```bash- ✅ **Marketing Homepage** - Beautiful hero section with call-to-action

Visit `http://localhost:5173`

│   ├── schema.sql     # Database structure

---

│   ├── seed.sql       # Sample data  - Incoming order queue

## 📁 Project Structure

│   └── enable-realtime.sql

```

Tabun/└── public/            # Static assets  - Mark items as prepared# 1. Install dependencies- ✅ **Features Section** - Highlighting key benefits for restaurants

├── src/

│   ├── pages/```

│   │   ├── TablePage.jsx              # Customer menu & ordering

│   │   ├── OrderStatusPage.jsx        # Real-time order tracking  - Real-time kitchen updates

│   │   ├── PostMealOptions.jsx        # After-meal choices

│   │   ├── FeedbackPage.jsx           # Customer feedback## License

│   │   ├── waiter/

│   │   │   └── WaiterDashboard.jsx    # Waiter interface  - Order prioritizationnpm install- ✅ **Pricing Plans** - Three tiers (Basic, Pro, Premium)

│   │   ├── chef/

│   │   │   └── ChefDashboard.jsx      # Kitchen displayFor demonstration purposes.

│   │   └── admin/

│   │       └── AdminDashboard.jsx     # Admin controls

│   ├── Components/                    # Reusable components

│   ├── lib/- **Admin Panel**:- ✅ **Demo Mode** - Interactive table demo with sample menu

│   │   └── supabaseClient.js          # Database operations

│   ├── hooks/                         # Custom React hooks  - Complete system overview

│   ├── utils/                         # Helper functions

│   └── constants/                     # App constants  - Menu management (CRUD operations)# 2. Setup environment variables- ✅ **Responsive Design** - Optimized for mobile, tablet, and desktop

├── database/

│   ├── 01_schema.sql                  # Database structure  - Table configuration

│   ├── 02_seed.sql                    # Sample data

│   ├── 03_enable_realtime.sql         # Realtime setup  - Staff management# Create .env.local with:- ✅ **Smooth Animations** - Using Framer Motion

│   ├── 04_disable_rls_testing.sql     # Testing mode

│   ├── 05_production_rls.sql          # Production security  - Analytics and reporting

│   ├── 06_maintenance.sql             # Cleanup scripts

│   └── README.md                      # Database documentationVITE_SUPABASE_URL=your_supabase_url

└── public/                            # Static assets

```### Technical Highlights



---- **Automatic Table Management**: Tables automatically marked as occupied when customer entersVITE_SUPABASE_ANON_KEY=your_anon_key### Coming Soon (Phase 1)



## 🧪 Testing the App- **Real-time Updates**: Supabase realtime subscriptions for instant status changes



### Customer Flow- **Polling Fallback**: 5-second interval updates when websockets unavailableVITE_RAZORPAY_KEY_ID=your_razorpay_key- 🔄 **Full Ordering System** - Cart, checkout, and payment integration

1. Visit `http://localhost:5173/table/1` (simulates QR scan)

2. Browse menu and add items to cart- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

3. Proceed to payment

4. Track order status in real-time- **Animation**: Smooth transitions using Framer Motion- 🔄 **Live Order Tracking** - Real-time kitchen updates

5. When status shows "Served", choose post-meal option

6. Submit feedback



### Staff Access## 🛠️ Tech Stack# 3. Setup database (in Supabase SQL Editor)- 🔄 **Restaurant Dashboard** - Analytics and order management

- **Waiter:** `/waiter`

- **Chef:** `/chef`

- **Admin:** `/admin`

### Frontend# Run these files in order:

Watch dashboards auto-refresh as customers place orders!

- **React 19**: Latest React with modern hooks and patterns

---

- **Vite**: Lightning-fast build tool and dev server# - database/schema.sql---

## 📊 Database Overview

- **React Router v6**: Client-side routing

### 7 Core Tables

- `restaurants` - Restaurant information- **Framer Motion**: Smooth animations and transitions# - database/seed.sql

- `tables` - Physical tables with QR codes

- `menu_items` - Menu with prices and categories- **Tailwind CSS**: Utility-first styling

- `orders` - Customer orders with status tracking

- `payments` - Payment transaction records- **Lucide React**: Beautiful icon library# - database/phase2-complete.sql## 📂 Project Structure

- `feedbacks` - Customer ratings and comments

- `users` - Staff accounts (waiter, chef, admin)



### Key Features### Backend# - database/fix-order-items-rls.sql (if order creation fails)

- ✅ UUID primary keys

- ✅ Auto-generated order numbers (`ORD-20251030-0001`)- **Supabase**: Backend-as-a-Service platform

- ✅ Timestamps with auto-update triggers

- ✅ Optimized indexes for performance  - PostgreSQL Database```

- ✅ Real-time enabled on critical tables

  - Real-time subscriptions

---

  - Authentication# 4. Start development serverRestaurent-main/

## 🔒 Security

  - Row Level Security (RLS)

### Testing Mode (Current)

- RLS disabled for easier development  - RESTful APInpm run dev├── src/

- Anonymous users can perform all operations

- Perfect for testing and debugging



### Production Mode### Additional Tools```│   ├── assets/

- Enable with `database/05_production_rls.sql`

- Role-based access control- **QR Code Generation**: Dynamic table QR codes

- Customers can only see their own orders

- Staff authentication required- **ESLint**: Code quality and consistency│   │   └── marketing/          # All images and videos

- Secure row-level policies

- **PostCSS**: CSS processing

⚠️ **Remember to enable RLS before production deployment!**

## 📱 Test the App│   ├── Components/

---

## 📁 Project Structure

## 📈 Scalability

│   │   ├── About.jsx

### No Hard-Coded Limits!

- ✅ Unlimited customers (anonymous ordering)```

- ✅ Unlimited orders (limited by storage only)

- ✅ Unlimited tables (UUID-based)Tabun/- **Home Page**: http://localhost:5173/│   │   ├── ContactSection.jsx

- ✅ Unlimited menu items

├── src/

### Free Tier Can Handle:

- 100,000 - 250,000 orders│   ├── pages/- **QR Order (Demo Table)**: http://localhost:5173/table/demo│   │   ├── DemoButton.jsx      # ✨ New

- 10-20 concurrent customers

- Perfect for small-medium restaurants│   │   ├── TablePage.jsx          # Customer menu and ordering



### When to Upgrade:│   │   ├── OrderStatusPage.jsx    # Real-time order tracking- **Admin Portal**: http://localhost:5173/admin/login│   │   ├── DishCard.jsx

- Approaching 300 MB storage → Pro tier ($25/month)

- Need 50+ concurrent users → Pro tier│   │   ├── PostMealOptions.jsx    # After-meal actions

- Want 8 GB storage → Pro tier

│   │   ├── FeedbackPage.jsx       # Customer feedback- **Chef Dashboard**: http://localhost:5173/chef│   │   ├── Dishes.jsx

---

│   │   ├── waiter/

## 🛠️ Maintenance

│   │   │   └── WaiterDashboard.jsx- **Waiter Portal**: http://localhost:5173/waiter/login│   │   ├── Expertise.jsx

### Clean All Orders

```sql│   │   ├── chef/

-- See database/06_maintenance.sql

-- Section 1: Clean all orders and reset tables│   │   │   └── ChefDashboard.jsx│   │   ├── Features.jsx        # ✨ New

```

│   │   └── admin/

### Archive Old Orders

```sql│   │       └── AdminDashboard.jsx## 🎯 Key Features│   │   ├── Footer.jsx

-- Section 2: Clean old orders (>30 days)

```│   ├── Components/



### View Statistics│   │   ├── CategoryTabs.jsx│   │   ├── HeroSection.jsx

```sql

-- Sections 3-5: Database stats and reports│   │   ├── CartSummary.jsx

```

│   │   └── ... (other components)✅ QR Code Table Ordering  │   │   ├── Mission.jsx

---

│   ├── lib/

## 🆘 Troubleshooting

│   │   └── supabaseClient.js      # Database operations✅ Interactive Menu with Flip Cards  │   │   ├── Navbar.jsx

### "Permission denied" or 406 errors?

**Solution:** Run `database/04_disable_rls_testing.sql`│   ├── hooks/                      # Custom React hooks



### Orders not appearing in real-time?│   ├── utils/                      # Helper functions✅ Real-time Order Tracking  │   │   ├── Pricing.jsx         # ✨ New

**Solution:** Run `database/03_enable_realtime.sql`

│   └── constants/                  # App constants

### Table status not updating?

**Solution:** Check if RLS is disabled for testing├── database/✅ Razorpay Payment Integration  │   │   └── Review.jsx



### Port 5173 already in use?│   ├── schema.sql                 # Database schema

```bash

# Kill the process and restart│   ├── seed.sql                   # Sample data✅ Kitchen Display System  │   ├── constants/

lsof -ti:5173 | xargs kill -9

npm run dev│   ├── enable-realtime.sql        # Realtime setup

```

│   ├── production-rls-policies.sql # Security policies✅ Admin Dashboard & Analytics  │   │   └── index.jsx           # Updated with new exports

---

│   └── ... (other SQL scripts)

## 📦 Build for Production

└── public/✅ Staff Management (Chef, Waiter, Manager)  │   ├── pages/

```bash

# Create optimized build    └── ... (static assets)

npm run build

```✅ Menu Management  │   │   └── TablePage.jsx       # ✨ New - Demo table page

# Preview production build

npm run preview

```

## 🚀 Getting Started✅ Reports & Analytics  │   ├── App.jsx                 # Updated with routing

---



## 🚀 Deployment Checklist

### Prerequisites✅ QR Code Generation  │   ├── main.jsx                # Updated with BrowserRouter

Before going live:

1. ✅ Run `database/05_production_rls.sql` (enable security)- Node.js 18+ and npm

2. ✅ Update environment variables with production URLs

3. ✅ Test all features with RLS enabled- Supabase account (free tier works)│   └── index.css

4. ✅ Generate production QR codes

5. ✅ Configure payment gateway for production

6. ✅ Set up monitoring and error tracking

7. ✅ Test on real devices (mobile, tablet)### Installation## 📦 Tech Stack├── ASSET_INVENTORY.md          # ✨ New - Complete asset list



---



## 📄 License1. **Clone the repository**├── package.json



For demonstration purposes.   ```bash



---   cd /Users/prashanth/Downloads/Tabun- **Frontend**: React 19, Tailwind CSS, Framer Motion└── README.md                   # This file



## 👨‍💻 Developer   ```



**Prashanth Kr**  - **Backend**: Supabase (PostgreSQL + Auth + Realtime)```

Location: Tirupati, Andhra Pradesh, India

2. **Install dependencies**

---

   ```bash- **Payments**: Razorpay

## 🙏 Acknowledgments

   npm install

Built with ❤️ using:

- React 19   ```- **Build Tool**: Vite---

- Supabase

- Tailwind CSS

- Framer Motion

3. **Set up environment variables**

---

   Create a `.env` file in the root:

**Need detailed documentation?** Check `database/README.md` for complete database setup guide.

   ```## 📚 Documentation## 🎨 Asset Inventory

   VITE_SUPABASE_URL=your_supabase_url

   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   ```

See [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for:All media assets (27 files) have been reorganized into `src/assets/marketing/`:

4. **Set up database**

   - Go to your Supabase project- Complete route listing (50+ pages)

   - Run the SQL scripts in order:

     ```sql- Feature descriptions- **Videos**: `hero.mp4`, `mission.mp4`

     -- 1. Create tables

     database/schema.sql- Database schema- **Dish Images**: 11 dishes (Butter Chicken, Dosa, Paneer Tikka, etc.)

     

     -- 2. Add sample data- Troubleshooting guides- **Cuisine Images**: Indian, Italian, Japanese

     database/seed.sql

     - Development notes- **Customer Photos**: 4 review photos

     -- 3. Enable real-time updates

     database/enable-realtime.sql- Deployment checklist- **Section Images**: About, Mission, Hero

     

     -- 4. (Optional) For testing - disable RLS

     database/fix-order-rls.sql

     ```## 🛠️ Build CommandsSee [ASSET_INVENTORY.md](./ASSET_INVENTORY.md) for the complete list.



5. **Start development server**

   ```bash

   npm run dev```bash---

   ```

   App will be available at `http://localhost:5173`# Development



## 🧪 Testing the Complete Flownpm run dev## 🛠️ Installation



### Customer Journey

1. Visit `http://localhost:5173/table/1` (simulates scanning QR code)

2. Browse menu and add items to cart# Build for production### Prerequisites

3. Complete payment

4. Track order status in real-timenpm run build- Node.js (v16 or higher)

5. Wait for "Served" status

6. Choose post-meal option (order more or finish)- npm or yarn

7. Submit feedback

# Preview production build

### Staff Access

- **Waiter Dashboard**: `/waiter`npm run preview### Setup

- **Chef Dashboard**: `/chef`

- **Admin Panel**: `/admin`



Watch the waiter dashboard auto-refresh every 5 seconds as customer actions occur.# Lint code1. **Clone the repository**



## 🔒 Security Notesnpm run lint   ```bash



### Current Status (Development)```   git clone <repository-url>

- **RLS is DISABLED** for testing purposes

- Anonymous users can create orders and update table status   cd Restaurent-main

- Faster development and debugging

---   ```

### Production Deployment

Before going live:

1. Run `database/production-rls-policies.sql`

2. Test all features with RLS enabled**Version**: 1.0.0  2. **Install dependencies**

3. Verify security policies work correctly

4. Update all QR codes with production domain**Status**: Production Ready ✅     ```bash



## 📊 Database Schema**Last Updated**: October 24, 2025   npm install



### Main Tables   ```

- **tables**: Restaurant table information and status

- **menu_items**: Food/drink items with categories3. **Run the development server**

- **orders**: Customer orders with status tracking   ```bash

- **order_items**: Individual items in each order   npm run dev

- **payments**: Payment records   ```

- **feedbacks**: Customer ratings and comments

- **profiles**: User profiles for staff4. **Open in browser**

   ```

### Real-time Tables   http://localhost:5173

The following tables have real-time enabled:   ```

- `orders` - Live order updates

- `tables` - Table status changes---

- `menu_items` - Menu modifications

## 🧪 Demo Instructions

## 🎯 Current Features Status

### Try the Demo Table

✅ **Fully Implemented**

- Complete customer ordering flow1. Navigate to the homepage

- Real-time order tracking2. Click the **"Try Demo Table"** button (animated orange button in hero section)

- Automatic table status management3. Or visit directly: `http://localhost:5173/table/demo`

- Staff dashboards (waiter, chef, admin)4. Browse the sample menu with 10 dishes

- Menu management5. Note: "Add to Cart" buttons are disabled (coming in Phase 1)

- Payment processing

- Feedback collection### Navigation

- Auto-refresh (5-second intervals)

- Supabase realtime integration- **Home** - Returns to homepage

- Post-meal options flow- **For Restaurants** - Scrolls to Features section

- **Demo** - Opens demo table page

🔄 **In Progress**- **Pricing** - Scrolls to pricing plans

- Enhanced analytics- **Dishes, About, Mission, Reviews, Contact** - Existing sections

- Multi-location support

- Advanced reporting---



## 📝 Important Functions## 📦 Dependencies



### `markTableOccupied(tableId)`### Core

Automatically marks a table as occupied when a customer enters the page. Updates:- `react` - UI library

- `status` → 'occupied'- `react-dom` - React DOM renderer

- `booked_at` → current timestamp- `react-router-dom` - Routing (✨ newly added)

- `updated_at` → current timestamp

### Styling & Animation

### `getTableStatus(table, activeOrders)`- `tailwindcss` - Utility-first CSS

Determines table status with priority:- `framer-motion` - Animations

1. Database status (occupied, reserved)- `postcss` - CSS processing

2. Order-based logic (ordering, eating)- `autoprefixer` - CSS vendor prefixes

3. Default to 'available'

### Icons

## 🤝 Contributing- `react-icons` - Icon library



When adding features:### Build Tools

1. Keep the 5-second auto-refresh for real-time feel- `vite` - Fast build tool

2. Maintain table status accuracy- `@vitejs/plugin-react` - React plugin for Vite

3. Ensure feedback flow goes through PostMealOptions- `eslint` - Code linting

4. Add console logs with emojis for debugging (👤, 🔵, ✅, ❌, 📡, 🔄)

---

## 📄 License

## 🎯 Success Criteria (Phase 0)

[Your License Here]

✅ All assets intact and reorganized  

## 👥 Contact✅ Demo button functional and animated  

✅ Demo page loads successfully  

[Your Contact Information]✅ No image or component breaks  

✅ Marketing site visually complete  

---✅ Routing configured properly  

✅ No console errors or warnings  

**Built with ❤️ using React and Supabase**

---

## 📝 Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🌐 Deployment

### Build for Production
```bash
npm run build
```
The build artifacts will be in the `dist/` folder.

### Deploy to Services
- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Configure in repository settings

---

## 🐛 Troubleshooting

### Issue: Images not loading
- Check that all imports use `../assets/marketing/` path
- Verify files exist in `src/assets/marketing/`

### Issue: Routing not working
- Ensure `BrowserRouter` is wrapping `<App />` in `main.jsx`
- Check that `react-router-dom` is installed

### Issue: Build errors
- Run `npm install` to ensure all dependencies are installed
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

---

## � Limits and Scalability

### "Is there a limit on customers, orders, or tables?"

**Short Answer: NO hard-coded limits!** Your app can handle:
- ✅ **Unlimited customers** (anonymous ordering, no registration needed)
- ✅ **Unlimited orders** (limited only by database storage, not code)
- ✅ **Unlimited tables** (UUID-based, supports 1 to 10,000+ tables)
- ✅ **Unlimited menu items** (add as many dishes as you want)

**What Actually Limits You:**
- **Supabase Free Tier**: 500 MB database storage
- **Concurrent Connections**: 2-5 simultaneous users (Free), 60-100 (Pro)

**Free Tier Can Handle:**
- 100,000 - 250,000 orders before storage fills
- 10-20 customers ordering simultaneously
- 1,000+ tables
- Perfect for small to medium restaurants

**When to Upgrade:**
- Approaching 300 MB storage → Upgrade to Pro ($25/month)
- Need 50+ concurrent users → Pro tier
- Want 8 GB storage → Pro tier
- Multiple locations → Team/Enterprise tier

📖 **For complete details, see [LIMITS_AND_SCALABILITY.md](./LIMITS_AND_SCALABILITY.md)**
- Database capacity calculations
- Scaling strategies
- Monitoring usage
- Optimization tips
- Cost breakdowns

---

## �👨‍💻 Developer

**Pʀᴀsʜᴀɴᴛʜ_ᴋʀ**  
Location: Tirupati, Andhra Pradesh, India

---

## 📄 License

This project is for demonstration purposes.

---

## 🔮 Future Roadmap

### Phase 1: Full Ordering System
- Shopping cart functionality
- Payment integration (UPI, Cards)
- Order confirmation and tracking
- Real-time kitchen display system

### Phase 2: Restaurant Dashboard
- Order management interface
- Sales analytics and reports
- Menu management system
- Customer feedback collection

### Phase 3: Advanced Features
- Multi-language support
- Push notifications
- Loyalty rewards program
- Table reservation system

---

**Built with ❤️ using React, Vite, and Tailwind CSS**
