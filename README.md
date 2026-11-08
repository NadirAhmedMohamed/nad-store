# Nad Store | Shop Smarter

A modern, full-featured e-commerce web application built with React, Firebase, and Stripe. Nad Store delivers a seamless shopping experience with secure authentication, dynamic product discovery, order management, and an administrative dashboard.

## Overview

Nad Store is a full-stack e-commerce project focused on building a practical, user-centered shopping experience while applying modern frontend engineering principles and integrating cloud-based backend services.

The platform supports the complete shopping workflow, from browsing products and managing the shopping cart to checkout, payment processing, and order tracking.

## Key Features

- **Authentication & Authorization** — User registration, login, Google authentication, and protected routes.
- **Product Discovery** — Dynamic product listings, category filtering, search suggestions, and product details.
- **Shopping Cart** — Persistent cart state with quantity management and automatic price calculations.
- **Checkout & Payments** — Integrated Stripe payment flow.
- **Payment Verification** — Stripe webhook integration through Cloudflare Workers to verify successful payments and update order records.
- **Order Management** — Order history, payment status, and order tracking.
- **Admin Dashboard** — Protected administrative interface for managing store operations.
- **Responsive UI** — Layouts optimized for desktop, tablet, and mobile devices.
- **Bilingual Styling Support** — English and Arabic typography with RTL-aware styling.

## Tech Stack

| Category                | Technologies                             |
| ----------------------- | ---------------------------------------- |
| Frontend                | React, JavaScript, HTML5, CSS3           |
| Routing                 | React Router                             |
| Backend Services        | Firebase Authentication, Cloud Firestore |
| Payments                | Stripe, Stripe Elements                  |
| Webhook Infrastructure  | Cloudflare Workers                       |
| UI & Data Visualization | Swiper, Recharts, React Icons            |
| Notifications           | React Toastify                           |
| Development Tools       | Git, GitHub, npm                         |

## Architecture Highlights

- Component-based React architecture with reusable UI components.
- Centralized application state management using Context API and Reducer.
- Firebase integration for authentication and cloud data persistence.
- Protected user and administrator routes.
- Server-side payment event verification through a Cloudflare Worker.
- Environment-based configuration for Firebase credentials and application settings.
- Reusable CSS variables and shared styling conventions.

## Project Structure

```text
src/
├── components/
│   ├── auth/
│   ├── cart/
│   ├── layout/
│   └── products/
├── contexts/
├── hooks/
├── pages/
│   ├── AdminLogin/
│   ├── Checkout/
│   ├── Dashboard/
│   ├── Home/
│   ├── Login/
│   ├── Orders/
│   ├── Payment/
│   ├── ProductDetails/
│   └── Register/
├── Styles/
├── assets/
├── App.js
└── firebase.config.js
```

## Getting Started

### Prerequisites

- Node.js
- npm
- A Firebase project
- A Stripe account for payment functionality

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/nad-store.git
```

2. Navigate to the project directory:

```bash
cd nad-store
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env.local` file in the project root and configure your Firebase environment variables:

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

5. Start the development server:

```bash
npm start
```

The application will run at `http://localhost:3000`.

## Payment Integration

Nad Store integrates Stripe for payment processing.

A Cloudflare Worker handles Stripe webhook events, verifies webhook signatures, validates payment amounts, and updates corresponding Firestore order records after successful payment confirmation.

Sensitive credentials and webhook secrets are stored in environment variables and Cloudflare Worker secrets rather than committed to the repository.

## Environment & Security

- Never commit `.env.local` or private credentials.
- Configure Firebase security rules before deployment.
- Restrict administrative access through appropriate authorization checks.
- Keep Stripe secret keys and webhook signing secrets on the server side.

## Project Status

**In Progress — Preparing for Launch**

The core shopping, authentication, administration, and payment workflows have been implemented. Final deployment preparation, production configuration, and testing are ongoing.

## Author

**Nadir Ahmed**  
Frontend Developer | React.js

- [Portfolio](https://portfolio-nadirahmed.netlify.app/)
- [LinkedIn](https://www.linkedin.com/in/nadirahmed10/)
- [GitHub](https://github.com/NadirAhmedMohamed)

---

Built with React and a focus on clean architecture, practical problem-solving, and user experience.
