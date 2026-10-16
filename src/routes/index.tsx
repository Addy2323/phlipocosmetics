import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Truck,
  ShieldCheck,
  Sparkles,
  Headphones,
  ArrowRight,
  Star,
  CheckCircle2,
  CalendarHeart,
  Clock,
  HeartHandshake,
  Award,
  Flame,
  Search,
  Filter,
  ChevronRight,
  Percent,
} from "lucide-react";
import heroLuminous from "@/assets/hero/hero-luminous.jpg";
import heroShop from "@/assets/hero/shop.png";
import heroBurgundy from "@/assets/hero/hero.jpg";
import mobileHeroModel from "@/assets/hero/mobile-hero-model.jpg";
import heroSalonBraids from "@/assets/hero/hero-salon-braids.jpg";
import heroSalonCurls from "@/assets/hero/hero-salon-curls.jpg";
import mobileOfferBanner from "@/assets/mobile-offer-banner.jpg";
import beautyTools from "@/assets/beauty-tools.jpg";
import cream from "@/assets/p-cream.jpg";
import lipstick from "@/assets/p-lipstick.jpg";
import hairoil from "@/assets/p-hairoil.jpg";
import salon from "@/assets/salon/salon.jpg";
import catSkincare from "@/assets/skincare/cat-skincare.jpg";
import catMakeup from "@/assets/makeup/cat-makeup.jpg";
import catHair from "@/assets/hair-care/cat-hair.jpg";
import catFragrance from "@/assets/fragrance/cat-fragrance.jpg";
import catBodyOil from "@/assets/body-oil/cat-body-oil.jpg";
import catSoap from "@/assets/soap/cat-soap.jpg";
import { Site, Section } from "@/components/Site";
import { ProductCard } from "@/components/ProductCard";
import { MobileProductCard } from "@/components/MobileProductCard";
import { products, categories, money, BRAND, salonServices } from "@/data/shop";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Philipo Cosmetics & Hair Salon — Luxury Beauty in Tanzania" },
      {
        name: "description",
        content:
          "Discover luxury cosmetics, skincare, and hair care with nationwide delivery in Tanzania, and book professional salon styling in Dar es Salaam.",
      },
      { property: "og:title", content: "Philipo Cosmetics & Hair Salon — Luxury Beauty" },
      {
        property: "og:description",
        content:
          "Discover Your Beauty. Define Your Elegance. Explore premium cosmetics and book professional hair styling.",
      },
    ],
  }),
  component: Home,
});

interface HeroSlide {
  image: string;
  alt: string;
  badge: string;
  desktopPosition: string;
  mobilePosition: string;
}

const heroSlides: HeroSlide[] = [
  {
    image: heroLuminous,
    alt: "Philipo Cosmetics Editorial Campaign — Radiant Natural Beauty",
    badge: "Luxury Cosmetics & Hair Salon · Tanzania",
    desktopPosition: "object-[78%_center] sm:object-[80%_center] lg:object-[82%_center]",
    mobilePosition: "object-[72%_center]",
  },
  {
    image: heroShop,
    alt: "Philipo Cosmetics Flagship Boutique & Salon Suite — Tanzania",
    badge: "Flagship Boutique & Salon Suite · Tanzania",
    desktopPosition: "object-[center_28%] sm:object-[75%_28%] lg:object-[80%_28%]",
    mobilePosition: "object-[center_25%]",
  },
  {
    image: heroBurgundy,
    alt: "Philipo Cosmetics Evening Luxury Glamour & Radiant Serums",
    badge: "Authentic Luxury Skincare & Makeup",
    desktopPosition: "object-[68%_center] sm:object-[72%_center] lg:object-[75%_center]",
    mobilePosition: "object-[65%_center]",
  },
  {
    image: mobileHeroModel,
    alt: "Philipo Cosmetics Radiant Collection & Glow Serums",
    badge: "100% Genuine Provenance Guaranteed",
    desktopPosition: "object-[80%_center] sm:object-[84%_center] lg:object-[86%_center]",
    mobilePosition: "object-[72%_center]",
  },
  {
    image: heroSalonBraids,
    alt: "Philipo Hair Salon — Master Stylists & Knotless Braids",
    badge: "Master Salon Stylists · Dar es Salaam",
    desktopPosition: "object-[62%_25%] sm:object-[66%_25%] lg:object-[70%_20%]",
    mobilePosition: "object-[55%_25%]",
  },
  {
    image: heroSalonCurls,
    alt: "Philipo Hair Salon — Luxury Waves & Bespoke Styling",
    badge: "Bespoke Hair Artistry & Care",
    desktopPosition: "object-[62%_20%] sm:object-[66%_20%] lg:object-[68%_15%]",
    mobilePosition: "object-[55%_20%]",
  },
];

const trustHighlights = [
  {
    icon: Truck,
    title: "Nationwide Delivery",
    desc: "Same-day dispatch in Dar es Salaam; 2–4 business days express across Tanzania.",
  },
  {
    icon: ShieldCheck,
    title: "100% Genuine Provenance",
    desc: "Authentic formulas directly from vetted manufacturers, batch-tracked and sealed.",
  },
  {
    icon: Sparkles,
    title: "Professional Salon Artistry",
    desc: "Certified master stylists for knotless braids, silk presses, and bespoke styling.",
  },
  {
    icon: Headphones,
    title: "Dedicated WhatsApp Care",
    desc: "Direct support and personalized beauty consultations at +255 744 281 673.",
  },
];

const beautyTips = [
  {
    title: "Maintaining Your Silk Press in Humid Weather",
    category: "Hair Artistry",
    readTime: "3 min read",
    snippet:
      "Discover the salon-approved humidity barrier technique using our Luxe Hair Oil to keep your silk press sleek and frizz-free all week.",
  },
  {
    title: "The 3-Step Coastal Glow Morning Routine",
    category: "Skincare Rituals",
    readTime: "4 min read",
    snippet:
      "How vitamin C and niacinamide work synergistically with lightweight hydration for radiant, even skin under the equatorial sun.",
  },
  {
    title: "Finding Your Signature Velvet Berry Undertone",
    category: "Makeup Mastery",
    readTime: "2 min read",
    snippet:
      "Why deep berry tones flatter rich melanin complexions effortlessly and how to prep lips for eight-hour velvet wear without drying.",
  },
];

const verifiedReviews = [
  {
    name: "Amina M.",
    role: "Verified Purchaser · Dar es Salaam",
    comment:
      "The Radiant Renewal Serum completely transformed my skin texture within three weeks. Lightweight, non-greasy, and withstands our tropical heat.",
    rating: 5,
    product: "Radiant Renewal Serum",
  },
  {
    name: "Grace K.",
    role: "Salon Client · Masaki",
    comment:
      "Amina at the Philipo Salon gave me the most flawless signature knotless braids. The chair booking was completely seamless and SMS reminders were spot on.",
    rating: 5,
    product: "Signature Braiding Service",
  },
  {
    name: "Fatma S.",
    role: "Verified Purchaser · Arusha",
    comment:
      "Delivered to Arusha in under 48 hours in immaculate luxury packaging. The Matte Liquid Lipstick in Berry is my new holy grail.",
    rating: 5,
    product: "Matte Liquid Lipstick — Berry",
  },
];

/* Mobile category shortcuts with circular images */
const mobileCategories = [
  { name: "Skincare", image: cream, search: "Skincare", isOffer: false },
  { name: "Makeup", image: lipstick, search: "Makeup", isOffer: false },
  { name: "Fragrances", image: catFragrance, search: "Fragrance", isOffer: false },
  { name: "Hair Care", image: hairoil, search: "Hair", isOffer: false },
  { name: "Body Oils", image: catBodyOil, search: "Body Oils", isOffer: false },
  { name: "Soaps", image: catSoap, search: "Soaps", isOffer: false },
  { name: "Beauty Tools", image: beautyTools, search: "Tools", isOffer: false },
  { name: "Offers", image: "", search: "All", isOffer: true },
];

function Home() {
  const bestSellers = products.slice(0, 4);
  const newArrivals = [
    products.find((p) => p.id === "P-1005") || products[0],
    products.find((p) => p.id === "P-1007") || products[1],
    products.find((p) => p.id === "P-1003") || products[2],
    products.find((p) => p.id === "P-1006") || products[3],
  ];

  const isMobile = useIsMobile();
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate hero images seamlessly every 5 seconds (5000ms) without visible controls
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const searchMatches = mobileSearchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(mobileSearchQuery.toLowerCase()),
      )
    : [];

  return (
    <Site>
      {/* ═══════════════════════════════════════════════════════ */}
      {/*   MOBILE HOMEPAGE — visible < md only                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* Section B — Premium Promotional Hero Banner */}
        <section className="px-4 pt-3 pb-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FDEEF4] via-[#FFF3F8] to-[#FCEAF2] shadow-soft border border-[#EC008C]/15">
            <div className="relative flex items-stretch min-h-[220px]">
              {/* Left content */}
              <div className="flex-1 p-5 pr-1 flex flex-col justify-center z-10">
                {/* Philipo Cosmetics Logo brand mark */}
                <div className="mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-[#EC008C]" />
                    <span className="font-display text-lg font-bold text-[#243B90] tracking-tight">
                      Philipo{" "}
                      <span className="font-sans italic text-[#EC008C] font-semibold text-base">
                        Cosmetics
                      </span>
                    </span>
                  </div>
                  <p className="text-[7.5px] font-semibold tracking-[0.24em] text-[#77747C] uppercase mt-0.5">
                    BEAUTY · CARE · CONFIDENCE
                  </p>
                </div>

                <h2 className="font-display text-2xl xs:text-[26px] font-semibold text-[#243B90] leading-[1.12] tracking-tight">
                  Glow Naturally,
                  <br />
                  <span className="text-[#EC008C] italic">Shine Beautifully</span>
                </h2>
                <p className="mt-1.5 text-[10.5px] text-[#77747C] leading-relaxed max-w-[165px]">
                  Explore our premium beauty collection for radiant you.
                </p>
                <Link
                  to="/shop"
                  search={{ category: "All" }}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#EC008C] px-4 py-2 text-[11px] font-semibold text-white shadow-md w-fit hover:bg-[#D4006F] transition-all active:scale-95"
                >
                  Shop Now <ArrowRight className="size-3" />
                </Link>
              </div>

              {/* Right hero image - seamless automatic slideshow with smooth crossfade */}
              <div className="w-[50%] relative overflow-hidden flex items-center justify-end">
                {heroSlides.map((slide, index) => {
                  const isActive = index === currentSlide;
                  return (
                    <img
                      key={index}
                      src={slide.image}
                      alt={slide.alt}
                      className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out ${
                        slide.mobilePosition
                      } ${isActive ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"}`}
                    />
                  );
                })}
                <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#FFF3F8] to-transparent pointer-events-none z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Section C — Product Search Bar */}
        <section className="px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#77747C]" />
            <input
              type="text"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              placeholder="Search for beauty products..."
              className="h-12 w-full rounded-2xl border border-border/80 bg-white pl-11 pr-12 text-sm text-[#25232B] placeholder:text-[#77747C] outline-none transition-all focus:border-[#EC008C] focus:ring-2 focus:ring-[#EC008C]/20 shadow-xs"
            />
            <Link
              to="/shop"
              search={{ category: "All" }}
              aria-label="Filter products"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-xl bg-[#FCEAF2] text-[#EC008C] transition-colors hover:bg-[#EC008C]/20 active:scale-95"
            >
              <Filter className="size-4 text-[#EC008C]" />
            </Link>
          </div>

          {/* Quick live search drop-down if user types */}
          {searchMatches.length > 0 && (
            <div className="mt-2 rounded-2xl bg-white border border-border p-3 shadow-lg max-h-60 overflow-y-auto space-y-1.5 z-20 relative">
              {searchMatches.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-10 rounded-lg object-cover border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#25232B] truncate">{item.name}</p>
                    <p className="text-[10px] text-rose">{item.category}</p>
                  </div>
                  <span className="text-xs font-bold text-[#243B90]">{money(item.price)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Section D — Horizontal Category Shortcuts */}
        <section className="py-2.5">
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {mobileCategories.map((cat) => (
              <Link
                key={cat.name}
                to="/shop"
                search={{ category: cat.search }}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className="size-[62px] rounded-full overflow-hidden bg-[#FCEAF2] border-2 border-white shadow-xs p-1 flex items-center justify-center group-hover:border-[#EC008C] group-active:scale-95 transition-all">
                  {cat.isOffer ? (
                    <div className="size-full rounded-full bg-gradient-to-br from-[#EC008C] to-[#FF40A8] flex items-center justify-center text-white shadow-xs">
                      <Percent className="size-6 text-white" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="size-full rounded-full object-cover"
                    />
                  )}
                </div>
                <span className="text-[11px] font-medium text-[#25232B] text-center leading-tight whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section E — Best Sellers (horizontal scroll) */}
        <section className="py-3">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-display text-2xl font-bold text-[#25232B]">Best Sellers</h2>
            <Link
              to="/shop"
              search={{ category: "All" }}
              className="text-xs font-semibold text-[#EC008C] flex items-center gap-0.5 hover:underline"
            >
              View All <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {bestSellers.map((p) => (
              <div key={p.id} className="shrink-0 w-[165px]">
                <MobileProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Section F — New Arrivals (horizontal scroll) */}
        <section className="py-3">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-display text-2xl font-bold text-[#25232B] flex items-center gap-2">
              New Arrivals
              <Flame className="size-4 text-[#EC008C] fill-[#EC008C]" />
            </h2>
            <Link
              to="/shop"
              search={{ category: "All" }}
              className="text-xs font-semibold text-[#EC008C] flex items-center gap-0.5 hover:underline"
            >
              View All <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {newArrivals.map((p) => (
              <div key={`new-${p.id}`} className="shrink-0 w-[165px]">
                <MobileProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Section G — Special Offer Banner */}
        <section className="px-4 py-3">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FCEAF2] via-[#FFF3F8] to-[#FCEAF2] p-5 shadow-soft border border-[#EC008C]/15">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 z-10">
                <span className="text-[10px] font-bold text-[#EC008C] uppercase tracking-wider">
                  Special Offer
                </span>
                <h3 className="font-display text-2xl font-bold text-[#25232B] mt-1 leading-tight">
                  Up to 30% Off
                </h3>
                <p className="text-[11px] text-[#77747C] mt-1">On selected beauty essentials</p>
                <Link
                  to="/shop"
                  search={{ category: "All" }}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#EC008C] px-4 py-2 text-[11px] font-semibold text-white shadow-md hover:bg-[#D4006F] transition-all active:scale-95"
                >
                  Grab Now <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="shrink-0 w-[110px] h-[100px] relative rounded-2xl overflow-hidden shadow-xs border border-white">
                <img
                  src={mobileOfferBanner}
                  alt="Special Offers"
                  loading="lazy"
                  className="size-full object-cover"
                />
                {/* Circular 30% badge */}
                <div className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white/95 text-[9px] font-bold text-[#EC008C] shadow-xs">
                  30%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section H — Beauty Salon Promotion */}
        <section className="px-4 py-4">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#243B90] to-[#172459] text-white shadow-lift">
            <div className="relative h-40 overflow-hidden">
              <img
                src={salon}
                alt="Philipo Beauty Salon"
                loading="lazy"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172459] via-[#172459]/40 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#C6A56B] px-2.5 py-0.5 text-[9px] font-bold text-[#172459] uppercase tracking-wider">
                  <Sparkles className="size-2.5" /> Dar es Salaam
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold leading-tight">
                Professional Hair Styling & Beauty Services
              </h3>
              <p className="mt-1.5 text-[11px] text-white/70 leading-relaxed">
                Knotless braids, silk presses, and bridal packages by our master stylists.
              </p>
              <div className="mt-3 space-y-1.5">
                {salonServices.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-white/90">{s.name}</span>
                    <span className="text-[#C6A56B] font-semibold">{money(s.price)}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/salon"
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#EC008C] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#D4006F] transition-colors active:scale-95"
              >
                <CalendarHeart className="size-3.5" /> Book Appointment
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile Reviews Carousel */}
        <section className="py-4">
          <div className="px-4 mb-3">
            <h2 className="font-display text-xl font-semibold text-[#25232B]">What Clients Say</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {verifiedReviews.map((rev) => (
              <div
                key={rev.name}
                className="shrink-0 w-[280px] rounded-2xl bg-white border border-border p-4 shadow-xs"
              >
                <div className="flex items-center gap-1 text-[#C6A56B]">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="size-3 fill-[#C6A56B] text-[#C6A56B]" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#25232B]/80 italic leading-relaxed line-clamp-3">
                  "{rev.comment}"
                </p>
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-xs font-semibold text-[#25232B]">{rev.name}</p>
                  <p className="text-[10px] text-[#77747C]">{rev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*   DESKTOP HOMEPAGE — visible >= md (preserved)         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* 1. Luminous Hero Section (Full-Width Editorial Background with Auto Crossfade) */}
        <section
          className="relative overflow-hidden min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center border-b border-border/60 bg-[#FAF8F5]"
          aria-label="Philipo Cosmetics Hero Gallery"
        >
          {/* Full-bleed high-resolution background images with seamless crossfade */}
          {heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={index}
                className={`absolute inset-0 size-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className={`size-full object-cover pointer-events-none transition-transform duration-[6000ms] ease-out ${
                    isActive ? "scale-100" : "scale-105"
                  } ${slide.desktopPosition}`}
                />
              </div>
            );
          })}

          {/* Soft luxury editorial gradient veil for text contrast */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-[85%] lg:w-[62%] bg-gradient-to-r from-[#FAF8F5]/98 via-[#FAF8F5]/85 to-transparent pointer-events-none z-[5]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FAF8F5]/90 via-transparent to-transparent sm:hidden pointer-events-none z-[5]" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:py-24 w-full">
            <div className="max-w-xl lg:max-w-2xl rise-in">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C6A56B]/60 bg-white/95 px-4 py-1.5 shadow-xs backdrop-blur-md">
                <Sparkles className="size-4 text-[#8B6E38]" />
                <span className="eyebrow text-[#8B6E38] font-bold tracking-widest text-[11px] uppercase">
                  Luxury Cosmetics & Hair Salon · Tanzania
                </span>
              </div>

              {/* Headline */}
              <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-normal leading-[1.08] text-[#1E3A8A] tracking-tight">
                Discover Your Beauty. <br />
                <span className="italic text-[#E6007A]">Define Your Elegance.</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-lg text-base sm:text-lg text-gray-700 leading-relaxed font-sans">
                Explore premium cosmetics, discover your signature look, and book professional hair
                styling — all in one beautiful experience.
              </p>

              {/* High-Visibility Interactive Actions */}
              <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/shop"
                  search={{ category: "All" }}
                  className="btn-base bg-[#E6007A] text-white hover:bg-[#D4006F] shadow-lg shadow-[#E6007A]/25 px-8 py-3.5 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="size-4.5" />
                </Link>
                <Link
                  to="/salon"
                  className="btn-base bg-[#1E3A8A] text-white hover:bg-[#193275] shadow-lg shadow-[#1E3A8A]/25 px-8 py-3.5 text-base font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Book Hair Appointment</span>
                </Link>
              </div>

              {/* Substantiated Trust Badges */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-gray-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>100% Genuine Provenance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>Nationwide Express Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>Dar es Salaam Salon Suite</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Trust & Convenience Highlights */}
        <div className="border-b border-border bg-card/60 backdrop-blur-md">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {trustHighlights.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5 p-2">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/15">
                  <Icon className="size-5.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Shop by Category (Photographic Cards) */}
        <Section
          eyebrow="Curated Collections"
          title="Explore by Category"
          action={
            <Link
              to="/shop"
              search={{ category: "All" }}
              className="btn-base btn-outline h-10 text-xs font-semibold"
            >
              View All Categories <ArrowRight className="size-3.5 ml-1" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {categories.map((c) => (
              <Link
                key={c.name}
                to="/shop"
                search={{ category: c.name }}
                aria-label={`Explore ${c.title} collection`}
                className="group relative overflow-hidden rounded-3xl bg-secondary aspect-[4/5] shadow-soft hover-lift transition-all duration-500 border border-border/80 flex flex-col justify-end"
              >
                {/* Category Photography */}
                <img
                  src={c.image}
                  alt={`${c.title} Collection`}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-108"
                />

                {/* Accessible Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/60 to-transparent transition-opacity group-hover:opacity-90" />

                {/* Top Category Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 text-[11px] font-semibold text-primary uppercase tracking-wider shadow-sm">
                    {c.name}
                  </span>
                </div>

                {/* Card Content with accessible high contrast */}
                <div className="relative z-10 p-6 text-white flex flex-col justify-end">
                  <h3 className="font-display text-2xl font-medium tracking-tight text-white group-hover:text-gold transition-colors">
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-white/85 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
                    <span className="text-xs text-white/80 font-medium">
                      {c.count > 0
                        ? `${c.count} ${c.count === 1 ? "Product" : "Products"}`
                        : "Signature Releases"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-rose group-hover:translate-x-1 transition-all">
                      Explore <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* 4. Best Sellers Showcase */}
        <Section
          eyebrow="Client Favorites"
          title="Best Selling Cosmetics"
          action={
            <Link
              to="/shop"
              search={{ category: "All" }}
              className="btn-base btn-outline h-10 text-xs font-semibold"
            >
              View Complete Catalog
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>

        {/* 5. New Arrivals Showcase */}
        <Section
          eyebrow="Fresh In Boutique"
          title="New Arrivals & Trending"
          action={
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose">
              <Flame className="size-4 fill-rose" /> 2026 Releases
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={`new-${p.id}`} product={p} />
            ))}
          </div>
        </Section>

        {/* 6. Salon Experience & Hair Artistry */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="card-surface grid overflow-hidden md:grid-cols-2 lg:gap-8 items-center border border-border shadow-lift rounded-3xl">
            <div className="relative h-80 sm:h-96 md:h-full overflow-hidden">
              <img
                src={salon}
                alt="Philipo Beauty Salon Craft"
                loading="lazy"
                width={1408}
                height={912}
                className="size-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-transparent to-transparent md:hidden" />
              <div className="absolute bottom-4 left-4 text-white md:hidden">
                <span className="rounded-full bg-rose px-3 py-1 text-xs font-semibold shadow-md">
                  Salon in {BRAND.city}
                </span>
              </div>
            </div>

            <div className="p-8 sm:p-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-3.5 py-1 text-xs font-semibold text-rose">
                <Sparkles className="size-3.5" /> Dar es Salaam Luxury Suite
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-tight text-primary">
                Master Stylists. <br />
                Precision Braids & Silk Press.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Experience personalized hair artistry in our Dar es Salaam private suites. From
                intricate knotless braids to silk presses and bespoke bridal hair, our master
                stylists tailor every session to your hair's unique health, texture, and elegance.
              </p>

              <div className="mt-6 space-y-3 border-y border-border py-4 text-sm">
                {salonServices.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-gold" /> {s.duration}
                      </span>
                      <span className="font-semibold text-primary">{money(s.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/salon"
                  className="btn-base bg-rose text-white hover:bg-rose/90 shadow-lift px-6 py-3 font-semibold rounded-full"
                >
                  <CalendarHeart className="size-4 mr-1.5" /> Book Hair Appointment
                </Link>
                <span className="text-xs text-muted-foreground">
                  30% deposit to reserve · SMS reminder included
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Special Offers Banner */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-r from-secondary via-background to-secondary p-8 sm:p-12 border border-rose/20 text-center md:text-left md:flex md:items-center md:justify-between shadow-soft">
            <div className="max-w-xl">
              <span className="eyebrow text-rose font-bold">Complimentary Shipping Promotion</span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl text-foreground">
                Nationwide Delivery on Us
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Orders of TSh 150,000 or more qualify for zero-cost delivery across all mainland
                Tanzania regions and Zanzibar. Secure your beauty essentials today.
              </p>
            </div>
            <div className="mt-6 md:mt-0 shrink-0">
              <Link
                to="/shop"
                search={{ category: "All" }}
                className="btn-base bg-primary text-white hover:bg-primary/90 px-8 py-3.5 text-sm font-semibold rounded-full shadow-soft"
              >
                Shop Qualified Products
              </Link>
            </div>
          </div>
        </section>

        {/* 8. Why Shop With Philipo */}
        <Section eyebrow="The Philipo Standard" title="Why Discerning Clients Choose Us">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card-surface p-6 sm:p-8 rounded-3xl border border-border/80">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Award className="size-6 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-xl font-medium">
                Formulated for Coastal Climates
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Every skincare serum and hair blend is curated specifically to balance hydration in
                humid, sunny climates without clogging pores or weighing curls down.
              </p>
            </div>

            <div className="card-surface p-6 sm:p-8 rounded-3xl border border-border/80">
              <div className="grid size-12 place-items-center rounded-2xl bg-rose/10 text-rose border border-rose/20">
                <HeartHandshake className="size-6 text-rose" />
              </div>
              <h3 className="mt-5 font-display text-xl font-medium">
                Salon Tested by Master Artists
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Our hair and makeup products are actively used daily in our professional salon
                suites, guaranteeing real-world performance on diverse textures.
              </p>
            </div>

            <div className="card-surface p-6 sm:p-8 rounded-3xl border border-border/80">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#C6A56B]/15 text-[#8B6E38] border border-[#C6A56B]/30">
                <ShieldCheck className="size-6 text-[#8B6E38]" />
              </div>
              <h3 className="mt-5 font-display text-xl font-medium">100% Genuine & Verified</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                No counterfeit ingredients or expired batches. All products come with lot tracking,
                sealed packaging, and verified provenance.
              </p>
            </div>
          </div>
        </Section>

        {/* 9. Customer Reviews & Verified Experiences */}
        <Section eyebrow="Client Words" title="Loved by Our Community">
          <div className="grid gap-6 md:grid-cols-3">
            {verifiedReviews.map((rev) => (
              <div
                key={rev.name}
                className="card-surface flex flex-col justify-between p-6 sm:p-8 rounded-3xl border border-border/80"
              >
                <div>
                  <div className="flex items-center gap-1 text-gold">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-foreground/90 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">{rev.name}</p>
                  <p className="text-xs text-muted-foreground">{rev.role}</p>
                  <p className="mt-1 text-[11px] text-rose font-medium">
                    Service / Product: {rev.product}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 10. Beauty Tips & Inspiration Editorial */}
        <Section
          eyebrow="Beauty Journal"
          title="Tips & Editorial Inspiration"
          action={
            <Link
              to="/shop"
              search={{ category: "All" }}
              className="btn-base btn-outline h-10 text-xs font-semibold"
            >
              Explore Editorial
            </Link>
          }
        >
          <div className="grid gap-6 md:grid-cols-3">
            {beautyTips.map((tip) => (
              <article
                key={tip.title}
                className="card-surface hover-lift flex flex-col justify-between overflow-hidden p-6 sm:p-8 rounded-3xl border border-border/80"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-rose uppercase tracking-wider">
                      {tip.category}
                    </span>
                    <span>{tip.readTime}</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-medium leading-snug">
                    {tip.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {tip.snippet}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <Link
                    to="/shop"
                    search={{ category: "All" }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-rose transition-colors"
                  >
                    Read Technique <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </Site>
  );
}
