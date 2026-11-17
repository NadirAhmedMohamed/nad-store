import { useEffect, useRef, useState } from "react";
import "./Banner.css";

const slides = [
  {
    id: 1,
    tag: "SPECIAL OFFERS",
    title: "Everything You Love,",
    highlight: "For Less.",
    description:
      "Discover incredible deals on products you'll love. Quality shopping starts here.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=75",
    imageAlt: "Modern fashion retail collection",
    number: "01",
  },
  {
    id: 2,
    tag: "JUST ARRIVED",
    title: "Discover What's",
    highlight: "New.",
    description:
      "Explore fresh arrivals and discover products selected to make every day better.",
    image:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1000&q=75",
    imageAlt: "Modern furniture and lifestyle collection",
    number: "02",
  },
  {
    id: 3,
    tag: "TECHNOLOGY & MORE",
    title: "Upgrade Your",
    highlight: "Everyday.",
    description:
      "Find the technology you need, with products designed to keep you connected.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=75",
    imageAlt: "Premium headphones",
    number: "03",
  },
  {
    id: 4,
    tag: "YOUR STYLE, YOUR WAY",
    title: "Make Every Look",
    highlight: "Count.",
    description:
      "Explore styles that express your personality and bring your wardrobe to life.",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=75",
    imageAlt: "Fashion clothing collection",
    number: "04",
  },
];

const AUTOPLAY_DELAY = 10000;

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const touchStartX = useRef(null);

  const goToSlide = (index) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  const goToNext = () => {
  setActiveIndex((current) => (current + 1) % slides.length);
};


  const goToPrevious = () => {
  setActiveIndex(
    (current) => (current - 1 + slides.length) % slides.length
  );
};

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setIsReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();

    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (isPaused || isReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(interval);
  }, [isPaused, isReducedMotion]);

  const handleShopNow = () => {
    document.querySelector(".home-products-container")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const difference = touchStartX.current - event.changedTouches[0].clientX;

    if (Math.abs(difference) > 50) {
      difference > 0 ? goToNext() : goToPrevious();
    }

    touchStartX.current = null;
  };

  return (
    <section
      className="banner"
      aria-label="Featured collections"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="banner-swiper">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`banner-slide ${
              index === activeIndex ? "banner-slide-active" : ""
            }`}
            aria-hidden={index !== activeIndex}
            inert={index !== activeIndex}
          >
            <div className="banner-content">
              <span className="banner-tag">
                <span className="banner-tag-dot" />
                {slide.tag}
              </span>

              <h1>
                {slide.title}
                <span className="banner-highlight">{slide.highlight}</span>
              </h1>

              <p>{slide.description}</p>

              <button
                type="button"
                className="banner-cta"
                onClick={handleShopNow}
              >
                <span>Explore Collection</span>
                <span className="banner-cta-arrow" aria-hidden="true">
                  →
                </span>
              </button>

              <div className="banner-trust">
                <span className="banner-trust-line" />
                <span>Discover more. Shop smarter.</span>
              </div>
            </div>

            <div className="banner-visual">
              <div className="banner-image-frame">
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "low"}
                  decoding="async"
                />
              </div>

              <span className="banner-image-decoration" />

              <div className="banner-image-index">
                <span>{slide.number}</span>
                <span className="banner-index-divider" />
                <span>04</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="banner-controls">
        <div className="banner-pagination" aria-label="Choose a slide">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`banner-pagination-bullet ${
                index === activeIndex ? "banner-pagination-bullet-active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>

        <div className="banner-navigation">
          <button
            type="button"
            className="banner-nav-btn"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            ←
          </button>

          <button
            type="button"
            className="banner-nav-btn"
            onClick={goToNext}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
