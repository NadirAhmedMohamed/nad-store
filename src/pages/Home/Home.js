
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "./Home.css";

import Product from "../../components/products/product/Product";
import Banner from "../../components/layout/Banner/Banner";
import CategoryBar from "../../components/products/categoryProductBar/CategoryProductBar";
import ProductSkeleton from "../../components/products/prductskeleton/ProductSkeleton";

import useProducts from "../../hooks/useProducts";
import useProductCategories from "../../hooks/useProductCategories";

export default function Home({ searchTerm = "", setSearchTerm }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const navigate = useNavigate();
  const location = useLocation();

  const {
    products = [],
    loading,
    error,
    page,
    hasNextPage,
    nextPage,
    previousPage,
  } = useProducts({
    category: selectedCategory,
    searchTerm,
  });

  const {
    categories = [],
    loadingCategories,
    categoriesError,
  } = useProductCategories();

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);

    if (setSearchTerm) {
      setSearchTerm("");
    }

    if (location.search) {
      navigate("/", { replace: true });
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");

    if (setSearchTerm) {
      setSearchTerm("");
    }

    navigate("/", { replace: true });
  };

  const hasActiveFilters =
    selectedCategory !== "all" || Boolean(searchTerm.trim());

  const formatCategoryName = (category) => {
    if (category === "all") return "All Products";

    return category
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getProductRating = (product) => {
    const rating = product?.rating;

    const value =
      typeof rating === "object" && rating !== null
        ? rating.rate
        : (rating ?? product?.rate);

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  return (
    <main className="home">
      <Banner />

      {!loadingCategories && !categoriesError && (
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
        />
      )}

      {categoriesError && (
        <p className="products-error" role="alert">
          {categoriesError}
        </p>
      )}

      {error && (
        <p className="products-error" role="alert">
          {error}
        </p>
      )}

      {hasActiveFilters && (
        <div className="active-filters">
          <div className="active-filters-info">
            <span className="active-filters-label">
              Showing products
            </span>

            {selectedCategory !== "all" && (
              <span className="active-filter-chip">
                Category: {formatCategoryName(selectedCategory)}
              </span>
            )}

            {searchTerm.trim() && (
              <span className="active-filter-chip">
                Search: "{searchTerm.trim()}"
              </span>
            )}
          </div>

          <button
            type="button"
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      <section
        className="home-products-container"
        aria-label="Available products"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        ) : products.length === 0 ? (
          <div className="no-products-container">
            <h3>No products found</h3>

            <p>
              {searchTerm.trim()
                ? `We couldn't find products matching "${searchTerm.trim()}".`
                : selectedCategory !== "all"
                  ? `There are no products available in ${formatCategoryName(selectedCategory)} right now.`
                  : "There are no products available right now."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={handleClearFilters}
              >
                Show all products
              </button>
            )}
          </div>
        ) : (
          products.map((product) => (
            <div className="product-link" key={product.id}>
              <Product
                id={product.id}
                rate={getProductRating(product)}
                title={product.title}
                price={product.price}
                description={product.description}
                img={product.image || product.img}
                category={product.category}
                discountPercentage={product.discountPercentage}
              />
            </div>
          ))
        )}
      </section>

      {!loading && products.length > 0 && (
        <nav
          className="products-pagination"
          aria-label="Products pagination"
        >
          <button
            type="button"
            onClick={previousPage}
            disabled={page === 1 || loading}
          >
            Previous
          </button>

          <span>Page: {page}</span>

          <button
            type="button"
            onClick={nextPage}
            disabled={!hasNextPage || loading}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
