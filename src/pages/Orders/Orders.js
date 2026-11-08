import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/GlobalState";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCreditCard,
  FaShoppingBag,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";
import CheckoutProduct from "../../components/cart/CheckoutProduct";
import "./Orders.css";

const formatDate = (created) => {
  if (!created) return "Date unavailable";

  try {
    const date =
      typeof created.toDate === "function"
        ? created.toDate()
        : new Date(created);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "Date unavailable";
  }
};

const formatAmount = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStatusClass = (status) => {
  const value = String(status || "pending")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  return value || "pending";
};

const formatStatus = (status) => {
  if (!status) return "Pending";

  return String(status)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    // Fetch only the signed-in user's orders.
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("created", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const userOrders = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setOrders(userOrders);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error loading orders:", err);
        setError(
          "We couldn't load your orders. Please refresh the page and try again."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <main className="orders-page">
        <section className="orders-loading">
          <span className="orders-spinner" />
          <h2>Loading your orders</h2>
          <p>We're getting your latest purchases ready.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <section className="orders-hero">
        <div className="orders-hero-icon">
          <FaBoxOpen />
        </div>

        <div className="orders-hero-copy">
          <span className="orders-eyebrow">NAD STORE</span>
          <h1>My Orders</h1>
          <p>Track your purchases and review your order details.</p>
        </div>

        <div className="orders-count">
          <FaShoppingBag />
          <span>
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>
      </section>

      {error ? (
        <section className="orders-message orders-error">
          <FaExclamationCircle />
          <div>
            <h2>Unable to load orders</h2>
            <p>{error}</p>
            <button
              type="button"
              className="orders-retry"
              onClick={() => window.location.reload()}
            >
              <FaSyncAlt /> Try again
            </button>
          </div>
        </section>
      ) : !user ? (
        <section className="orders-empty">
          <div className="orders-empty-icon">
            <FaShoppingBag />
          </div>
          <h2>Sign in to view your orders</h2>
          <p>Your purchases will appear here after you sign in.</p>
        </section>
      ) : orders.length === 0 ? (
        <section className="orders-empty">
          <div className="orders-empty-icon">
            <FaBoxOpen />
          </div>
          <h2>No orders yet</h2>
          <p>
            You haven't placed an order yet. Your purchases will appear here
            once you complete checkout.
          </p>
        </section>
      ) : (
        <section className="orders-list">
          {orders.map((order) => {
            const paymentStatus = order.paymentStatus || "pending";
            const orderStatus = order.status || "pending";

            return (
              <article className="order-card" key={order.id}>
                <header className="order-card-header">
                  <div className="order-reference">
                    <span className="order-label">ORDER NUMBER</span>
                    <h2>#{order.id.slice(0, 8).toUpperCase()}</h2>
                  </div>

                  <span
                    className={`order-status status-${getStatusClass(
                      orderStatus
                    )}`}
                  >
                    {formatStatus(orderStatus)}
                  </span>
                </header>

                <div className="order-meta">
                  <div className="order-meta-item">
                    <FaCalendarAlt />
                    <div>
                      <span>Order date</span>
                      <strong>{formatDate(order.created)}</strong>
                    </div>
                  </div>

                  <div className="order-meta-item">
                    <FaCreditCard />
                    <div>
                      <span>Payment method</span>
                      <strong>{order.paymentMethod || "Not specified"}</strong>
                    </div>
                  </div>

                  <div className="order-meta-item">
                    <FaBoxOpen />
                    <div>
                      <span>Payment status</span>
                      <strong
                        className={`payment-status status-${getStatusClass(
                          paymentStatus
                        )}`}
                      >
                        {formatStatus(paymentStatus)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="order-products">
                  <h3>
                    <FaShoppingBag /> Items in this order
                  </h3>

                  {Array.isArray(order.basket) && order.basket.length > 0 ? (
                    <div className="orders-container">
                      {order.basket.map((item, index) => (
                        <CheckoutProduct
                          key={item.id || index}
                          orderPage={true}
                          id={item.id}
                          title={item.title}
                          price={item.price}
                          rate={item.rate}
                          productImg={item.img}
                          removeFromBasketBtn={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="order-no-items">
                      Product details are unavailable for this order.
                    </p>
                  )}
                </div>

                          <footer className="order-card-footer">
            <span>Order total</span>
            <strong>{formatAmount(order.amount)}</strong>

            <Link
              to={`/track-order/${order.id}`}
              className="track-order-button"
            >
              <FaBoxOpen />
              Track Order
            </Link>
          </footer>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
