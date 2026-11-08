import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Product.css";

import { useAuth } from "../../../contexts/GlobalState";
import { toast } from "react-toastify";

import { FaShoppingCart, FaStar, FaCheck, FaImage } from "react-icons/fa";

export default function Product({
  id,
  title,
  price,
  description,
  rate,
  img,
  category,
  discountPercentage,
}) {
  const navigate = useNavigate();

  const { addToBasket, isBasketReady } = useAuth();

  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const originalPrice = Math.max(0, Number(price) || 0);

  const discount = Math.min(100, Math.max(0, Number(discountPercentage) || 0));

  const finalPrice = originalPrice * (1 - discount / 100);

  const rating = Number(rate) || 0;

  useEffect(() => {
    if (!added) return;

    const timer = setTimeout(() => {
      setAdded(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [added]);

  const handleProductClick = () => {
    if (!id) return;

    navigate(`/product/${id}`);
  };

  const handleProductKeyDown = (event) => {
    if (
      event.target === event.currentTarget &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      handleProductClick();
    }
  };

  const handleAddToBasket = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (adding) return;

    if (!id) {
      toast.error("Invalid product information.");
      return;
    }

    if (typeof addToBasket !== "function") {
      toast.error("Basket service is currently unavailable.");
      return;
    }

    if (isBasketReady === false) {
      toast.info("Your basket is still loading. Please try again shortly.");
      return;
    }

    const productItem = {
      id,
      title: title || "Product",
      price: Number(finalPrice.toFixed(2)),
      originalPrice: Number(originalPrice.toFixed(2)),
      description: description || "",
      rate: rating,
      img: img || "",
      image: img || "",
      category: category || "General",
      discountPercentage: discount,
      quantity: 1,
    };

    setAdding(true);

    try {
      const success = await addToBasket(productItem);

      if (success !== true) {
        throw new Error("Unable to add this product to your basket.");
      }

      setAdded(true);

      toast.success(`${title || "Product"} added to your basket!`, {
        toastId: `basket-add-${id}`,
      });
    } catch (error) {
      console.error("Add to basket failed:", error);

      toast.error(
        error?.message || "Unable to add this product. Please try again.",
        {
          toastId: `basket-add-error-${id}`,
        },
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className="product"
      onClick={handleProductClick}
      onKeyDown={handleProductKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`View ${title || "product"} details`}
    >
      <div className="image-container">
        {discount > 0 && (
          <span className="discount-badge">-{Math.round(discount)}%</span>
        )}

        {img ? (
          <img
            src={img}
            alt={title || "Product"}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder">
            <FaImage />
            <span>Image unavailable</span>
          </div>
        )}
      </div>

      <div className="product-info">
        {category && <span className="product-category">{category}</span>}

        <h3 className="title" title={title}>
          {title || "Unnamed Product"}
        </h3>

        <div className="price-and-rate">
          <div className="product-prices">
            <span className="price">${finalPrice.toFixed(2)}</span>

            {discount > 0 && (
              <span className="old-price">${originalPrice.toFixed(2)}</span>
            )}
          </div>

          {rating > 0 && (
            <div className="rate">
              <FaStar />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`add-cart-btn ${added ? "added" : ""}`}
        onClick={handleAddToBasket}
        disabled={adding || isBasketReady === false}
        aria-label={`Add ${title || "product"} to basket`}
      >
        {adding ? (
          <>
            <FaShoppingCart />
            Adding...
          </>
        ) : added ? (
          <>
            <FaCheck />
            Added to Basket
          </>
        ) : (
          <>
            <FaShoppingCart />
            Add to Basket
          </>
        )}
      </button>
    </article>
  );
}
