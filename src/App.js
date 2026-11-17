import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import "./Styles/toast.css";

import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import Header from "./components/layout/Header/Header.js";
import Footer from "./components/layout/Footer/Footer.js";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute.js";

import { useAuth } from "./contexts/GlobalState";
import { auth, db } from "./firebase.config.js";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Login = lazy(() => import("./pages/Login/Login.js"));
const Register = lazy(() => import("./pages/Register/Register.js"));
const AdminLogin = lazy(() => import("./pages/AdminLogin/AdminLogin.js"));
const AdminDashboard = lazy(
  () => import("./pages/Dashboard/AdminDashboard.js"),
);

const Home = lazy(() => import("./pages/Home/Home.js"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout.js"));
const Payment = lazy(() => import("./pages/Payment/Payment.js"));
const Orders = lazy(() => import("./pages/Orders/Orders.js"));
const TrackOrder = lazy(() => import("./pages/Orders/TrackOrder"));
const ProductDetails = lazy(
  () => import("./pages/ProductDetails/ProductDetails.js"),
);
const ErrorPage = lazy(() => import("./pages/ErrorPage/ErrorPage.js"));

function App() {
  const { beginBasketSession, initializeBasket, endBasketSession } = useAuth();

  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");

  const hideFooter =
    ["/login", "/register", "/admin-login", "/admin/login"].includes(
      location.pathname,
    ) || location.pathname.startsWith("/admin");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("q") || "");
  }, [location.search]);

  const headerProps = {
    searchTerm,
    setSearchTerm,
  };

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

      if (!authUser) {
        endBasketSession();
        return;
      }

      const sessionVersion = beginBasketSession(authUser);

      try {
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (!active) return;

        let basket = [];

        if (userSnap.exists()) {
          const userData = userSnap.data();

          if (Array.isArray(userData.basket)) {
            basket = userData.basket;
          } else {
            basket = getLocalBasket(authUser.uid);

            await setDoc(userRef, { basket }, { merge: true });
          }
        } else {
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

      <Suspense
        fallback={
          <div className="app-route-loading" role="status" aria-live="polite">
            Loading page...
          </div>
        }
      >
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
      </Suspense>
    </>
  );
}

export default App;
