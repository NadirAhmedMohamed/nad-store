import React, { useRef } from "react";
import {
  FiGrid,
  FiSmartphone,
  FiShoppingBag,
  FiHome,
  FiHeart,
  FiWatch,
  FiMonitor,
  FiCoffee,
  FiPackage,
  FiTag,
  FiTruck,
  FiGift,
  FiSun,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import "./CategoryProductBar.css";

const categoryIcons = {
  all: FiGrid,
  beauty: FiHeart,
  fragrances: FiSun,
  "skin-care": FiHeart,
  electronics: FiMonitor,
  laptops: FiMonitor,
  smartphones: FiSmartphone,
  tablets: FiMonitor,
  "mobile-accessories": FiSmartphone,
  furniture: FiHome,
  "home-decoration": FiHome,
  "kitchen-accessories": FiCoffee,
  groceries: FiCoffee,
  "mens-shirts": FiShoppingBag,
  "mens-shoes": FiShoppingBag,
  "mens-watches": FiWatch,
  tops: FiShoppingBag,
  "womens-bags": FiShoppingBag,
  "womens-dresses": FiShoppingBag,
  "womens-jewellery": FiGift,
  "womens-shoes": FiShoppingBag,
  "womens-watches": FiWatch,
  motorcycle: FiTruck,
  vehicle: FiTruck,
  "sports-accessories": FiPackage,
  sunglasses: FiSun,
};

const getCategoryIcon = (category) => categoryIcons[category] || FiTag;

const formatCategoryName = (category) => {
  if (category === "all") return "All Products";

  return category
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function CategoryBar({
  categories = [],
  selectedCategory,
  setSelectedCategory,
}) {
  const scrollRef = useRef(null);

  if (!categories.length) return null;

  const scrollCategories = (direction) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction * 280,
      behavior: "smooth",
    });
  };

  return (
    <section className="category-section">
      <div className="category-container">
        <div className="category-heading">
          <div>
            <span className="category-eyebrow">EXPLORE</span>
            <h2>Shop by Category</h2>
          </div>

          <div className="category-arrows">
            <button
              type="button"
              aria-label="Previous categories"
              onClick={() => scrollCategories(-1)}
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              aria-label="Next categories"
              onClick={() => scrollCategories(1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div
          className="category-scroll"
          ref={scrollRef}
          role="group"
          aria-label="Product categories"
        >
          {categories.map((cat) => {
            const isActive = cat === selectedCategory;
            const Icon = getCategoryIcon(cat);

            return (
              <button
                key={cat}
                type="button"
                className={`category-item ${isActive ? "active" : ""}`}
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(cat)}
              >
                <span className="category-icon">
                  <Icon size={18} />
                </span>

                <span className="category-label">
                  {formatCategoryName(cat)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
