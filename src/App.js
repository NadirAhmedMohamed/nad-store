import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import "./Styles/toast.css";

import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import Header from "./components/layout/Header/Header.js";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute.js";

import Login from "./pages/Login/Login.js";
import Register from "./pages/Register/Register.js";
import AdminLogin from "./pages/AdminLogin/AdminLogin.js";
import AdminDashboard from "./pages/Dashboard/AdminDashboard.js";

import Home from "./pages/Home/Home.js";
import Checkout from "./pages/Checkout/Checkout.js";
import Payment from "./pages/Payment/Payment.js";
import Orders from "./pages/Orders/Orders.js";
import TrackOrder from "./pages/Orders/TrackOrder";
import ProductDetails from "./pages/ProductDetails/ProductDetails.js";
import ErrorPage from "./pages/ErrorPage/ErrorPage.js";

import { useAuth } from "./contexts/GlobalState";
import { auth, db } from "./firebase.config.js";
import Footer from "./components/layout/Footer/Footer.js";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const { beginBasketSession, initializeBasket, endBasketSession } = useAuth();

  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");

  const hideFooter =
    ["/login", "/register", "/admin-login", "/admin/login"].includes(
      location.pathname,
    ) || location.pathname.startsWith("/admin");

  // Scroll to the top whenever the route changes.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  // Keep the search input synchronized with the URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("q") || "");
  }, [location.search]);

  const headerProps = {
    searchTerm,
    setSearchTerm,
  };

  // Listen for authentication changes and initialize the basket.
  useEffect(() => {
    let active = true;

    const getLocalBasket = (uid) => {
      try {
        const savedBasket = JSON.parse(
          localStorage.getItem(`basket_${uid}`) || "[]",
        );

        return Array.isArray(savedBasket) ? savedBasket : [];
      } catch (error) {
        console.error("Could not read local basket:", error);
        return [];
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!active) return;

      // Handle logout and isolate the guest basket.
      if (!authUser) {
        endBasketSession();
        return;
      }

      // Start a new isolated session for this account.
      const sessionVersion = beginBasketSession(authUser);

      try {
        // Load the user's Firestore document.
        // Admin permissions are handled separately.
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (!active) return;

        let basket = [];

        if (userSnap.exists()) {
          const userData = userSnap.data();

          if (Array.isArray(userData.basket)) {
            // Preserve Firestore as the primary source of truth.
            // An intentionally empty basket must remain empty.
            basket = userData.basket;
          } else {
            // Use local storage only if the basket field is missing.
            basket = getLocalBasket(authUser.uid);

            await setDoc(userRef, { basket }, { merge: true });
          }
        } else {
          // Create the customer document if it does not exist.
          basket = getLocalBasket(authUser.uid);

          await setDoc(
            userRef,
            {
              email: authUser.email || "",
              displayName: authUser.displayName || "",
              basket,
            },
            { merge: true },
          );
        }

        if (!active) return;

        // Initialize only if this is still the current session.
        const initialized = initializeBasket(
          authUser.uid,
          basket,
          sessionVersion,
        );

        if (initialized) {
          try {
            localStorage.setItem(
              `basket_${authUser.uid}`,
              JSON.stringify(basket),
            );
          } catch (storageError) {
            console.error("Could not update local basket:", storageError);
          }
        }
      } catch (error) {
        console.error("User initialization failed:", error);

        if (!active) return;

        toast.error(
          "Unable to synchronize your basket. Please check your connection and try again.",
          {
            toastId: `basket-initialization-${authUser.uid}`,
          },
        );
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [beginBasketSession, initializeBasket, endBasketSession]);

  return (
    <>
      {/* Global Nad Store Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={4}
        toastClassName="nad-toast"
        bodyClassName="nad-toast-body"
        progressClassName="nad-toast-progress"
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header {...headerProps} />
              <Home searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/checkout"
          element={
            <>
              <Header {...headerProps} />
              <Checkout />
            </>
          }
        />

        <Route
          path="/orders"
          element={
            <>
              <Header {...headerProps} />
              <Orders />
            </>
          }
        />

        <Route path="/track-order/:orderId" element={<TrackOrder />} />

        <Route
          path="/payment"
          element={
            <>
              <Header {...headerProps} />
              <Payment />
            </>
          }
        />

        <Route
          path="/product/:id"
          element={
            <>
              <Header {...headerProps} />
              <ProductDetails />
            </>
          }
        />

        <Route path="*" element={<ErrorPage />} />
      </Routes>

      {!hideFooter && <Footer />}
    </>
  );
}

export default App;
