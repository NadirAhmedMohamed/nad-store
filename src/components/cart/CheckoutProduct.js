import React from "react";
import "../cart/CheckotProduct.css";

import { FaStar, FaTrash, FaPlus, FaMinus } from "react-icons/fa";

export default function CheckoutProduct({
  id,
  title,
  description,
  price,
  rate,
  removeFromBasketBtn,
  productImg,
  quantity = 1,
  onIncrease,
  onDecrease,
  onRemove,
  isUpdating = false,
  isRemoving = false,
}) {
  const image = productImg || "";
  const productPrice = Number(price) || 0;
  const productQuantity = Math.max(1, Number(quantity) || 1);

  const isBusy = isUpdating || isRemoving;

  const handleRemove = () => {
    if (!isBusy && onRemove) {
      onRemove();
    }
  };

  return (
    <article className="checkout-product">
      <div className="checkout-product-image">
        {image ? (
          <img src={image} alt={title || "Product"} />
        ) : (
          <div className="checkout-product-no-image">No image</div>
        )}
      </div>

      <div className="checkout-product-info">
        <h3 className="checkout-product-title">{title}</h3>

        {description && (
          <p className="checkout-product-description">{description}</p>
        )}

        {rate != null && rate !== "" && (
          <div className="checkout-product-rating">
            <span>{rate}</span>
            <FaStar />
          </div>
        )}

        <div className="checkout-product-price">${productPrice.toFixed(2)}</div>

        {onIncrease && onDecrease && (
          <div className="checkout-product-quantity">
            <span className="quantity-label">Quantity:</span>

            <div className="quantity-controls">
              <button
                type="button"
                className="quantity-btn"
                onClick={onDecrease}
                disabled={isBusy || productQuantity <= 1}
                aria-label={`Decrease ${title} quantity`}
              >
                <FaMinus />
              </button>

              <span className="quantity-value">{productQuantity}</span>

              <button
                type="button"
                className="quantity-btn"
                onClick={onIncrease}
                disabled={isBusy}
                aria-label={`Increase ${title} quantity`}
              >
                <FaPlus />
              </button>
            </div>
          </div>
        )}

        <div className="checkout-product-bottom">
          <span className="checkout-product-subtotal">
            Subtotal: ${(productPrice * productQuantity).toFixed(2)}
          </span>

          {(removeFromBasketBtn || onRemove) && (
            <button
              type="button"
              className="checkout-product-remove"
              onClick={handleRemove}
              disabled={isBusy}
              aria-label={`Remove ${title} from basket`}
            >
              <FaTrash />

              <span>{isRemoving ? "Removing..." : "Remove"}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
