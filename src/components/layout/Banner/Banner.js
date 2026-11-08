import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

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
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
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
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1400&q=85",
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
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85",
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
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Fashion clothing collection",
    number: "04",
  },
];

export default function Banner() {
  const paginationRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const handleShopNow = () => {
    document.querySelector(".home-products-container")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="banner" aria-label="Featured collections">
      <Swiper
        className="banner-swiper"
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop={true}
        speed={800}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true,
        }}
        pagination={{
          clickable: true,
          el: paginationRef.current,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.pagination.el = paginationRef.current;
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="banner-slide">
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
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Separate navigation bar */}
      <div className="banner-controls">
        <div className="banner-pagination" ref={paginationRef} />

        <div className="banner-navigation">
          <button
            type="button"
            className="banner-nav-btn"
            ref={prevRef}
            aria-label="Previous slide"
          >
            ←
          </button>

          <button
            type="button"
            className="banner-nav-btn"
            ref={nextRef}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
