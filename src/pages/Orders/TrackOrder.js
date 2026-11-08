import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "../../contexts/GlobalState";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaHome,
  FaArrowLeft,
  FaExclamationCircle,
} from "react-icons/fa";
import "./TrackOrder.css";

const steps = [
  { key: "pending", title: "Order Placed", description: "Your order has been received.", icon: FaBoxOpen },
  { key: "confirmed", title: "Order Confirmed", description: "Your order has been confirmed.", icon: FaCheckCircle },
  { key: "shipped", title: "Shipped", description: "Your order is on its way.", icon: FaTruck },
  { key: "delivered", title: "Delivered", description: "Your order has been delivered.", icon: FaHome },
];

const formatDate = (value) => {
  if (!value) return "";
  try {
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function TrackOrder() {
  const { orderId } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid || !orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setOrder(null);
          setError("Order not found.");
          setLoading(false);
          return;
        }

        const data = snapshot.data();

        if (data.userId !== user.uid) {
          setOrder(null);
          setError("You don't have permission to view this order.");
          setLoading(false);
          return;
        }

        setOrder({ id: snapshot.id, ...data });
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("Track order error:", err);
        setError("Unable to load this order. Please try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, orderId]);

  if (!user) {
    return (
      <main className="track-page">
        <section className="track-message">
          <FaExclamationCircle />
          <h2>Please sign in</h2>
          <p>Sign in with the account used to place this order.</p>
          <Link to="/login" className="track-back">Go to Login</Link>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="track-page">
        <section className="track-message">
          <span className="track-spinner" />
          <h2>Loading order status...</h2>
        </section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="track-page">
        <section className="track-message">
          <FaExclamationCircle />
          <h2>Unable to track order</h2>
          <p>{error || "Order not found."}</p>
          <Link to="/orders" className="track-back">
            <FaArrowLeft /> Back to My Orders
          </Link>
        </section>
      </main>
    );
  }

  const status = String(order.status || "pending").toLowerCase();
  const cancelled = ["cancelled", "canceled"].includes(status);
  const currentIndex = steps.findIndex((step) => step.key === status);
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;

  return (
    <main className="track-page">
      <Link to="/orders" className="track-back">
        <FaArrowLeft /> Back to My Orders
      </Link>

      <section className="track-header">
        <div className="track-header-icon"><FaTruck /></div>
        <div>
          <span className="track-eyebrow">NAD STORE</span>
          <h1>Track Your Order</h1>
          <p>Follow the latest status of your purchase.</p>
        </div>
      </section>

      <section className="track-card">
        <div className="track-order-summary">
          <div>
            <span className="track-label">ORDER NUMBER</span>
            <h2>#{order.id.slice(0, 8).toUpperCase()}</h2>
            <p>Placed on {formatDate(order.created) || "Date unavailable"}</p>
          </div>

          <span className={`track-status status-${status}`}>
            {status.replace(/[_-]/g, " ")}
          </span>
        </div>

        <div className="track-info-grid">
          <div>
            <span>Payment method</span>
            <strong>{order.paymentMethod || "Not specified"}</strong>
          </div>
          <div>
            <span>Payment status</span>
            <strong>{String(order.paymentStatus || "pending").replace(/[_-]/g, " ")}</strong>
          </div>
          <div>
            <span>Order total</span>
            <strong>
              ${Number(order.amount || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>

        <div className="track-progress">
          <h3>Order Progress</h3>

          {cancelled ? (
            <div className="track-cancelled">
              <FaExclamationCircle />
              <div>
                <strong>Order Cancelled</strong>
                <p>This order has been cancelled. Please contact the store if you need help.</p>
              </div>
            </div>
          ) : (
            <div className="track-timeline">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const done = currentIndex >= 0 && index <= currentIndex;
                const current = index === activeIndex;

                return (
                  <div
                    className={`track-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}
                    key={step.key}
                  >
                    <div className="track-step-marker">
                      <Icon />
                    </div>
                    <div className="track-step-content">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                      {current && (
                        <span className="track-current-label">
                          <FaClock /> Current status
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="track-live-note">
          <FaCheckCircle />
          Order status updates automatically when the store updates your order.
        </div>
      </section>
    </main>
  );
}