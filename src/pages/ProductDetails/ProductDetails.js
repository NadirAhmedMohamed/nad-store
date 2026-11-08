import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/GlobalState";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../firebase.config";

import {
  FaShoppingCart,
  FaMinus,
  FaPlus,
  FaStar,
  FaArrowLeft,
  FaBoxOpen,
  FaCheckCircle,
} from "react-icons/fa";

import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();

  const { addToBasket, isBasketReady } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // =========================================
  // FETCH PRODUCT
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setProduct(null);
      setQuantity(1);
      setAdded(false);

      try {
        if (!id) {
          throw new Error("Invalid product ID.");
        }

        const snapshot = await getDoc(doc(db, "products", id));

        if (cancelled) return;

        if (snapshot.exists()) {
          setProduct({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);

        if (!cancelled) {
          toast.error("Unable to load product details. Please try again.", {
            toastId: `product-load-${id}`,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // =========================================
  // PRODUCT INFORMATION
  // =========================================

  const image = product?.image || product?.img || "";
  const price = Number(product?.price) || 0;
  const rating =
    Number(product?.rating?.rate ?? product?.rating ?? product?.rate) || 0;

  const discount = Math.min(
    100,
    Math.max(0, Number(product?.discountPercentage) || 0),
  );

  const discountedPrice = price * (1 - discount / 100);

  // =========================================
  // ADD TO BASKET
  // =========================================

  async function handleAddToBasket() {
    if (adding || !product) return;

    if (typeof addToBasket !== "function") {
      toast.error("Basket service is currently unavailable.");
      return;
    }

    if (isBasketReady === false) {
      toast.info("Your basket is still loading. Please try again shortly.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Please select a valid quantity.");
      return;
    }

    setAdding(true);

    const productItem = {
      id: product.id,
      title: product.title,
      price: Number(discountedPrice.toFixed(2)),
      originalPrice: price,
      description: product.description || "",
      rate: rating,
      img: image,
      image,
      category: product.category || "General",
      discountPercentage: discount,
      quantity,
    };

    try {
      const success = await addToBasket(productItem);

      if (!success) {
        throw new Error("Unable to add this product to your basket.");
      }

      setAdded(true);

      toast.success(`${product.title} added to your basket!`, {
        toastId: `product-details-add-${product.id}`,
      });
    } catch (error) {
      console.error("Error adding product to basket:", error);

      setAdded(false);

      toast.error(
        error?.message || "Unable to add this product. Please try again.",
        {
          toastId: `product-details-add-error-${product.id}`,
        },
      );
    } finally {
      setAdding(false);
    }
  }

  // =========================================
  // LOADING STATE
  // =========================================

  if (loading) {
    return <div className="product-not-found">Loading product...</div>;
  }

  // =========================================
  // PRODUCT NOT FOUND
  // =========================================

  if (!product) {
    return (
      <div className="product-not-found">
        <FaBoxOpen className="not-found-icon" />

        <h2>Product not found</h2>

        <p>The product may have been removed or is unavailable.</p>

        <Link to="/" className="back-to-store">
          <FaArrowLeft />
          Back to Nad Store
        </Link>
      </div>
    );
  }

  // =========================================
  // PRODUCT DETAILS
  // =========================================

  return (
    <main className="product-details-page">
      <Link to="/" className="product-back-link">
        <FaArrowLeft />
        Continue shopping
      </Link>

      <section className="product-details">
        {/* Product Image */}

        <div className="left-side">
          {discount > 0 && (
            <span className="product-discount-badge">
              -{Math.round(discount)}% OFF
            </span>
          )}

          <div className="product-image-frame">
            {image ? (
              <img src={image} alt={product.title || "Product"} />
            ) : (
              <FaBoxOpen className="product-image-placeholder" />
            )}
          </div>
        </div>

        {/* Product Information */}

        <div className="right-side">
          <div className="product-category-label">
            {product.category || "General"}
          </div>

          <div className="product-headline">
            <h1 className="product-title">{product.title}</h1>

            <div className="price-container">
              <span className="new-price">${discountedPrice.toFixed(2)}</span>

              {discount > 0 && (
                <span className="old-price">${price.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Rating */}

          <div className="rate-and-customers">
            <span className="rate">
              <FaStar />
              {rating > 0 ? rating.toFixed(1) : "No rating"}
            </span>

            <span className="reviews">
              {product.rating?.count
                ? `(${product.rating.count} reviews)`
                : "(Customer reviews)"}
            </span>
          </div>

          {/* Description */}

          <p className="description">
            {product.description || "No description available."}
          </p>

          <div className="product-details-divider" />

          {/* Quantity & Add to Basket */}

          <div className="quantity-add-cart-container">
            <div className="quantity-container">
              <span className="quantity-label">Quantity</span>

              <div className="quantity-controls">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || adding}
                  onClick={() => {
                    setQuantity((current) => Math.max(1, current - 1));
                    setAdded(false);
                  }}
                >
                  <FaMinus />
                </button>

                <span className="counter">{quantity}</span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={adding}
                  onClick={() => {
                    setQuantity((current) => current + 1);
                    setAdded(false);
                  }}
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToBasket}
              className="add-cart-btn"
              disabled={adding || isBasketReady === false}
            >
              {adding ? (
                "Adding..."
              ) : added ? (
                <>
                  <FaCheckCircle />
                  Added to Basket
                </>
              ) : (
                <>
                  <FaShoppingCart />
                  Add to Basket
                </>
              )}
            </button>
          </div>

          {/* Trust Note */}

          <div className="product-trust-note">
            <FaCheckCircle />
            <span>Shop with confidence at Nad Store</span>
          </div>
        </div>
      </section>
    </main>
  );
}
