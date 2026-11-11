import React, { useState } from "react";
import "./Payment.css";

import { getBasketTotalPrice } from "../../contexts/AppReducer";
import { useAuth } from "../../contexts/GlobalState";
import CheckoutProduct from "../../components/cart/CheckoutProduct";

import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase.config";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { toast } from "react-toastify";

import {
  FaMapMarkerAlt,
  FaShoppingBag,
  FaMoneyBillWave,
  FaCreditCard,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

const stripePromise = loadStripe(
  "pk_test_51TXc3qHAMyAR8qmyYJjequdGNMe8WTTeR5AnfyvmQmvzEvQ9cefY654utL41UKHU939BqSnqMbDfrphbOsnWqeaw00k1QM6lp6",
);

const cardStyle = {
  style: {
    base: {
      fontSize: "16px",
      color: "#242424",
      fontFamily: "Inter, sans-serif",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

function StripeForm({
  total,
  basket,
  user,
  customerInfo,
  processing,
  setProcessing,
  onSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardError, setCardError] = useState("");

  const handleStripeSubmit = async (e) => {
    e.preventDefault();
    setCardError("");

    if (!stripe || !elements || processing) return;

    if (!user) {
      setCardError("Please sign in before paying.");
      return;
    }

    if (
      !customerInfo?.name?.trim() ||
      !customerInfo?.phone?.trim() ||
      !customerInfo?.city?.trim() ||
      !customerInfo?.address?.trim()
    ) {
      setCardError("Please complete all delivery details before paying.");
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setCardError("Card details are unavailable.");
      return;
    }

    setProcessing(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(
        "https://nad-store-payment.nader-a-j12.workers.dev/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            items: basket.map((item) => ({
              id: String(item.id),
              quantity: Math.max(1, Number(item.quantity) || 1),
            })),
            customerInfo: {
              name: customerInfo.name.trim(),
              phone: customerInfo.phone.trim(),
              city: customerInfo.city.trim(),
              address: customerInfo.address.trim(),
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }

      if (
        !data.clientSecret ||
        !Number.isInteger(data.amount) ||
        !data.paymentIntentId ||
        !data.orderId
      ) {
        throw new Error("Invalid payment response from server.");
      }

      const verifiedTotal = data.amount / 100;

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        throw new Error(result.error.message || "Card payment failed.");
      }

      if (result.paymentIntent?.status !== "succeeded") {
        throw new Error("Payment has not been confirmed.");
      }

      if (result.paymentIntent.id !== data.paymentIntentId) {
        throw new Error(
          "The confirmed payment does not match the created order. Contact support before retrying.",
        );
      }

      await onSuccess(result.paymentIntent, verifiedTotal, data.orderId);
    } catch (error) {
      setCardError(error.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripeSubmit} className="stripe-form">
      <label className="payment-field-label">Card details</label>

      <div className="card-element-wrapper">
        <CardElement options={cardStyle} />
      </div>

      {cardError && (
        <p className="payment-error" role="alert" aria-live="polite">
          {cardError}
        </p>
      )}

      <button
        className="buy-btn"
        type="submit"
        disabled={!stripe || processing}
      >
        <FaLock />
        {processing ? "Processing payment..." : `Pay $${total.toFixed(2)}`}
      </button>

      <p className="payment-security-note">
        Your card payment is processed through Stripe.
      </p>
    </form>
  );
}

export default function Payment() {
  const { basket = [], user, emptyBasket } = useAuth();

  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [payMethod, setPayMethod] = useState("cod");
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    name: user?.displayName || "",
    phone: "",
    city: "Khartoum",
    address: "",
  });

  const total = getBasketTotalPrice(basket);

  const totalItems = basket.reduce(
    (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
    0,
  );

  const updateAddress = (e) => {
    const { name, value } = e.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const validateOrder = () => {
    if (!basket.length) {
      setError("Your basket is empty.");
      return false;
    }

    if (
      !address.name.trim() ||
      !address.phone.trim() ||
      !address.city.trim() ||
      !address.address.trim()
    ) {
      setError("Please complete all delivery details.");
      return false;
    }

    if (total <= 0) {
      setError("The order total is invalid.");
      return false;
    }

    return true;
  };

  // Clear basket after the order has been successfully created.
  // A basket-clearing failure must not make the customer repeat the order.
  const clearBasketAfterOrder = async () => {
    try {
      const success = await emptyBasket();

      if (!success) {
        toast.warning(
          "Your order was placed, but your basket could not be cleared. Please refresh your basket.",
          {
            toastId: "order-basket-clear-warning",
          },
        );
      }
    } catch (err) {
      console.error("Basket clearing failed:", err);

      toast.warning(
        "Your order was placed, but your basket could not be cleared. Please refresh your basket.",
        {
          toastId: "order-basket-clear-warning",
        },
      );
    }
  };

  // Save Cash on Delivery order.
  const saveOrderToFirebase = async (
    paymentMethod,
    paymentStatus,
    orderStatus,
    verifiedTotal = total,
    paymentIntentId = null,
  ) => {
    setError("");

    if (!validateOrder()) return;

    if (!user) {
      setError("Please sign in before placing your order.");
      return;
    }

    setProcessing(true);

    try {
      const orderBasket = basket.map((item) => ({
        id: item.id,
        title: item.title,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        img: item.img || item.image || "",
        category: item.category || "",
      }));

      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        email: user.email || "",
        basket: orderBasket,
        amount: verifiedTotal,
        totalItems,
        customerInfo: {
          name: address.name.trim(),
          phone: address.phone.trim(),
          city: address.city.trim(),
          address: address.address.trim(),
        },
        paymentMethod,
        paymentStatus,
        paymentIntentId,
        status: orderStatus,
        created: serverTimestamp(),
      });

      await clearBasketAfterOrder();

      toast.success("Your order has been placed successfully!", {
        toastId: "cod-order-success",
      });

      navigate("/orders", {
        replace: true,
      });
    } catch (err) {
      console.error("Order creation failed:", err);

      setError(err.message || "Unable to save your order. Please try again.");

      setProcessing(false);
    }
  };

  const handleCODSubmit = async (e) => {
    e.preventDefault();

    await saveOrderToFirebase("COD", "pending_cash", "pending");
  };

  // Stripe Worker creates the order.
  // The signed webhook confirms payment on the server.
  const handleStripeSuccess = async (paymentIntent, verifiedTotal, orderId) => {
    if (!paymentIntent?.id || !orderId || !verifiedTotal) {
      setError(
        "Payment succeeded, but the order reference is missing. Contact support before paying again.",
      );

      setProcessing(false);
      return;
    }

    await clearBasketAfterOrder();

    toast.success("Payment successful! Your order has been placed.", {
      toastId: "stripe-order-success",
    });

    navigate("/orders", {
      replace: true,
      state: {
        orderId,
        paymentIntentId: paymentIntent.id,
      },
    });
  };

  const handlePaymentMethodChange = (method) => {
    setPayMethod(method);
    setError("");
  };

  return (
    <main className="payment-page">
      <div className="payment-header">
        <div className="payment-header-title">
          <FaShoppingBag />
          <span>Complete Your Order</span>
        </div>

        <Link to="/checkout" className="payment-basket-link">
          <FaArrowLeft />
          Back to Basket ({totalItems})
        </Link>
      </div>

      {!basket.length ? (
        <section className="payment-empty">
          <div className="payment-empty-icon">
            <FaShoppingBag />
          </div>

          <h2>Your basket is empty</h2>

          <p>
            You haven't added any products to your basket yet. Explore Nad Store
            and find something you love.
          </p>

          <Link to="/" className="payment-primary-link">
            <FaArrowLeft />
            Continue Shopping
          </Link>
        </section>
      ) : (
        <div className="payment-layout">
          <div className="payment-main">
            <section className="payment-section">
              <div className="payment-section-heading">
                <FaMapMarkerAlt />
                <h2>Delivery Address</h2>
              </div>

              {user?.email && (
                <p className="payment-user-email">Signed in as {user.email}</p>
              )}

              <div className="payment-address-grid">
                <label className="payment-field">
                  <span>Full name</span>

                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={address.name}
                    onChange={updateAddress}
                    required
                  />
                </label>

                <label className="payment-field">
                  <span>Phone number</span>

                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    value={address.phone}
                    onChange={updateAddress}
                    required
                  />
                </label>

                <label className="payment-field">
                  <span>City</span>

                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="City"
                    value={address.city}
                    onChange={updateAddress}
                    required
                  />
                </label>

                <label className="payment-field payment-address-full">
                  <span>Address details</span>

                  <textarea
                    name="address"
                    autoComplete="street-address"
                    placeholder="Street, neighborhood, building..."
                    value={address.address}
                    onChange={updateAddress}
                    rows={3}
                    required
                  />
                </label>
              </div>
            </section>

            <section className="payment-section">
              <div className="payment-section-heading">
                <FaShoppingBag />
                <h2>Review Your Order</h2>
              </div>

              <div className="payment-review-list">
                {basket.map((item) => (
                  <CheckoutProduct
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    price={item.price}
                    rate={item.rate ?? item.rating}
                    productImg={item.img || item.image}
                    quantity={Math.max(1, Number(item.quantity) || 1)}
                  />
                ))}
              </div>
            </section>

            <section className="payment-section">
              <div className="payment-section-heading">
                <FaCreditCard />
                <h2>Payment Method</h2>
              </div>

              <div className="payment-method-options">
                <button
                  type="button"
                  className={`payment-method-option ${
                    payMethod === "cod" ? "selected" : ""
                  }`}
                  onClick={() => handlePaymentMethodChange("cod")}
                  aria-pressed={payMethod === "cod"}
                >
                  <FaMoneyBillWave />

                  <span>
                    <strong>Cash on Delivery</strong>
                    <small>Pay when your order arrives</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`payment-method-option ${
                    payMethod === "stripe" ? "selected" : ""
                  }`}
                  onClick={() => handlePaymentMethodChange("stripe")}
                  aria-pressed={payMethod === "stripe"}
                >
                  <FaCreditCard />

                  <span>
                    <strong>Credit / Debit Card</strong>
                    <small>Pay securely with Stripe</small>
                  </span>
                </button>
              </div>

              {payMethod === "cod" ? (
                <>
                  <form onSubmit={handleCODSubmit}>
                    <button
                      className="buy-btn"
                      type="submit"
                      disabled={processing || basket.length === 0}
                    >
                      {processing
                        ? "Placing order..."
                        : `Place Order · $${total.toFixed(2)} · Cash on Delivery`}
                    </button>
                  </form>

                  {error && (
                    <p
                      className="payment-error"
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Elements stripe={stripePromise}>
                    <StripeForm
                      total={total}
                      basket={basket}
                      user={user}
                      customerInfo={address}
                      processing={processing}
                      setProcessing={setProcessing}
                      onSuccess={handleStripeSuccess}
                    />
                  </Elements>

                  {error && (
                    <p
                      className="payment-error"
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          <aside className="payment-summary">
            <h2>Order Summary</h2>

            <div className="payment-summary-row">
              <span>Items ({totalItems})</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="payment-summary-row">
              <span>Shipping</span>
              <span className="payment-free">FREE</span>
            </div>

            <div className="payment-summary-total">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>

            <div className="payment-summary-security">
              <FaLock />
              <span>Secure checkout</span>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
