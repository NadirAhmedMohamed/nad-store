import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import "./Styles/toast.css";

import { useEffect, useState, useRef } from "react";
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
  const { dispatch } = useAuth();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");

  const authRequestRef = useRef(0);

  const hideFooter =
    ["/login", "/register", "/admin-login", "/admin/login"].includes(
      location.pathname,
    ) || location.pathname.startsWith("/admin");

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
      const requestId = ++authRequestRef.current;

      const isCurrentRequest = () =>
        active && requestId === authRequestRef.current;

      dispatch({
        type: "SET_BASKET_READY",
        value: false,
      });

      if (!authUser) {
        if (!isCurrentRequest()) return;

        dispatch({
          type: "SET_USER",
          user: null,
        });

        dispatch({
          type: "SET_BASKET",
          basket: [],
        });

        dispatch({
          type: "SET_BASKET_READY",
          value: true,
        });

        return;
      }

      dispatch({
        type: "SET_USER",
        user: authUser,
      });

      const cachedBasket = getLocalBasket(authUser.uid);

      try {
        // Check whether this account is an admin.
        const adminSnap = await getDoc(doc(db, "admins", authUser.uid));

        if (!isCurrentRequest()) return;

        if (
          adminSnap.exists() &&
          ["admin", "demo"].includes(adminSnap.data().role)
        ) {
          dispatch({
            type: "SET_BASKET",
            basket: [],
          });

          dispatch({
            type: "SET_BASKET_READY",
            value: true,
          });

          return;
        }

        // Load customer data.
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (!isCurrentRequest()) return;

        let basket = [];

        if (userSnap.exists()) {
          const data = userSnap.data();

          if (Array.isArray(data.basket)) {
            basket = data.basket;
          } else {
            // Initialize missing basket field.
            basket = cachedBasket;

            await setDoc(userRef, { basket }, { merge: true });
          }
        } else {
          // Create a new customer document.
          basket = cachedBasket;

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

        if (!isCurrentRequest()) return;

        dispatch({
          type: "SET_BASKET",
          basket,
        });

        try {
          localStorage.setItem(
            `basket_${authUser.uid}`,
            JSON.stringify(basket),
          );
        } catch (storageError) {
          console.error("Could not update local basket:", storageError);
        }

        dispatch({
          type: "SET_BASKET_READY",
          value: true,
        });
      } catch (error) {
        console.error("User initialization failed:", error);

        if (!isCurrentRequest()) return;

        // Do not allow basket operations when Firestore
        // initialization has failed.
        dispatch({
          type: "SET_BASKET_READY",
          value: false,
        });

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
      authRequestRef.current += 1;
      unsubscribe();
    };
  }, [dispatch]);

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
