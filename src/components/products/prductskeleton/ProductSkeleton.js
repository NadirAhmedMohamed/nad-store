import "./ProductSkeleton.css";

export default function ProductSkeleton() {
  return (
    <article className="skeleton-card" aria-hidden="true">
      <div className="skeleton-image" />

      <div className="skeleton-info">
        <div className="skeleton-category" />

        <div className="skeleton-title" />

        <div className="skeleton-price-rate">
          <div className="skeleton-price" />
          <div className="skeleton-rating" />
        </div>
      </div>

      <div className="skeleton-button" />
    </article>
  );
}
