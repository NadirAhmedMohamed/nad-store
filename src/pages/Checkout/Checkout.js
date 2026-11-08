import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/GlobalState";
import CheckoutProduct from "../../components/cart/CheckoutProduct";

import "./Checkout.css";
import checkoutBanner from "../../assets/checkout-banner.jpg";

import { getBasketTotalPrice } from "../../contexts/AppReducer";
import { NumericFormat } from "react-number-format";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import {
  FaShoppingBag,
  FaLock,
  FaArrowLeft,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function Checkout() {
  const {
    basket = [],
    user,
    updateBasketQuantity,
    removeFromBasket,
    emptyBasket,
  } = useAuth();

  const [busyItems, setBusyItems] = useState({});
  const [clearingBasket, setClearingBasket] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const hasBusyItems = Object.values(busyItems).some(Boolean);

  const totalItems = basket.reduce(
    (total, item) => total + Math.max(1, Number(item.quantity) || 1),
    0,
  );

  const subtotal = getBasketTotalPrice(basket);

  // Close the confirmation modal with Escape.
  // Prevent background scrolling while the modal is open.
  useEffect(() => {
    if (!showClearModal) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !clearingBasket) {
        setShowClearModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showClearModal, clearingBasket]);

  // Track loading state for individual products.
  const setItemBusy = (id, value) => {
    setBusyItems((previous) => ({
      ...previous,
      [String(id)]: value,
    }));
  };

  // Update product quantity.
  const updateQuantity = async (id, quantity) => {
    if (
      quantity < 1 ||
      !Number.isInteger(quantity) ||
      busyItems[String(id)] ||
      clearingBasket
    ) {
      return;
    }

    setItemBusy(id, true);

    try {
      const success = await updateBasketQuantity(id, quantity);

      if (!success) {
        throw new Error("Unable to update product quantity.");
      }
    } catch (error) {
      console.error("Quantity update failed:", error);

      toast.error(error?.message || "Unable to update product quantity.", {
        toastId: `quantity-error-${id}`,
      });
    } finally {
      setItemBusy(id, false);
    }
  };

  // Remove a product from the basket.
  const handleRemoveProduct = async (id, title) => {
    if (busyItems[String(id)] || clearingBasket) return;

    setItemBusy(id, true);

    try {
      const success = await removeFromBasket(id);

      if (!success) {
        throw new Error("Unable to remove this product.");
      }

      toast.success(`${title} removed from your basket.`, {
        toastId: `remove-product-${id}`,
      });
    } catch (error) {
      console.error("Product removal failed:", error);

      toast.error(
        error?.message || "Unable to remove this product. Please try again.",
        {
          toastId: `remove-product-error-${id}`,
        },
      );
    } finally {
      setItemBusy(id, false);
    }
  };

  // Open confirmation modal.
  const openClearModal = () => {
    if (basket.length === 0 || clearingBasket || hasBusyItems) {
      return;
    }

    setShowClearModal(true);
  };

  // Close confirmation modal.
  const closeClearModal = () => {
    if (clearingBasket) return;

    setShowClearModal(false);
  };

  // Empty the entire basket after confirmation.
  const handleEmptyBasket = async () => {
    if (basket.length === 0 || clearingBasket || hasBusyItems) {
      return;
    }

    setClearingBasket(true);

    try {
      const success = await emptyBasket();

      if (!success) {
        throw new Error("Unable to empty your basket.");
      }

      setShowClearModal(false);

      toast.success("Your basket has been emptied.", {
        toastId: "basket-emptied",
      });
    } catch (error) {
      console.error("Empty basket failed:", error);

      toast.error(
        error?.message || "Unable to empty your basket. Please try again.",
        {
          toastId: "empty-basket-error",
        },
      );
    } finally {
      setClearingBasket(false);
    }
  };

  return (
    <>
      <main className="checkout-container">
        {/* LEFT SECTION */}
        <section className="checkout-left">
          <div className="checkout-banner">
            <img src={checkoutBanner} alt="Nad Store shopping" />
          </div>

          <div className="checkout-heading">
            <div className="checkout-welcome">
              Hello{user?.email ? `, ${user.email}` : ", Guest"}
            </div>

            <div className="checkout-heading-top">
              <div>
                <h1>
                  <FaShoppingBag />
                  Your Shopping Basket
                </h1>

                <p>
                  {totalItems} {totalItems === 1 ? "item" : "items"} in your
                  basket
                </p>
              </div>

              {basket.length > 0 && (
                <button
                  type="button"
                  className="checkout-clear-basket"
                  onClick={openClearModal}
                  disabled={clearingBasket || hasBusyItems}
                >
                  <FaTrash />
                  Clear Basket
                </button>
              )}
            </div>
          </div>

          {/* BASKET PRODUCTS */}
          <div className="checkout-products-container">
            {basket.length > 0 ? (
              basket.map((product) => {
                const itemId = String(product.id);
                const itemBusy = Boolean(busyItems[itemId]);

                return (
                  <CheckoutProduct
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    rate={product.rate ?? product.rating}
                    description={product.description}
                    price={product.price}
                    productImg={product.img || product.image}
                    quantity={Math.max(1, Number(product.quantity) || 1)}
                    isUpdating={itemBusy}
                    isRemoving={itemBusy}
                    onIncrease={() =>
                      updateQuantity(
                        product.id,
                        (Number(product.quantity) || 1) + 1,
                      )
                    }
                    onDecrease={() =>
                      updateQuantity(
                        product.id,
                        (Number(product.quantity) || 1) - 1,
                      )
                    }
                    onRemove={() =>
                      handleRemoveProduct(product.id, product.title)
                    }
                  />
                );
              })
            ) : (
              <div className="empty-basket">
                <FaShoppingBag className="empty-basket-icon" />

                <h2>Your basket is empty</h2>

                <p>
                  You haven't added any products yet. Explore our store and find
                  something you like.
                </p>

                <Link to="/" className="continue-shopping">
                  <FaArrowLeft />
                  Continue Shopping
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SECTION */}
        <aside className="checkout-right">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Items ({totalItems})</span>

            <NumericFormat
              value={subtotal}
              displayType="text"
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
            />
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span className="free-shipping">FREE</span>
          </div>

          <div className="summary-row">
            <span>Discounts</span>
            <span>Included in price</span>
          </div>

          <div className="summary-total">
            <span>Order Total</span>

            <NumericFormat
              value={subtotal}
              displayType="text"
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
            />
          </div>

          <label className="gift-option">
            <input type="checkbox" />
            <span>This order contains a gift</span>
          </label>

          {basket.length > 0 ? (
            <Link
              to="/payment"
              className={`proceed-checkout ${
                clearingBasket || hasBusyItems ? "disabled" : ""
              }`}
              aria-disabled={clearingBasket || hasBusyItems}
              onClick={(event) => {
                if (clearingBasket || hasBusyItems) {
                  event.preventDefault();
                }
              }}
            >
              Proceed to Checkout
            </Link>
          ) : (
            <button type="button" className="proceed-checkout" disabled>
              Proceed to Checkout
            </button>
          )}

          <div className="secure-checkout">
            <FaLock />
            <span>Secure checkout</span>
          </div>
        </aside>
      </main>

      {/* =========================================
          CLEAR BASKET CONFIRMATION MODAL
      ========================================= */}

      {showClearModal && (
        <div className="clear-basket-overlay" onClick={closeClearModal}>
          <div
            className="clear-basket-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-basket-title"
            aria-describedby="clear-basket-description"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="clear-modal-close"
              onClick={closeClearModal}
              disabled={clearingBasket}
              aria-label="Close confirmation"
            >
              <FaTimes />
            </button>

            <div className="clear-modal-icon">
              <FaShoppingBag />
              <span>
                <FaExclamationTriangle />
              </span>
            </div>

            <h2 id="clear-basket-title">Clear Your Basket?</h2>

            <p id="clear-basket-description">
              Are you sure you want to remove all products from your basket?
              This action cannot be undone.
            </p>

            <div className="clear-modal-actions">
              <button
                type="button"
                className="clear-modal-cancel"
                onClick={closeClearModal}
                disabled={clearingBasket}
              >
                Cancel
              </button>

              <button
                type="button"
                className="clear-modal-confirm"
                onClick={handleEmptyBasket}
                disabled={clearingBasket}
              >
                {clearingBasket ? (
                  <>
                    <span className="clear-modal-spinner" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Yes, Clear Basket
                  </>
                )}
              </button>
            </div>

            <div className="clear-modal-note">
              Your basket will be completely emptied.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
