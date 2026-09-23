import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, Star, CalendarHeart } from "lucide-react";
import salonImg from "@/assets/salon.jpg";
import { Site } from "@/components/Site";
import { salonServices, stylists, timeSlots, money, BRAND } from "@/data/shop";

export const Route = createFileRoute("/salon")({
  head: () => ({
    meta: [
      { title: "Book the salon — Philipo Cosmetics & Beauty Salon" },
      {
        name: "description",
        content:
          "Book braiding, silk press, colour or bridal hair with a Philipo stylist in Dar es Salaam. Pay a deposit to hold your chair.",
      },
      { property: "og:title", content: "Book the salon — Philipo Beauty Salon" },
      { property: "og:description", content: "Choose your service, stylist and time in Dar es Salaam." },
    ],
  }),
  component: Salon,
});

const days = [
  { label: "Today", date: "Wed 23" },
  { label: "Thu", date: "24" },
  { label: "Fri", date: "25" },
  { label: "Sat", date: "26" },
  { label: "Sun", date: "27" },
];

function Salon() {
  const [service, setService] = useState(salonServices[0].id);
  const [stylist, setStylist] = useState(stylists[0].id);
  const [day, setDay] = useState(days[0].date);
  const [slot, setSlot] = useState("");
  const [booked, setBooked] = useState(false);

  const chosen = salonServices.find((s) => s.id === service)!;
  const deposit = Math.round(chosen.price * 0.3);

  if (booked) {
    return (
      <Site>
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-primary-foreground rise-in">
            <CalendarHeart className="size-9" />
          </div>
          <h1 className="mt-6 font-display text-4xl">Chair reserved</h1>
          <p className="mt-3 text-muted-foreground">
            {chosen.name} with {stylists.find((s) => s.id === stylist)!.name} on {day} at {slot}. We will send
            an SMS reminder the day before.
          </p>
          <button onClick={() => setBooked(false)} className="btn-base btn-outline mt-8">
            Book another appointment
          </button>
        </div>
      </Site>
    );
  }

  return (
    <Site>
      <section className="relative overflow-hidden">
        <img
          src={salonImg}
          alt="Philipo beauty salon"
          width={1408}
          height={912}
          className="h-72 w-full object-cover md:h-96"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/50 to-transparent" />
        <div className="absolute bottom-0 mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
          <p className="eyebrow text-gold">The salon · {BRAND.city}</p>
          <h1 className="mt-2 font-display text-4xl text-white md:text-5xl">Book your chair</h1>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl">1. Choose a service</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {salonServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setService(s.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    service === s.id ? "border-primary bg-secondary" : "hover:bg-secondary/60"
                  }`}
                >
                  <p className="font-display text-lg">{s.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {s.duration}
                  </p>
                  <p className="mt-2 text-sm text-primary">{money(s.price)}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl">2. Choose a stylist</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {stylists.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStylist(s.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    stylist === s.id ? "border-primary bg-secondary" : "hover:bg-secondary/60"
                  }`}
                >
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.skills}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs">
                    <Star className="size-3.5 fill-gold text-gold" /> {s.rating}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl">3. Pick a time</h2>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {days.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setDay(d.date)}
                  className={`shrink-0 rounded-xl border px-5 py-3 text-center text-sm transition-colors ${
                    day === d.date ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span className="block text-xs opacity-70">{d.label}</span>
                  {d.date}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timeSlots.map((t, i) => {
                const taken = i === 2 || i === 5;
                return (
                  <button
                    key={t}
                    disabled={taken}
                    onClick={() => setSlot(t)}
                    className={`rounded-xl border py-3 text-sm transition-colors disabled:opacity-40 ${
                      slot === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    {taken ? "—" : t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="card-surface h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Your appointment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Service" value={chosen.name} />
            <Row label="Duration" value={chosen.duration} />
            <Row label="Stylist" value={stylists.find((s) => s.id === stylist)!.name} />
            <Row label="When" value={slot ? `${day} · ${slot}` : "Select a time"} />
            <div className="flex justify-between border-t pt-3">
              <dt className="text-muted-foreground">Service price</dt>
              <dd>{money(chosen.price)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Deposit today</dt>
              <dd className="text-primary">{money(deposit)}</dd>
            </div>
          </dl>
          <button
            disabled={!slot}
            onClick={() => setBooked(true)}
            className="btn-base btn-primary mt-5 w-full disabled:opacity-50"
          >
            <Check className="size-4" /> Confirm booking
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Free reschedule up to 12 hours before. Deposit goes towards your service.
          </p>
        </aside>
      </div>
    </Site>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
