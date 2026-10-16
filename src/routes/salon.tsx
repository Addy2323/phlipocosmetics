import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  Lock,
  Scissors,
  ArrowRight,
  Printer,
  CalendarHeart,
  User,
  ShieldCheck,
  Smartphone,
  Building2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Star,
  Edit3,
  FileText,
  Download,
  Maximize2,
  Eye,
} from "lucide-react";
import { getInvoiceById } from "@/lib/invoices-store";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { InvoiceModal } from "@/components/admin/InvoiceModal";
import {
  SalonDesignShowcase,
  SalonImageLightboxModal,
  HairstyleDesignItem,
} from "@/components/salon/SalonDesignViewer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Site } from "@/components/Site";
import { useAuth } from "@/lib/auth";
import {
  SALON_CATEGORIES,
  SALON_SERVICES,
  SALON_STYLISTS,
  SALON_TIME_SLOTS,
  SalonCategory,
  SalonService,
  SalonStylist,
  SalonAppointmentRecord,
  getOccupiedSlots,
  calculateEndTime,
  submitSalonBooking,
} from "@/lib/salon-data";

export const Route = createFileRoute("/salon")({
  head: () => ({
    meta: [
      { title: "Book a Hair Salon Appointment — Philipo Cosmetics" },
      {
        name: "description",
        content:
          "Book your hair styling, braids, silk press, treatments, and beauty appointments at Philipo Cosmetics Salon in Dar es Salaam.",
      },
      { property: "og:title", content: "Book a Hair Salon Appointment — Philipo Cosmetics" },
      {
        property: "og:description",
        content: "Four-step luxury salon booking experience with instant mobile confirmation.",
      },
    ],
  }),
  component: SalonBookingPage,
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatMoney(amount: number) {
  return `TZS ${amount.toLocaleString()}`;
}

function SalonBookingPage() {
  const { user } = useAuth();

  // Wizard Step: 1 = Category, 2 = Session Type, 3 = Date & Time, 4 = Review & Pay
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Category selection
  const [selectedCategory, setSelectedCategory] = useState<SalonCategory>(SALON_CATEGORIES[0]!);

  // Step 2: Service selection & Stylist
  const [selectedService, setSelectedService] = useState<SalonService | null>(
    SALON_SERVICES.find((s) => s.categoryId === SALON_CATEGORIES[0]!.id) || SALON_SERVICES[0]!,
  );
  const [selectedStylist, setSelectedStylist] = useState<SalonStylist>(SALON_STYLISTS[0]!);

  // Current real date baseline in Dar es Salaam / local time
  const today = useMemo(() => new Date(), []);
  const todayMidnight = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today]);

  // Step 3: Calendar Date & Time Slot
  // Default to October 2026 to match reference screenshots
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-16");
  const [selectedSlot, setSelectedSlot] = useState<string>("14:00");
  const [bookingNotes, setBookingNotes] = useState<string>("");

  // Step 4: Customer Details & Payment
  const [fullName, setFullName] = useState<string>(user?.fullName || "Amina Juma");
  const [phoneNumber, setPhoneNumber] = useState<string>(
    user?.phone?.replace("+255", "").trim() || "712 345 678",
  );
  const [email, setEmail] = useState<string>(user?.email || "amina@email.com");
  const [paymentMethod, setPaymentMethod] = useState<string>("momo");

  // Lifecycle & confirmation states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmedBooking, setConfirmedBooking] = useState<SalonAppointmentRecord | null>(null);
  const [salonInvoiceModalOpen, setSalonInvoiceModalOpen] = useState(false);

  // Full image viewer & clear design lookbook states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxDesign, setLightboxDesign] = useState<HairstyleDesignItem | null>(null);

  const categoryDesigns: HairstyleDesignItem[] = useMemo(() => {
    return SALON_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      categoryName: cat.name,
      categoryId: cat.id,
      image: cat.image,
      price: cat.startingPrice,
      duration: "Approx. 1 – 3 hours",
      description: cat.description,
      features: [
        "Precision Parting & Styling",
        "Nourishing Scalp Steam & Wash",
        "Tension-Free All-Day Comfort",
        "Philipo Salon Signature Finish",
      ],
    }));
  }, []);

  const serviceDesigns: HairstyleDesignItem[] = useMemo(() => {
    return SALON_SERVICES.map((s) => {
      const parentCat = SALON_CATEGORIES.find((c) => c.id === s.categoryId);
      return {
        id: s.id,
        name: s.name,
        categoryName: parentCat?.name || "Hair Styling",
        categoryId: s.categoryId,
        image: s.image,
        price: s.price,
        duration: s.duration,
        description: s.description,
        features: [
          "Custom Hairstyle Architecture",
          "Scalp Detox & Steam",
          "Premium Heat/Lace Care",
          "Long-Lasting Salon Hold",
        ],
      };
    });
  }, []);

  const activeCategoryDesign = useMemo(() => {
    return (
      categoryDesigns.find((d) => d.id === selectedCategory.id) ||
      categoryDesigns[0]!
    );
  }, [categoryDesigns, selectedCategory.id]);

  const activeServiceDesign = useMemo(() => {
    if (!selectedService) return null;
    return serviceDesigns.find((d) => d.id === selectedService.id) || null;
  }, [serviceDesigns, selectedService]);

  const handleOpenLightbox = (design: HairstyleDesignItem) => {
    setLightboxDesign(design);
    setLightboxOpen(true);
  };

  const confirmedInvoice = useMemo(() => {
    if (!confirmedBooking) return null;
    return getInvoiceById(confirmedBooking.id) || null;
  }, [confirmedBooking]);

  // Auto-sync user if authenticated
  useEffect(() => {
    if (user?.fullName && fullName === "Amina Juma") {
      setFullName(user.fullName);
    }
    if (user?.phone && phoneNumber === "712 345 678") {
      setPhoneNumber(user.phone.replace("+255", "").trim());
    }
    if (user?.email && email === "amina@email.com") {
      setEmail(user.email);
    }
  }, [user]);

  // Available services filtered by selected category
  const availableServices = SALON_SERVICES.filter(
    (s) => s.categoryId === selectedCategory.id && s.isActive,
  );

  // Occupied slots for selected date & stylist
  const occupiedSlots = useMemo(
    () => getOccupiedSlots(selectedDate, selectedStylist.id),
    [selectedDate, selectedStylist.id],
  );

  // Real-time slot validity check for today
  function isSlotPastForToday(slot: string, dateStr: string): boolean {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;
    if (dateStr !== todayStr) return false;

    const [slotH, slotM] = slot.split(":").map((x) => parseInt(x, 10));
    const nowH = today.getHours();
    const nowM = today.getMinutes();
    return (slotH || 0) < nowH || ((slotH || 0) === nowH && (slotM || 0) <= nowM);
  }

  // Check if slot is disabled (either booked or past)
  function isSlotDisabled(slot: string): boolean {
    return occupiedSlots.includes(slot) || isSlotPastForToday(slot, selectedDate);
  }

  // Switch category
  function handleSelectCategory(cat: SalonCategory) {
    setSelectedCategory(cat);
    const firstMatching = SALON_SERVICES.find((s) => s.categoryId === cat.id && s.isActive);
    setSelectedService(firstMatching || null);
    setErrorMessage("");
  }

  // Check if previous month navigation should be permitted
  const isPastMonthNavigationDisabled = useMemo(() => {
    return (
      calYear < today.getFullYear() ||
      (calYear === today.getFullYear() && calMonth <= today.getMonth())
    );
  }, [calYear, calMonth, today]);

  function prevMonth() {
    if (isPastMonthNavigationDisabled) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  // Interactive calendar calculations with strict date validation
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells = [];

    // Trailing previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: "",
        isPast: true,
        isClosed: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(calYear, calMonth, d);
      cellDate.setHours(0, 0, 0, 0);

      const mm = String(calMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${calYear}-${mm}-${dd}`;

      // Strictly validate past dates
      const isPast = cellDate < todayMidnight;
      // Sunday check (0 = Sunday)
      const isSunday = cellDate.getDay() === 0;

      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        isPast,
        isClosed: isSunday, // Salon closed on Sundays
      });
    }

    // Leading next month days
    const remainingCells = 35 - cells.length;
    if (remainingCells > 0) {
      for (let d = 1; d <= remainingCells; d++) {
        cells.push({
          day: d,
          isCurrentMonth: false,
          dateStr: "",
          isPast: false,
          isClosed: false,
        });
      }
    }

    return cells;
  }, [calYear, calMonth, firstDayOfWeek, daysInMonth, prevMonthDays, todayMidnight]);

  // Selecting a date with validation
  function handleSelectDate(dateStr: string, isPast: boolean, isClosed: boolean) {
    if (isPast) {
      setErrorMessage("Past dates cannot be selected. Please choose an upcoming salon date.");
      return;
    }
    if (isClosed) {
      setErrorMessage(
        "Philipo Salon is closed on Sundays for deep sanitization. Please choose Monday through Saturday.",
      );
      return;
    }

    setSelectedDate(dateStr);
    setErrorMessage("");

    // If currently selected slot is taken on this new date, auto-select first available slot
    const slotsForNewDate = getOccupiedSlots(dateStr, selectedStylist.id);
    if (slotsForNewDate.includes(selectedSlot) || isSlotPastForToday(selectedSlot, dateStr)) {
      const free = SALON_TIME_SLOTS.find(
        (s) => !slotsForNewDate.includes(s) && !isSlotPastForToday(s, dateStr),
      );
      if (free) {
        setSelectedSlot(free);
      } else {
        setSelectedSlot("");
        setErrorMessage("All chairs are fully booked on this date. Please choose another date.");
      }
    }
  }

  // Validate Step 3 before proceeding to Step 4
  function handleProceedToReview() {
    setErrorMessage("");

    if (!selectedDate) {
      setErrorMessage("Please select an appointment date from the calendar.");
      return;
    }

    // Verify date is not in past
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    if (selectedDateObj < todayMidnight) {
      setErrorMessage(
        "The selected appointment date is in the past. Please select a valid upcoming date.",
      );
      return;
    }

    if (!selectedSlot) {
      setErrorMessage("Please select an available appointment time slot to continue.");
      return;
    }

    if (isSlotDisabled(selectedSlot)) {
      setErrorMessage(
        `The ${selectedSlot} time slot is currently unavailable. Please pick an active slot.`,
      );
      return;
    }

    setCurrentStep(4);
  }

  // Friendly date display string
  function getFormattedDateDisplay(dateStr: string) {
    try {
      const parts = dateStr.split("-");
      const y = parseInt(parts[0] || "2026", 10);
      const m = parseInt(parts[1] || "10", 10) - 1;
      const d = parseInt(parts[2] || "16", 10);
      const dateObj = new Date(y, m, d);
      const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
      return `${weekday}, ${d} ${monthName} ${y}`;
    } catch {
      return dateStr;
    }
  }

  // Final booking submission
  async function handleConfirmPayment() {
    if (!selectedService) {
      setErrorMessage("Please select a service.");
      setCurrentStep(2);
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Please provide your full name.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage("Please enter a valid Tanzanian mobile phone number.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const fullPhone = phoneNumber.startsWith("+255")
        ? phoneNumber
        : `+255 ${phoneNumber.replace(/^0/, "").trim()}`;

      const booking = await submitSalonBooking({
        category: selectedCategory,
        service: selectedService,
        stylist: selectedStylist,
        dateStr: selectedDate,
        timeSlot: selectedSlot,
        notes: bookingNotes,
        customerName: fullName,
        customerPhone: fullPhone,
        customerEmail: email,
        paymentMethod,
      });

      setConfirmedBooking(booking);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to finalize appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBookAnother() {
    setConfirmedBooking(null);
    setCurrentStep(1);
    setSelectedSlot("14:00");
  }

  function handleProceedFromSidebar() {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedService) {
        setErrorMessage("Please select a specific service to continue.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleProceedToReview();
    } else if (currentStep === 4) {
      handleConfirmPayment();
    }
  }

  return (
    <Site>
      <main className="min-h-screen bg-[#FFFCFA] text-[#25232B] pb-24 pt-4 sm:pt-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Top Wizard Steps Header with Philipo Pink theme */}
          <nav
            aria-label="Salon Booking Progress"
            className="mb-8 flex items-center justify-between border-b border-[#EAE6DF] pb-5"
          >
            <div className="flex w-full items-center justify-between py-1">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => currentStep > 1 && setCurrentStep(1)}
                disabled={currentStep <= 1}
                className={`flex items-center gap-1 sm:gap-2 shrink-0 ${
                  currentStep > 1 ? "cursor-pointer hover:opacity-80" : "cursor-default"
                }`}
              >
                <span
                  className={`grid size-6 sm:size-7 place-items-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                    currentStep > 1
                      ? "bg-[#EC008C] text-white"
                      : currentStep === 1
                        ? "bg-[#EC008C] text-white ring-2 sm:ring-4 ring-[#EC008C]/20 shadow-xs"
                        : "bg-[#EAE6DF] text-muted-foreground"
                  }`}
                >
                  {currentStep > 1 ? <Check className="size-3.5 sm:size-4 stroke-[3]" /> : "1"}
                </span>
                <span
                  className={`text-[10px] xs:text-[11px] sm:text-sm font-semibold whitespace-nowrap ${
                    currentStep >= 1 ? "text-[#EC008C]" : "text-muted-foreground"
                  }`}
                >
                  Category
                </span>
              </button>

              <div
                className={`h-0.5 flex-1 min-w-[6px] sm:min-w-[16px] mx-1 sm:mx-2.5 transition-colors ${
                  currentStep > 1 ? "bg-[#EC008C]" : "bg-[#EAE6DF]"
                }`}
              />

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                disabled={currentStep <= 2}
                className={`flex items-center gap-1 sm:gap-2 shrink-0 ${
                  currentStep > 2 ? "cursor-pointer hover:opacity-80" : "cursor-default"
                }`}
              >
                <span
                  className={`grid size-6 sm:size-7 place-items-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                    currentStep > 2
                      ? "bg-[#EC008C] text-white"
                      : currentStep === 2
                        ? "bg-[#EC008C] text-white ring-2 sm:ring-4 ring-[#EC008C]/20 shadow-xs"
                        : "bg-[#EAE6DF] text-muted-foreground"
                  }`}
                >
                  {currentStep > 2 ? <Check className="size-3.5 sm:size-4 stroke-[3]" /> : "2"}
                </span>
                <span
                  className={`text-[10px] xs:text-[11px] sm:text-sm font-semibold whitespace-nowrap ${
                    currentStep >= 2 ? "text-[#EC008C]" : "text-muted-foreground"
                  }`}
                >
                  <span className="sm:hidden">Session</span>
                  <span className="hidden sm:inline">Session Type</span>
                </span>
              </button>

              <div
                className={`h-0.5 flex-1 min-w-[6px] sm:min-w-[16px] mx-1 sm:mx-2.5 transition-colors ${
                  currentStep > 2 ? "bg-[#EC008C]" : "bg-[#EAE6DF]"
                }`}
              />

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => currentStep > 3 && setCurrentStep(3)}
                disabled={currentStep <= 3}
                className={`flex items-center gap-1 sm:gap-2 shrink-0 ${
                  currentStep > 3 ? "cursor-pointer hover:opacity-80" : "cursor-default"
                }`}
              >
                <span
                  className={`grid size-6 sm:size-7 place-items-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                    currentStep > 3
                      ? "bg-[#EC008C] text-white"
                      : currentStep === 3
                        ? "bg-[#EC008C] text-white ring-2 sm:ring-4 ring-[#EC008C]/20 shadow-xs"
                        : "bg-[#EAE6DF] text-muted-foreground"
                  }`}
                >
                  {currentStep > 3 ? <Check className="size-3.5 sm:size-4 stroke-[3]" /> : "3"}
                </span>
                <span
                  className={`text-[10px] xs:text-[11px] sm:text-sm font-semibold whitespace-nowrap ${
                    currentStep >= 3 ? "text-[#EC008C]" : "text-muted-foreground"
                  }`}
                >
                  <span className="sm:hidden">Time</span>
                  <span className="hidden sm:inline">Date & Time</span>
                </span>
              </button>

              <div
                className={`h-0.5 flex-1 min-w-[6px] sm:min-w-[16px] mx-1 sm:mx-2.5 transition-colors ${
                  currentStep > 3 ? "bg-[#EC008C]" : "bg-[#EAE6DF]"
                }`}
              />

              {/* Step 4 */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <span
                  className={`grid size-6 sm:size-7 place-items-center rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                    currentStep === 4
                      ? "bg-[#EC008C] text-white ring-2 sm:ring-4 ring-[#EC008C]/20 shadow-xs"
                      : "bg-[#EAE6DF] text-muted-foreground"
                  }`}
                >
                  4
                </span>
                <span
                  className={`text-[10px] xs:text-[11px] sm:text-sm font-semibold whitespace-nowrap ${
                    currentStep === 4 ? "text-[#EC008C]" : "text-muted-foreground"
                  }`}
                >
                  <span className="sm:hidden">Review</span>
                  <span className="hidden sm:inline">Review & Pay</span>
                </span>
              </div>
            </div>

            {/* Profile icon on desktop */}
            <Link
              to="/account"
              aria-label="Customer Profile"
              className="hidden sm:grid ml-4 size-9 place-items-center rounded-full border border-[#EAE6DF] text-[#0F372E] hover:bg-[#FCEAF2] hover:text-[#EC008C] transition-colors shrink-0"
            >
              <User className="size-4" />
            </Link>
          </nav>

          {/* ========================================================= */}
          {/* CONFIRMATION SCREEN (Shown when booking is confirmed)     */}
          {/* ========================================================= */}
          {confirmedBooking ? (
            <div className="mx-auto max-w-2xl px-4 py-8 text-center animate-in fade-in-50 duration-300">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#EC008C] text-white shadow-xl ring-8 ring-[#EC008C]/15">
                <Check className="size-10 stroke-[3]" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#EC008C]">
                Booking Confirmed #{confirmedBooking.id}
              </p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#0F372E]">
                Your Chair is Reserved!
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
                Thank you, <strong>{confirmedBooking.customerName}</strong>. Your salon appointment
                for <strong>{confirmedBooking.serviceName}</strong> with{" "}
                <strong>{confirmedBooking.stylistName}</strong> has been secured.
              </p>

              {/* Appointment Card Receipt */}
              <div className="mt-8 rounded-2xl border border-[#EAE6DF] bg-white p-6 text-left shadow-sm">
                <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
                  <div>
                    <span className="text-xs font-semibold text-[#EC008C] uppercase tracking-wider">
                      {confirmedBooking.categoryName}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#0F372E]">
                      {confirmedBooking.serviceName}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#FCEAF2] text-[#EC008C] px-3.5 py-1 text-xs font-bold border border-[#EC008C]/20">
                    Paid {formatMoney(confirmedBooking.amountPaid)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-xs sm:text-sm text-[#25232B] sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <CalendarIcon className="size-4 text-[#EC008C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground text-xs">Date & Time</p>
                      <p className="font-medium">
                        {getFormattedDateDisplay(confirmedBooking.appointmentDate)} ·{" "}
                        {confirmedBooking.timeSlot} – {confirmedBooking.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <User className="size-4 text-[#EC008C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground text-xs">
                        Assigned Stylist
                      </p>
                      <p className="font-medium">{confirmedBooking.stylistName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="size-4 text-[#EC008C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground text-xs">
                        Estimated Duration
                      </p>
                      <p className="font-medium">{confirmedBooking.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="size-4 text-[#EC008C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-muted-foreground text-xs">Salon Location</p>
                      <p className="font-medium">Philipo Cosmetics Salon, Dar es Salaam</p>
                    </div>
                  </div>
                </div>

                {confirmedBooking.notes && (
                  <div className="mt-4 rounded-xl bg-[#FFFCFA] p-3 border border-[#EAE6DF] text-xs text-muted-foreground">
                    <strong className="text-[#0F372E]">Client styling notes:</strong>{" "}
                    {confirmedBooking.notes}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Payment Ref:{" "}
                    <strong className="text-foreground">{confirmedBooking.paymentReference}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <ShieldCheck className="size-4 text-emerald-600" /> Baraka SMS Dispatched to{" "}
                    {confirmedBooking.customerPhone}
                  </span>
                </div>
              </div>

              {/* Tax Invoice Official Card */}
              {confirmedInvoice && (
                <div className="mt-6 p-4 rounded-2xl bg-[#F7F3EA] border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A45C]">
                      Official Tax Invoice
                    </span>
                    <p className="font-serif font-bold text-sm text-[#0F3326]">
                      Tax Invoice #{confirmedInvoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Amount Paid: TZS {confirmedInvoice.total.toLocaleString()} · Verified
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSalonInvoiceModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E8E2D8] text-[#174A35] hover:bg-slate-50 shadow-xs transition"
                    >
                      <FileText className="size-3.5" />
                      <span>View Tax Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadInvoicePDF(confirmedInvoice)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#174A35] text-white hover:bg-[#0F3326] shadow-sm transition"
                    >
                      <Download className="size-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#EAE6DF] bg-white px-5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Printer className="size-4" /> Print Receipt
                </button>
                <Link
                  to="/account"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#EC008C] text-white px-6 py-2.5 text-xs font-semibold hover:bg-[#d0007b] transition-colors shadow-md shadow-[#EC008C]/25"
                >
                  <CalendarHeart className="size-4" /> My Appointments
                </Link>
                <button
                  onClick={handleBookAnother}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#EAE6DF] bg-white px-5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="size-4" /> Book Another Service
                </button>
              </div>

              {/* Tax Invoice Modal */}
              <InvoiceModal
                invoice={confirmedInvoice}
                isOpen={salonInvoiceModalOpen}
                onClose={() => setSalonInvoiceModalOpen(false)}
              />
            </div>
          ) : (
            <>
              {/* Pink Alert Banner for Validation Errors */}
              {errorMessage && (
                <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-[#EC008C]/30 bg-[#FCEAF2] p-4 text-xs font-semibold text-[#EC008C] animate-in slide-in-from-top-2">
                  <AlertCircle className="size-4.5 shrink-0 text-[#EC008C]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 2-Column Layout: Steps in 8 Cols, Persistent Sidebar in 4 Cols */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                  {/* ========================================================= */}
                  {/* STEP 1: CATEGORY (SCREENSHOT 1)                           */}
                  {/* ========================================================= */}
                  {currentStep === 1 && (
                    <section
                      aria-labelledby="step1-title"
                      className="animate-in fade-in-50 duration-200"
                    >
                      <header className="mb-6">
                        <h1
                          id="step1-title"
                          className="font-serif text-2xl sm:text-3xl font-bold text-[#0F372E]"
                        >
                          Book a Hair Salon Appointment
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                          Choose a service category to get started.
                        </p>
                      </header>

                      <h2 className="mb-4 text-sm font-bold text-[#0F372E] tracking-tight">
                        Service Categories
                      </h2>

                      {/* 7 Category Cards Grid (Screenshot 1) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {SALON_CATEGORIES.map((cat) => {
                          const isSelected = selectedCategory.id === cat.id;
                          return (
                            <div
                              key={cat.id}
                              onClick={() => handleSelectCategory(cat)}
                              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 bg-white flex flex-col justify-between ${
                                isSelected
                                  ? "border-2 border-[#EC008C] shadow-md ring-1 ring-[#EC008C]/30"
                                  : "border border-[#EAE6DF] hover:border-[#EC008C]/40 hover:shadow-sm"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between">
                                  <div className="relative group/thumb size-16 rounded-xl overflow-hidden shadow-xs border border-black/5 shrink-0">
                                    <img
                                      src={cat.image}
                                      alt={cat.name}
                                      className="size-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const d = categoryDesigns.find((item) => item.id === cat.id);
                                        if (d) handleOpenLightbox(d);
                                      }}
                                      title="View clear full image"
                                      className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity text-white"
                                      aria-label={`View clear full image of ${cat.name}`}
                                    >
                                      <Maximize2 className="size-4 drop-shadow-sm" />
                                    </button>
                                  </div>
                                  {/* Selection badge */}
                                  <div
                                    className={`grid size-6 place-items-center rounded-full transition-colors ${
                                      isSelected
                                        ? "bg-[#EC008C] text-white shadow-xs"
                                        : "border-2 border-[#DCD7D0]"
                                    }`}
                                  >
                                    {isSelected && <Check className="size-3.5 stroke-[3]" />}
                                  </div>
                                </div>

                                <h3 className="mt-3.5 font-bold text-sm sm:text-base text-[#0F372E]">
                                  {cat.name}
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  {cat.description}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-[#F0ECE6]">
                                <span
                                  className={`text-xs font-semibold ${
                                    isSelected ? "text-[#EC008C]" : "text-[#25232B]"
                                  }`}
                                >
                                  From {cat.startingPrice.toLocaleString()} TZS
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dedicated Section for viewing clear images and full design showcase */}
                      <SalonDesignShowcase
                        title={`${selectedCategory.name} — Clear Design & Lookbook`}
                        subtitle="Inspect hairstyle artistry, parting clarity, and volume in high definition."
                        activeDesign={activeCategoryDesign}
                        allDesigns={categoryDesigns}
                        onOpenLightbox={handleOpenLightbox}
                        onSelectDesign={(design) => {
                          const cat = SALON_CATEGORIES.find((c) => c.id === design.id);
                          if (cat) handleSelectCategory(cat);
                        }}
                        badgeLabel="Clear Design Lookbook"
                      />

                      {/* Bottom Navigation */}
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#EC008C] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-[#EC008C]/25 hover:bg-[#d0007b] active:scale-[0.99] transition-all"
                        >
                          Next Step <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* ========================================================= */}
                  {/* STEP 2: SESSION TYPE (SCREENSHOT 2)                       */}
                  {/* ========================================================= */}
                  {currentStep === 2 && (
                    <section
                      aria-labelledby="step2-title"
                      className="animate-in fade-in-50 duration-200"
                    >
                      <div className="mb-4">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#EC008C] transition-colors"
                        >
                          <ChevronLeft className="size-4" /> Back
                        </button>
                      </div>

                      <header className="mb-6">
                        <h1
                          id="step2-title"
                          className="font-serif text-2xl sm:text-3xl font-bold text-[#0F372E]"
                        >
                          Select Session Type
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                          Choose the specific service you want to book.
                        </p>
                      </header>

                      <div className="space-y-6">
                        {/* Selected Category Header Card */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EAE6DF] bg-white p-4 sm:p-5 shadow-xs">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={selectedCategory.image}
                              alt={selectedCategory.name}
                              className="size-14 rounded-xl object-cover border border-black/5"
                            />
                            <div>
                              <h3 className="font-bold text-base text-[#0F372E]">
                                {selectedCategory.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {selectedCategory.description}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setCurrentStep(1)}
                            className="rounded-lg border border-[#EAE6DF] bg-[#FFFCFA] px-3.5 py-1.5 text-xs font-semibold text-[#EC008C] hover:bg-[#FCEAF2] transition-colors"
                          >
                            Change Category
                          </button>
                        </div>

                        {/* Available Services List */}
                        <div>
                          <h2 className="mb-3 text-sm font-bold text-[#0F372E] tracking-tight">
                            Available Services ({availableServices.length})
                          </h2>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {availableServices.map((service) => {
                              const isChosen = selectedService?.id === service.id;
                              return (
                                <div
                                  key={service.id}
                                  onClick={() => setSelectedService(service)}
                                  className={`relative cursor-pointer rounded-2xl bg-white p-4 transition-all duration-200 flex flex-col justify-between ${
                                    isChosen
                                      ? "border-2 border-[#EC008C] shadow-md ring-1 ring-[#EC008C]/20"
                                      : "border border-[#EAE6DF] hover:border-[#EC008C]/40 hover:shadow-xs"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="relative group/thumb size-16 rounded-xl overflow-hidden border border-black/5 shrink-0">
                                        <img
                                          src={service.image}
                                          alt={service.name}
                                          className="size-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const d = serviceDesigns.find((item) => item.id === service.id);
                                            if (d) handleOpenLightbox(d);
                                          }}
                                          title="View clear full image"
                                          className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity text-white"
                                          aria-label={`View clear full image of ${service.name}`}
                                        >
                                          <Maximize2 className="size-4 drop-shadow-sm" />
                                        </button>
                                      </div>
                                      <div
                                        className={`grid size-6 place-items-center rounded-full transition-colors ${
                                          isChosen
                                            ? "bg-[#EC008C] text-white shadow-xs"
                                            : "border-2 border-[#DCD7D0]"
                                        }`}
                                      >
                                        {isChosen && <Check className="size-3.5 stroke-[3]" />}
                                      </div>
                                    </div>

                                    <h4 className="mt-3 font-bold text-sm text-[#0F372E]">
                                      {service.name}
                                    </h4>
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                      {service.description}
                                    </p>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-[#F0ECE6] flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                      <Clock className="size-3.5 text-muted-foreground" />{" "}
                                      {service.duration}
                                    </span>
                                    <span className="font-bold text-sm text-[#EC008C]">
                                      TZS {service.price.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {availableServices.length === 0 && (
                              <div className="sm:col-span-2 rounded-2xl border border-dashed border-[#EAE6DF] p-8 text-center text-xs text-muted-foreground">
                                No services found in this category.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dedicated Section for viewing clear images of chosen service design */}
                        {activeServiceDesign && (
                          <SalonDesignShowcase
                            title={`${selectedService?.name || selectedCategory.name} — Clear Design & Specifications`}
                            subtitle="Inspect the hairstyle architecture, parting, and volume in full clarity."
                            activeDesign={activeServiceDesign}
                            allDesigns={serviceDesigns.filter((d) => d.categoryId === selectedCategory.id)}
                            onOpenLightbox={handleOpenLightbox}
                            onSelectDesign={(design) => {
                              const srv = SALON_SERVICES.find((s) => s.id === design.id);
                              if (srv) setSelectedService(srv);
                            }}
                            badgeLabel="Hairstyle Specification"
                          />
                        )}

                        {/* Preferred Stylist Selector */}
                        <div className="rounded-2xl border border-[#EAE6DF] bg-white p-4 sm:p-5 shadow-xs">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm text-[#0F372E]">
                              Choose Preferred Stylist
                            </h3>
                            <span className="text-[11px] text-muted-foreground">Optional</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {SALON_STYLISTS.map((st) => (
                              <div
                                key={st.id}
                                onClick={() => setSelectedStylist(st)}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                  selectedStylist.id === st.id
                                    ? "border-2 border-[#EC008C] bg-[#FCEAF2]/50 font-semibold text-[#0F372E]"
                                    : "border border-[#EAE6DF] hover:border-[#EC008C]/30 text-muted-foreground bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="size-8">
                                    <AvatarFallback className="bg-[#FCEAF2] text-[#EC008C] text-[10px] font-bold">
                                      {st.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-xs text-[#0F372E]">{st.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[85px]">
                                      {st.specialty}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[#EC008C] font-bold text-[11px]">
                                  ★ {st.rating}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Navigation */}
                      <div className="mt-8 flex items-center justify-between border-t border-[#EAE6DF] pt-5">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE6DF] px-5 py-2.5 text-xs font-semibold text-[#0F372E] hover:bg-slate-50 transition-colors"
                        >
                          <ChevronLeft className="size-4" /> Back
                        </button>

                        <button
                          disabled={!selectedService}
                          onClick={() => setCurrentStep(3)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#EC008C] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-[#EC008C]/25 hover:bg-[#d0007b] disabled:opacity-50 active:scale-[0.99] transition-all"
                        >
                          Next Step <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* ========================================================= */}
                  {/* STEP 3: DATE & TIME (SCREENSHOT 3 — PINK VALIDATION)      */}
                  {/* ========================================================= */}
                  {currentStep === 3 && (
                    <section
                      aria-labelledby="step3-title"
                      className="animate-in fade-in-50 duration-200"
                    >
                      <div className="mb-4">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#EC008C] transition-colors"
                        >
                          <ChevronLeft className="size-4" /> Back
                        </button>
                      </div>

                      <header className="mb-6">
                        <h1
                          id="step3-title"
                          className="font-serif text-2xl sm:text-3xl font-bold text-[#0F372E]"
                        >
                          Select Date & Time
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                          Choose your preferred date and available time slot.
                        </p>
                      </header>

                      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                        {/* Left Panel: Calendar & Salon Location */}
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-[#EAE6DF] bg-white p-5 shadow-xs">
                            {/* Month navigation header */}
                            <div className="flex items-center justify-between mb-4">
                              <button
                                disabled={isPastMonthNavigationDisabled}
                                onClick={prevMonth}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isPastMonthNavigationDisabled
                                    ? "text-slate-300 cursor-not-allowed opacity-50"
                                    : "text-muted-foreground hover:bg-[#FCEAF2] hover:text-[#EC008C]"
                                }`}
                                aria-label="Previous month"
                              >
                                <ChevronLeft className="size-5" />
                              </button>
                              <h3 className="font-bold text-sm sm:text-base text-[#0F372E]">
                                {MONTH_NAMES[calMonth]} {calYear}
                              </h3>
                              <button
                                onClick={nextMonth}
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#FCEAF2] hover:text-[#EC008C] transition-colors"
                                aria-label="Next month"
                              >
                                <ChevronRight className="size-5" />
                              </button>
                            </div>

                            {/* Weekday labels */}
                            <div className="grid grid-cols-7 text-center mb-2">
                              {WEEKDAY_NAMES.map((wd, i) => (
                                <span
                                  key={wd}
                                  className={`text-xs font-semibold py-1 ${
                                    i === 0 ? "text-rose-400" : "text-muted-foreground"
                                  }`}
                                >
                                  {wd}
                                </span>
                              ))}
                            </div>

                            {/* Calendar Day Grid with Strict Validation & Philipo Pink Active Style */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {calendarCells.map((cell, idx) => {
                                const isSelected = cell.dateStr === selectedDate;
                                const isDisabled =
                                  !cell.isCurrentMonth || cell.isPast || cell.isClosed;

                                return (
                                  <button
                                    key={idx}
                                    disabled={isDisabled}
                                    title={
                                      cell.isClosed
                                        ? "Salon Closed on Sundays"
                                        : cell.isPast
                                          ? "Past date cannot be booked"
                                          : ""
                                    }
                                    onClick={() => {
                                      if (cell.dateStr) {
                                        handleSelectDate(cell.dateStr, cell.isPast, cell.isClosed);
                                      }
                                    }}
                                    className={`h-9 w-full rounded-full text-xs font-medium transition-all flex items-center justify-center relative ${
                                      !cell.isCurrentMonth
                                        ? "text-slate-200 cursor-not-allowed"
                                        : cell.isPast
                                          ? "text-slate-300 line-through cursor-not-allowed opacity-50 bg-slate-50/50"
                                          : cell.isClosed
                                            ? "text-rose-300 cursor-not-allowed opacity-60 bg-rose-50/30"
                                            : isSelected
                                              ? "bg-[#EC008C] text-white font-bold shadow-md shadow-[#EC008C]/30 scale-105 ring-2 ring-[#EC008C]/20"
                                              : "text-[#25232B] hover:bg-[#FCEAF2] hover:text-[#EC008C]"
                                    }`}
                                  >
                                    {cell.day}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Calendar validation legend */}
                            <div className="mt-4 pt-3 border-t border-[#F0ECE6] flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
                              <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-[#EC008C]" /> Selected
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-slate-300" /> Past
                                (Disabled)
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-rose-300" /> Sunday (Closed)
                              </span>
                            </div>
                          </div>

                          {/* Salon Location Card below calendar */}
                          <div className="flex items-center gap-3.5 rounded-2xl border border-[#EAE6DF] bg-white p-4 shadow-xs">
                            <div className="grid size-10 place-items-center rounded-full bg-[#FCEAF2] text-[#EC008C] shrink-0">
                              <MapPin className="size-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-[#0F372E]">
                                Philipo Cosmetics Salon
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Dar es Salaam, Tanzania · Open Mon–Sat 08:00–19:00
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Panel: Time Slots Grid & Notes */}
                        <div className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-sm text-[#0F372E]">Select Time</h3>
                              <span className="text-[11px] text-[#EC008C] font-semibold">
                                {getFormattedDateDisplay(selectedDate)}
                              </span>
                            </div>

                            {/* Time slots grid with Pink selection and validation */}
                            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
                              {SALON_TIME_SLOTS.map((slot) => {
                                const isOccupied = occupiedSlots.includes(slot);
                                const isPast = isSlotPastForToday(slot, selectedDate);
                                const isDisabled = isOccupied || isPast;
                                const isSelected = selectedSlot === slot && !isDisabled;

                                return (
                                  <button
                                    key={slot}
                                    disabled={isDisabled}
                                    title={
                                      isOccupied
                                        ? "Slot already booked by another customer"
                                        : isPast
                                          ? "Time slot has passed for today"
                                          : ""
                                    }
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      setErrorMessage("");
                                    }}
                                    className={`rounded-xl py-3 text-xs font-semibold transition-all ${
                                      isDisabled
                                        ? "bg-[#F5F4F0] text-[#A09E9B] cursor-not-allowed border border-transparent line-through opacity-70"
                                        : isSelected
                                          ? "bg-[#FCEAF2] border-2 border-[#EC008C] text-[#EC008C] font-bold shadow-xs scale-[1.02]"
                                          : "border border-[#EAE6DF] bg-white text-[#0F372E] hover:border-[#EC008C] hover:text-[#EC008C]"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Additional Notes Textarea */}
                            <div className="mt-6">
                              <label
                                htmlFor="booking-notes"
                                className="block text-xs font-semibold text-[#0F372E] mb-1.5"
                              >
                                Additional Notes (Optional)
                              </label>
                              <textarea
                                id="booking-notes"
                                rows={3}
                                value={bookingNotes}
                                onChange={(e) => setBookingNotes(e.target.value)}
                                placeholder="Any specific requests, allergies or styling preferences..."
                                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                              />
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Note: Your note does not automatically guarantee a requested
                                outcome.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Navigation */}
                      <div className="mt-8 flex items-center justify-between border-t border-[#EAE6DF] pt-5">
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE6DF] px-5 py-2.5 text-xs font-semibold text-[#0F372E] hover:bg-slate-50 transition-colors"
                        >
                          <ChevronLeft className="size-4" /> Back
                        </button>

                        <button
                          onClick={handleProceedToReview}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#EC008C] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-[#EC008C]/25 hover:bg-[#d0007b] active:scale-[0.99] transition-all"
                        >
                          Next Step <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </section>
                  )}

                  {/* ========================================================= */}
                  {/* STEP 4: REVIEW & PAY (SCREENSHOT 4)                       */}
                  {/* ========================================================= */}
                  {currentStep === 4 && (
                    <section
                      aria-labelledby="step4-title"
                      className="animate-in fade-in-50 duration-200"
                    >
                      <div className="mb-4">
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#EC008C] transition-colors"
                        >
                          <ChevronLeft className="size-4" /> Back
                        </button>
                      </div>

                      <header className="mb-6">
                        <h1
                          id="step4-title"
                          className="font-serif text-2xl sm:text-3xl font-bold text-[#0F372E]"
                        >
                          Review & Pay
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                          Please review your booking details and complete the payment.
                        </p>
                      </header>

                      <div className="space-y-6">
                        {/* Customer Contact Details */}
                        <div className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                          <h3 className="font-bold text-sm text-[#0F372E]">Customer Information</h3>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F372E] mb-1">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Amina Juma"
                              className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] px-3.5 py-2.5 text-xs text-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F372E] mb-1">
                              Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1 rounded-xl border border-[#EAE6DF] bg-[#F5F4F0] px-3 text-xs font-medium text-foreground shrink-0">
                                <span>+255</span>
                                <ChevronRight className="size-3.5 rotate-90 text-muted-foreground" />
                              </div>
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="712 345 678"
                                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] px-3.5 py-2.5 text-xs text-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F372E] mb-1">
                              Email Address (Optional)
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="amina@email.com"
                              className="w-full rounded-xl border border-[#EAE6DF] bg-[#FFFCFA] px-3.5 py-2.5 text-xs text-foreground focus:border-[#EC008C] focus:ring-1 focus:ring-[#EC008C]/30 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="rounded-2xl border border-[#EAE6DF] bg-white p-5 sm:p-6 shadow-xs space-y-4">
                          <h3 className="font-bold text-sm text-[#0F372E]">Payment Method</h3>

                          <div className="space-y-2.5">
                            {/* Option 1: Mobile Money (Active) */}
                            <div
                              onClick={() => setPaymentMethod("momo")}
                              className={`flex items-center justify-between rounded-xl p-3.5 cursor-pointer border transition-all ${
                                paymentMethod === "momo"
                                  ? "border-2 border-[#EC008C] bg-[#FFFCFA] shadow-xs"
                                  : "border-[#EAE6DF] hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="grid size-5 place-items-center rounded-full border-2 border-[#EC008C]">
                                  <div className="size-2.5 rounded-full bg-[#EC008C]" />
                                </div>
                                <div className="grid size-8 place-items-center rounded-lg bg-[#FCEAF2] text-[#EC008C]">
                                  <Smartphone className="size-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-[#0F372E]">
                                    Mobile Money (M-Pesa / Tigo / Airtel)
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Pay securely with your mobile money wallet
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-[#EC008C] text-white text-[10px] font-bold">
                                Instant
                              </Badge>
                            </div>

                            {/* Option 2: Bank Transfer (Disabled / Coming Soon) */}
                            <div className="flex items-center justify-between rounded-xl p-3.5 border border-[#EAE6DF] bg-[#F9F8F5] opacity-60 cursor-not-allowed">
                              <div className="flex items-center gap-3">
                                <div className="size-5 rounded-full border-2 border-slate-300" />
                                <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-400">
                                  <Building2 className="size-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-xs text-slate-500">
                                    Bank Transfer{" "}
                                    <span className="text-[10px] text-slate-400">
                                      (Coming Soon)
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Security notice */}
                          <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                            <Lock className="size-3.5 text-muted-foreground shrink-0" />
                            <span>
                              Your payment is secured with YIF Capital · 256-bit encryption
                            </span>
                          </div>
                        </div>

                        {/* Bottom Navigation */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EAE6DF] pt-5">
                          <button
                            onClick={() => setCurrentStep(3)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE6DF] px-5 py-2.5 text-xs font-semibold text-[#0F372E] hover:bg-slate-50 transition-colors"
                          >
                            <ChevronLeft className="size-4" /> Back
                          </button>

                          <button
                            disabled={isSubmitting}
                            onClick={handleConfirmPayment}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#EC008C] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#EC008C]/30 hover:bg-[#d0007b] active:scale-[0.99] transition-all disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <>
                                <RefreshCw className="size-4 animate-spin" /> Verifying Payment...
                              </>
                            ) : (
                              <>
                                <Printer className="size-4" /> Pay & Confirm —{" "}
                                {formatMoney(selectedService?.price || 35000)}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                {/* ========================================================= */}
                {/* SHADCN UI APPOINTMENT SUMMARY SIDEBAR (DESKTOP)           */}
                {/* ========================================================= */}
                <aside className="hidden lg:block lg:col-span-4 sticky top-24">
                  <SalonAppointmentSidebar
                    currentStep={currentStep}
                    selectedCategory={selectedCategory}
                    selectedService={selectedService}
                    selectedStylist={selectedStylist}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    formatMoney={formatMoney}
                    getFormattedDateDisplay={getFormattedDateDisplay}
                    onStepChange={(s) => setCurrentStep(s as 1 | 2 | 3 | 4)}
                    onProceed={handleProceedFromSidebar}
                    isSubmitting={isSubmitting}
                    onOpenImage={handleOpenLightbox}
                  />
                </aside>
              </div>

              {/* ========================================================= */}
              {/* MOBILE BOTTOM SUMMARY BAR WITH SHADCN SHEET DRAWER        */}
              {/* ========================================================= */}
              <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE6DF] px-4 py-3 shadow-lg flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Step {currentStep} of 4 ·{" "}
                    {selectedService ? selectedService.name : selectedCategory.name}
                  </p>
                  <p className="font-serif text-sm font-bold text-[#EC008C]">
                    {formatMoney(selectedService?.price || selectedCategory.startingPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl border-[#EAE6DF] text-xs font-semibold text-[#0F372E] hover:bg-[#FCEAF2] hover:text-[#EC008C]"
                      >
                        Summary
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 bg-white border-t border-[#EAE6DF]"
                    >
                      <SheetHeader className="mb-3 text-left">
                        <SheetTitle className="font-serif text-lg font-bold text-[#0F372E]">
                          Appointment Summary
                        </SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                          Review your selected salon service, stylist, and schedule.
                        </SheetDescription>
                      </SheetHeader>
                      <SalonAppointmentSidebar
                        currentStep={currentStep}
                        selectedCategory={selectedCategory}
                        selectedService={selectedService}
                        selectedStylist={selectedStylist}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        formatMoney={formatMoney}
                        getFormattedDateDisplay={getFormattedDateDisplay}
                        onStepChange={(s) => setCurrentStep(s as 1 | 2 | 3 | 4)}
                        onProceed={handleProceedFromSidebar}
                        isSubmitting={isSubmitting}
                        onOpenImage={handleOpenLightbox}
                      />
                    </SheetContent>
                  </Sheet>
                  <Button
                    onClick={handleProceedFromSidebar}
                    disabled={isSubmitting || (currentStep === 2 && !selectedService)}
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-[#EC008C] hover:bg-[#d0007b] text-white text-xs font-bold shadow-md shadow-[#EC008C]/25"
                  >
                    {currentStep === 4 ? "Pay Now" : "Continue"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Full Image Lightbox Modal for clear high-resolution design inspection */}
        <SalonImageLightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          activeDesign={lightboxDesign}
          allDesigns={currentStep === 2 ? serviceDesigns : categoryDesigns}
          onSelectDesign={(design) => {
            if (currentStep === 1) {
              const cat = SALON_CATEGORIES.find((c) => c.id === design.id);
              if (cat) handleSelectCategory(cat);
            } else if (currentStep === 2) {
              const srv = SALON_SERVICES.find((s) => s.id === design.id);
              if (srv) setSelectedService(srv);
            }
          }}
        />
      </main>
    </Site>
  );
}

{
  /* ========================================================= */
}
{
  /* SHADCN UI APPOINTMENT SUMMARY SIDEBAR COMPONENT           */
}
{
  /* ========================================================= */
}
function SalonAppointmentSidebar({
  currentStep,
  selectedCategory,
  selectedService,
  selectedStylist,
  selectedDate,
  selectedSlot,
  formatMoney,
  getFormattedDateDisplay,
  onStepChange,
  onProceed,
  isSubmitting,
  onOpenImage,
}: {
  currentStep: number;
  selectedCategory: SalonCategory;
  selectedService: SalonService | null;
  selectedStylist: SalonStylist;
  selectedDate: string;
  selectedSlot: string;
  formatMoney: (val: number) => string;
  getFormattedDateDisplay: (dateStr: string) => string;
  onStepChange: (step: number) => void;
  onProceed: () => void;
  isSubmitting?: boolean;
  onOpenImage?: (design: HairstyleDesignItem) => void;
}) {
  const price = selectedService?.price || selectedCategory.startingPrice;

  return (
    <Card className="border border-[#EAE6DF] shadow-md bg-white rounded-2xl overflow-hidden transition-all">
      <CardHeader className="bg-linear-to-r from-[#FCEAF2] to-[#FFF0F7] p-5 border-b border-[#F0ECE6]">
        <div className="flex items-center justify-between">
          <Badge className="bg-[#EC008C] text-white hover:bg-[#EC008C] font-semibold text-[11px] px-2.5 py-0.5">
            Step {currentStep} of 4
          </Badge>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#EC008C]">
            Live Summary
          </span>
        </div>
        <CardTitle className="font-serif text-lg font-bold text-[#0F372E] mt-2">
          Salon Appointment
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <MapPin className="size-3.5 text-[#EC008C] shrink-0" />
          Philipo Salon · Mwenge, Dar es Salaam
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Service Details */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Service
            </span>
            {currentStep > 1 && (
              <button
                onClick={() => onStepChange(2)}
                className="text-[11px] font-semibold text-[#EC008C] hover:underline flex items-center gap-0.5"
              >
                <Edit3 className="size-3" /> Edit
              </button>
            )}
          </div>
          {selectedService ? (
            <div className="rounded-xl border border-[#F0ECE6] bg-[#FFFCFA] p-3 flex items-start gap-3">
              <div
                onClick={() =>
                  onOpenImage?.({
                    id: selectedService.id,
                    name: selectedService.name,
                    categoryName: selectedCategory.name,
                    categoryId: selectedCategory.id,
                    image: selectedService.image,
                    price: selectedService.price,
                    duration: selectedService.duration,
                    description: selectedService.description,
                  })
                }
                className="relative group size-12 rounded-xl overflow-hidden border border-black/5 shrink-0 cursor-pointer shadow-2xs"
                title="Click to inspect clear full image"
              >
                <img
                  src={selectedService.image}
                  alt={selectedService.name}
                  className="size-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Maximize2 className="size-3.5" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-[#0F372E] truncate">{selectedService.name}</p>
                <p className="text-[11px] text-muted-foreground">{selectedCategory.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-[#EC008C]/30 text-[#EC008C] bg-[#FCEAF2]/50"
                  >
                    ⏱ {selectedService.duration}
                  </Badge>
                  <span className="text-xs font-bold text-[#EC008C]">
                    {formatMoney(selectedService.price)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#F0ECE6] bg-[#FFFCFA] p-3 flex items-start gap-3">
              <div
                onClick={() =>
                  onOpenImage?.({
                    id: selectedCategory.id,
                    name: selectedCategory.name,
                    categoryName: selectedCategory.name,
                    categoryId: selectedCategory.id,
                    image: selectedCategory.image,
                    price: selectedCategory.startingPrice,
                    duration: "Approx. 2 hours",
                    description: selectedCategory.description,
                  })
                }
                className="relative group size-12 rounded-xl overflow-hidden border border-black/5 shrink-0 cursor-pointer shadow-2xs"
                title="Click to inspect clear full image"
              >
                <img
                  src={selectedCategory.image}
                  alt={selectedCategory.name}
                  className="size-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Maximize2 className="size-3.5" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-[#0F372E] truncate">{selectedCategory.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Starting from {formatMoney(selectedCategory.startingPrice)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onOpenImage?.({
                      id: selectedCategory.id,
                      name: selectedCategory.name,
                      categoryName: selectedCategory.name,
                      categoryId: selectedCategory.id,
                      image: selectedCategory.image,
                      price: selectedCategory.startingPrice,
                      duration: "Approx. 2 hours",
                      description: selectedCategory.description,
                    })
                  }
                  className="mt-1 text-[10px] font-semibold text-[#EC008C] hover:underline flex items-center gap-1"
                >
                  <Eye className="size-3" /> Inspect Design
                </button>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-[#F0ECE6]" />

        {/* Stylist Details */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Stylist
            </span>
            {currentStep > 2 && (
              <button
                onClick={() => onStepChange(3)}
                className="text-[11px] font-semibold text-[#EC008C] hover:underline flex items-center gap-0.5"
              >
                <Edit3 className="size-3" /> Edit
              </button>
            )}
          </div>
          <div className="rounded-xl border border-[#F0ECE6] bg-[#FFFCFA] p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-[#EC008C]/30 ring-1 ring-[#EC008C]/20">
                <AvatarFallback className="bg-[#FCEAF2] text-[#EC008C] font-bold text-xs">
                  {selectedStylist.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-xs text-[#0F372E]">{selectedStylist.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedStylist.specialty}</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-[#FCEAF2] text-[#EC008C] font-bold text-[10px] gap-1 px-2"
            >
              <Star className="size-2.5 fill-current" /> {selectedStylist.rating}
            </Badge>
          </div>
        </div>

        <Separator className="bg-[#F0ECE6]" />

        {/* Date & Time Schedule */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Schedule
            </span>
            {currentStep > 3 && (
              <button
                onClick={() => onStepChange(3)}
                className="text-[11px] font-semibold text-[#EC008C] hover:underline flex items-center gap-0.5"
              >
                <Edit3 className="size-3" /> Edit
              </button>
            )}
          </div>
          <div className="rounded-xl border border-[#F0ECE6] bg-[#FFFCFA] p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#0F372E]">
              <CalendarIcon className="size-3.5 text-[#EC008C] shrink-0" />
              <span className="font-medium">
                {selectedDate ? getFormattedDateDisplay(selectedDate) : "Select date in Step 3"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#0F372E]">
              <Clock className="size-3.5 text-[#EC008C] shrink-0" />
              <span className="font-medium">
                {selectedSlot
                  ? `${selectedSlot} (${selectedService?.duration || "60 mins"})`
                  : "Select time slot in Step 3"}
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-[#F0ECE6]" />

        {/* Price Breakdown */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Service Subtotal</span>
            <span className="font-semibold text-foreground">{formatMoney(price)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Sanitization & Tools</span>
            <span className="font-semibold text-emerald-600">FREE</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Styling Consultation</span>
            <span className="font-semibold text-emerald-600">FREE</span>
          </div>
          <div className="pt-2 border-t border-[#F0ECE6] flex items-center justify-between">
            <span className="font-bold text-sm text-[#0F372E]">Estimated Total</span>
            <span className="font-serif text-lg font-bold text-[#EC008C]">
              {formatMoney(price)}
            </span>
          </div>
        </div>

        {/* Philipo Trust Guarantee */}
        <div className="rounded-xl bg-[#FCEAF2]/50 p-3 text-[11px] text-[#0F372E] space-y-1.5 border border-[#EC008C]/15">
          <div className="flex items-center gap-1.5 font-semibold text-[#EC008C]">
            <ShieldCheck className="size-3.5" /> 100% Sterile & Hygienic Tools
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarHeart className="size-3.5 text-[#EC008C]" /> Free rescheduling up to 2 hours
            prior
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-col gap-2">
        <Button
          onClick={onProceed}
          disabled={isSubmitting || (currentStep === 2 && !selectedService)}
          className="w-full bg-[#EC008C] hover:bg-[#d0007b] text-white font-bold h-11 rounded-xl shadow-md shadow-[#EC008C]/25 transition-all text-xs sm:text-sm"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="size-4 animate-spin mr-2" /> Processing...
            </>
          ) : currentStep === 1 ? (
            <>
              Choose Session Type <ArrowRight className="size-4 ml-1.5" />
            </>
          ) : currentStep === 2 ? (
            <>
              Choose Date & Time <ArrowRight className="size-4 ml-1.5" />
            </>
          ) : currentStep === 3 ? (
            <>
              Review & Pay <ArrowRight className="size-4 ml-1.5" />
            </>
          ) : (
            <>
              <Printer className="size-4 mr-1.5" /> Pay & Confirm Booking
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
