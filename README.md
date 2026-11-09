# Nad Store | Shop Smarter

A modern, full-featured e-commerce web application built with React, Firebase, and Stripe. Nad Store provides a seamless online shopping experience with secure authentication, dynamic product discovery, shopping cart management, payment processing, order tracking, and an administrative dashboard.

🌐 **Live Demo:** [https://nad-store.pages.dev](https://nad-store.pages.dev)

## Overview

Nad Store is a full-stack e-commerce application developed to deliver a practical, user-centered shopping experience while applying modern frontend engineering principles and integrating cloud-based backend services.

The platform covers the complete shopping journey, from browsing products and managing the shopping cart to checkout, payment processing, and order tracking.

The project focuses on reusable component architecture, centralized state management, secure payment verification, responsive design, and real-world application workflows.

## Key Features

- **Authentication & Authorization** — User registration, login, Google authentication, and protected routes.
- **Product Discovery** — Dynamic product listings, category filtering, search suggestions, and detailed product pages.
- **Shopping Cart** — Persistent cart state, quantity management, and automatic price calculations.
- **Checkout & Payments** — Integrated Stripe payment flow.
- **Payment Verification** — Stripe webhook integration through Cloudflare Workers to verify successful payments and update Firestore order records.
- **Order Management** — Order history, payment status, and order tracking.
- **Admin Dashboard** — Protected administrative interface for managing store operations.
- **Responsive Design** — User interfaces optimized for desktop, tablet, and mobile devices.
- **Arabic & English Styling Support** — RTL-aware styling and typography using Cairo and Inter fonts.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML5, CSS3 |
| Routing | React Router |
| State Management | React Context API, useReducer |
| Backend Services | Firebase Authentication, Cloud Firestore |
| Payments | Stripe, Stripe Elements |
| Webhook Infrastructure | Cloudflare Workers |
| Hosting & Deployment | Cloudflare Pages |
| UI & Data Visualization | Swiper, Recharts, React Icons |
| Notifications | React Toastify |
| Development Tools | Git, GitHub, npm |

## Architecture Highlights

- Component-based React architecture with reusable UI components.
- Centralized application state management using Context API and Reducer.
- Firebase integration for authentication and cloud data persistence.
- Protected user and administrator routes.
- Server-side payment event verification through a Cloudflare Worker.
- Environment-based configuration for Firebase application settings.
- Reusable CSS variables and shared styling conventions.
- Automated deployment through GitHub integration with Cloudflare Pages.

## Payment Architecture

Nad Store integrates Stripe for payment processing.

A dedicated Cloudflare Worker handles Stripe webhook events and:

- Verifies Stripe webhook signatures.
- Processes successful payment events.
- Validates payment amounts against corresponding order records.
- Updates Firestore payment and order statuses after successful verification.

Sensitive Stripe credentials and webhook signing secrets are stored in Cloudflare Worker environment secrets and are not committed to the repository.

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
git clone https://github.com/NadirAhmedMohamed/nad-store.git
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

The application will be available at:

```text
http://localhost:3000
```

## Deployment

The frontend application is deployed using Cloudflare Pages and connected directly to the GitHub repository.

**Live Application:** [https://nad-store.pages.dev](https://nad-store.pages.dev)

### Build Configuration

| Setting | Value |
|---|---|
| Framework | Create React App |
| Build Command | `npm run build` |
| Build Output Directory | `build` |
| Root Directory | `/` |

Cloudflare Pages automatically builds and deploys updates pushed to the connected GitHub repository.

## Environment & Security

- Never commit `.env.local` or private credentials.
- Configure Firebase security rules before production use.
- Restrict administrative access through appropriate authorization checks.
- Keep Stripe secret keys and webhook signing secrets on the server side.
- Never expose service account credentials in frontend code.
- Use environment variables for application configuration.

## Project Status

**Live — Successfully Deployed**

Nad Store is publicly deployed and accessible online.

The core shopping, authentication, administration, and payment workflows have been implemented and tested.

## Author

**Nadir Ahmed**  
Frontend Developer | React.js

- **Portfolio:** [portfolio-nadirahmed.netlify.app](https://portfolio-nadirahmed.netlify.app/)
- **LinkedIn:** [linkedin.com/in/nadirahmed10](https://www.linkedin.com/in/nadirahmed10/)
- **GitHub:** [github.com/NadirAhmedMohamed](https://github.com/NadirAhmedMohamed)

---

Built with React and a focus on clean architecture, practical problem-solving, and user experience.
