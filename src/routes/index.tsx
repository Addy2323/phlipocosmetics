import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, ShieldCheck, Sparkles, Headphones, ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import salon from "@/assets/salon.jpg";
import { Site, Section } from "@/components/Site";
import { ProductCard } from "@/components/ProductCard";
import { products, categories, money } from "@/data/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Philipo Cosmetics & Beauty Salon — Dar es Salaam" },
      {
        name: "description",
        content:
          "Premium cosmetics, skincare and hair care with nationwide delivery in Tanzania, plus salon booking in Dar es Salaam.",
      },
      { property: "og:title", content: "Philipo Cosmetics & Beauty Salon" },
      {
        property: "og:description",
        content: "Shop premium beauty and book the salon — Dar es Salaam, nationwide delivery.",
      },
    ],
  }),
  component: Home,
});

const trust = [
  { icon: Truck, label: "Nationwide delivery" },
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: Sparkles, label: "Salon booking" },
  { icon: Headphones, label: "Support on WhatsApp" },
];

function Home() {
  return (
    <Site>
      <section className="relative overflow-hidden bg-deep">
        <img
          src={hero}
          alt="Philipo Cosmetics campaign"
          width={1600}
          height={1104}
          className="absolute inset-0 size-full object-cover object-right opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/80 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
          <div className="max-w-xl rise-in">
            <p className="eyebrow text-gold">New season · 2026 collection</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-white md:text-6xl">
              Beauty that carries your confidence.
            </h1>
            <p className="mt-5 max-w-md text-deep-foreground/80">
              Curated cosmetics, skincare and hair care, delivered anywhere in Tanzania — and a salon chair
              waiting for you in {"Dar es Salaam"}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-base btn-gold">
                Shop the collection <ArrowRight className="size-4" />
              </Link>
              <Link to="/salon" className="btn-base btn-ghost-light">
                Book the salon
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b bg-secondary/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4">
          {trust.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-secondary-foreground">
              <Icon className="size-4 text-primary" /> {label}
            </div>
          ))}
        </div>
      </div>

      <Section eyebrow="Discover" title="Shop by category">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              to="/shop"
              className={`hover-lift relative overflow-hidden rounded-xl bg-gradient-to-br ${c.tint} p-6 text-white`}
            >
              <p className="font-display text-2xl">{c.name}</p>
              <p className="mt-1 text-xs text-white/70">{c.count} products</p>
              <ArrowRight className="mt-8 size-5" />
            </Link>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Loved by our clients"
        title="Best sellers"
        action={
          <Link to="/shop" className="btn-base btn-outline h-10">
            View all
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="card-surface grid overflow-hidden md:grid-cols-2">
          <img
            src={salon}
            alt="Philipo beauty salon interior"
            loading="lazy"
            width={1408}
            height={912}
            className="h-full w-full object-cover"
          />
          <div className="p-8 md:p-12">
            <p className="eyebrow text-rose">The salon</p>
            <h2 className="mt-3 font-display text-4xl">Braids, silk press, bridal glam.</h2>
            <p className="mt-4 text-muted-foreground">
              Pick your stylist, your service and a time that suits you. Pay a small deposit to hold the
              chair and we will send an SMS reminder the day before.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>Signature braiding — from {money(85000)}</li>
              <li>Silk press & style — from {money(45000)}</li>
              <li>Bridal hair & makeup — from {money(250000)}</li>
            </ul>
            <Link to="/salon" className="btn-base btn-primary mt-8">
              Book an appointment
            </Link>
          </div>
        </div>
      </section>
    </Site>
  );
}
