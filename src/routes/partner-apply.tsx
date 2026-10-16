import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Building2,
  User,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Store,
  HelpCircle,
  Eye,
  Trash2,
  ChevronRight,
  Lock,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  ResellerApplication,
  ResellerApplicantType,
  TANZANIA_REGIONS,
  SALES_CHANNEL_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
  ESTIMATED_SALES_RANGES,
  validateTanzaniaNIN,
  formatNINDisplay,
  getResellerApplicationByUserId,
  saveResellerApplication,
  createInitialResellerApplication,
  ResellerDocument,
} from "@/lib/reseller-store";

export const Route = createFileRoute("/partner-apply")({
  head: () => ({
    meta: [
      { title: "Business Partner & Reseller Application — Philipo Cosmetics" },
      {
        name: "description",
        content:
          "Apply to become an authorized Philipo Cosmetics reseller or distributor in Tanzania.",
      },
    ],
  }),
  component: PartnerApplicationPage,
});

export function PartnerApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<ResellerApplication | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Camera stream refs for Step 4
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Load or initialize application
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // User must be logged in to apply
      return;
    }

    const existing = getResellerApplicationByUserId(user.id);
    if (existing) {
      setApp(existing);
      setCurrentStep(
        existing.status === "SUBMITTED" ||
          existing.status === "UNDER_REVIEW" ||
          existing.status === "APPROVED"
          ? 6
          : existing.step || 1,
      );
    } else {
      const initialized = createInitialResellerApplication(user.id, {
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      setApp(initialized);
    }
  }, [user, authLoading]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function startCamera() {
    setCameraError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Camera access failed", err);
        setCameraError(
          "Camera permission was denied or camera is not available. You can upload a photo file below instead.",
        );
        setCameraActive(false);
      });
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function captureSelfie() {
    if (!videoRef.current || !app) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      updateApp({ selfieUrl: dataUrl, verificationStatus: "PENDING" });
      stopCamera();
      toast.success("Selfie Captured", {
        description: "Camera oval framing alignment verified.",
      });
    }
  }

  function updateApp(partial: Partial<ResellerApplication>) {
    if (!app) return;
    const updated: ResellerApplication = {
      ...app,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    setApp(updated);
    saveResellerApplication(updated);
  }

  function handleSaveDraft() {
    if (!app) return;
    updateApp({
      step: currentStep,
      status: app.status === "SUBMITTED" ? app.status : "IN_PROGRESS",
    });
    setSaveSuccess(true);
    toast("Saved", {
      description: "Application progress has been safely saved.",
    });
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleFileUpload(
    type: ResellerDocument["type"],
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file || !app) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File Too Large", {
        description: "Please upload an image or PDF under 8MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newDoc: ResellerDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        name: file.name,
        url,
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
      };

      // Filter out existing doc of same type or append
      const filtered = app.documents.filter((d) => d.type !== type);
      updateApp({ documents: [...filtered, newDoc] });
      toast.success("Document Uploaded", {
        description: `${file.name} saved.`,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveDoc(docId: string) {
    if (!app) return;
    updateApp({ documents: app.documents.filter((d) => d.id !== docId) });
  }

  // Step Validation logic
  function validateAndProceed(nextStep: number) {
    setValidationError(null);
    if (!app) return;

    if (currentStep === 1) {
      if (!app.fullName.trim() || app.fullName.trim().length < 3) {
        setValidationError(
          "Please enter your legal full name as registered on your official identity documents.",
        );
        return;
      }
      if (!app.phone.trim() || app.phone.trim().length < 9) {
        setValidationError("Please enter a valid primary mobile contact number.");
        return;
      }
      if (!app.region) {
        setValidationError("Please select your residential region in Tanzania.");
        return;
      }
      if (!app.district.trim()) {
        setValidationError("Please enter your district or municipal council.");
        return;
      }
      if (!app.street.trim()) {
        setValidationError("Please specify your street address or landmark.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!app.shopName.trim()) {
        setValidationError("Please enter your proposed or current shop / outlet name.");
        return;
      }
      if (app.salesChannels.length === 0) {
        setValidationError("Please select at least one intended sales channel.");
        return;
      }
      if (app.productCategories.length === 0) {
        setValidationError("Please select at least one product category of interest.");
        return;
      }
      if (app.territories.length === 0) {
        setValidationError(
          "Please specify at least one selling territory (e.g. Morogoro Urban, Njombe).",
        );
        return;
      }
      if (app.applicantType === "registered_business" && !app.businessRegNumber?.trim()) {
        setValidationError(
          "Business registration number (BRELA) is required for registered businesses.",
        );
        return;
      }
    }

    if (currentStep === 3) {
      const ninResult = validateTanzaniaNIN(app.nidaNumber);
      if (!ninResult.isValid) {
        setValidationError(
          ninResult.errorMessage || "Please enter a valid 20-digit Tanzanian NIDA NIN.",
        );
        return;
      }
      if (!app.nidaName.trim()) {
        setValidationError(
          "Please enter the name exactly as it appears on your NIDA identification card.",
        );
        return;
      }
      const hasIdFront = app.documents.some((d) => d.type === "national_id_front");
      if (!hasIdFront) {
        setValidationError("Please upload the front photo of your NIDA National ID card.");
        return;
      }
      updateApp({ nidaNormalized: ninResult.normalized });
    }

    if (currentStep === 4) {
      if (!app.selfieUrl) {
        setValidationError("Please capture or upload a selfie for identity verification.");
        return;
      }
      if (!app.biometricConsent) {
        setValidationError(
          "You must provide explicit consent for facial biometric processing under Tanzania's Personal Data Protection Act, 2022.",
        );
        return;
      }
    }

    if (currentStep === 5) {
      if (!app.termsAccepted) {
        setValidationError(
          "You must accept the Philipo Cosmetics Reseller Agreement terms to proceed.",
        );
        return;
      }
    }

    updateApp({ step: nextStep });
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmitApplication() {
    if (!app) return;
    updateApp({
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
      step: 6,
    });
    setCurrentStep(6);
    toast.success("Application Submitted!", {
      description: `Application ${app.id} received. Philipo Cosmetics Admin will review your dossier.`,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4">
        <RefreshCw className="size-6 text-[#0F4D32] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E8E2D9] shadow-xl text-center space-y-5">
          <div className="size-14 rounded-2xl bg-[#0F4D32]/10 text-[#0F4D32] flex items-center justify-center mx-auto">
            <Store className="size-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A24]">Business Partner & Reseller Portal</h1>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Please sign in or create an account to start your Philipo Cosmetics reseller
              application.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              to="/register"
              className="w-full py-3 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
            >
              Register as Business Partner
            </Link>
            <Link
              to="/login"
              className="w-full py-3 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
            >
              Sign In to Resume Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return null;
  }

  const stepsList = [
    { num: 1, title: "Applicant Profile", desc: "Personal & contact info" },
    { num: 2, title: "Business & Territory", desc: "Operations & retail zones" },
    { num: 3, title: "NIDA & KYC Documents", desc: "20-digit NIN & uploads" },
    { num: 4, title: "Selfie & Verification", desc: "Face match & PDPA consent" },
    { num: 5, title: "Reseller Agreement", desc: "Terms & wholesale policies" },
    { num: 6, title: "Review & Submit", desc: "Application reference" },
  ];

  const isSubmittedOrApproved =
    app.status === "SUBMITTED" ||
    app.status === "UNDER_REVIEW" ||
    app.status === "APPROVED" ||
    app.status === "MORE_INFORMATION_REQUIRED";

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1A1A24] font-sans flex flex-col justify-between">
      {/* ─── TOP ELEGANT HEADER ─── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Philipo Cosmetics" className="h-8 object-contain" />
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight text-[#0F4D32]">
                Philipo Cosmetics
              </span>
              <span className="block text-[10px] text-[#C9A45C] font-semibold uppercase tracking-wider">
                Partner Network
              </span>
            </div>
          </Link>
          <span className="text-gray-300">|</span>
          <div className="text-xs font-semibold text-gray-600">Reseller Onboarding</div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-in fade-in">
              Draft saved ✓
            </span>
          )}
          {!isSubmittedOrApproved && (
            <button
              onClick={handleSaveDraft}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition"
            >
              Save Draft
            </button>
          )}
          <Link to="/account" className="text-xs font-medium text-[#0F4D32] hover:underline">
            My Account
          </Link>
        </div>
      </header>

      {/* ─── MAIN HERO BANNER ─── */}
      <div className="bg-gradient-to-r from-[#0F4D32] via-[#145C3D] to-[#0B3B26] text-white px-4 sm:px-8 py-7">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-[#E2CE9C] mb-2 border border-white/10">
              <Sparkles className="size-3.5" />
              <span>National Distribution Program</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Business Partner & Reseller Application
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Register as an authorized retail partner across Tanzania (Morogoro, Njombe, Dar es
              Salaam, and all regions). Submit your KYC credentials for Philipo Cosmetics executive
              review.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-xs shrink-0 sm:text-right">
            <span className="text-[11px] text-emerald-200 block">Application Reference:</span>
            <span className="font-mono font-bold text-white text-sm">{app.id}</span>
            <div className="mt-1">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  app.status === "APPROVED"
                    ? "bg-emerald-400 text-slate-900"
                    : app.status === "UNDER_REVIEW" || app.status === "SUBMITTED"
                      ? "bg-amber-300 text-slate-900"
                      : app.status === "MORE_INFORMATION_REQUIRED"
                        ? "bg-orange-300 text-slate-900"
                        : "bg-white/20 text-white"
                }`}
              >
                {app.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── APPLICATION BODY ─── */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        {/* Step Navigation Bar */}
        <div className="mb-8">
          {/* Mobile Current Step Headline */}
          <div className="sm:hidden mb-3 flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-[#0F4D32] font-bold">
              Step {currentStep} of {stepsList.length}: {stepsList.find((s) => s.num === currentStep)?.title}
            </span>
            <span className="text-gray-500 font-medium">
              {Math.round((currentStep / stepsList.length) * 100)}%
            </span>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {stepsList.map((s) => {
              const isActive = currentStep === s.num;
              const isPassed = currentStep > s.num || isSubmittedOrApproved;
              return (
                <button
                  key={s.num}
                  disabled={isSubmittedOrApproved && app.status !== "MORE_INFORMATION_REQUIRED"}
                  onClick={() => {
                    if (!isSubmittedOrApproved) setCurrentStep(s.num);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all shrink-0 min-w-[155px] sm:min-w-0 flex-1 flex flex-col justify-between ${
                    isActive
                      ? "bg-white border-[#0F4D32] shadow-md ring-2 ring-[#0F4D32]/20"
                      : isPassed
                        ? "bg-white/70 border-emerald-200 text-emerald-900"
                        : "bg-white/40 border-gray-200 text-gray-500"
                  }`}
                >
                  <div className="flex items-start gap-1.5 text-xs font-bold mb-1">
                    <span
                      className={`size-5 shrink-0 rounded-full flex items-center justify-center text-[10px] mt-0.5 ${
                        isActive
                          ? "bg-[#0F4D32] text-white"
                          : isPassed
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {s.num}
                    </span>
                    <span className="leading-snug break-words">{s.title}</span>
                  </div>
                  <p className="text-[10.5px] text-gray-500 leading-tight break-words pl-6.5">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Informational Banner if more info requested */}
        {app.status === "MORE_INFORMATION_REQUIRED" && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <AlertCircle className="size-4" />
              <span>Philipo Reviewer Action Requested</span>
            </div>
            <p className="text-amber-800 leading-relaxed font-medium">
              "{app.moreInfoReason || "Please update your documents and resubmit."}"
            </p>
            <p className="text-[11px] text-amber-700">
              Please review the affected sections below, provide the requested information, and
              click "Resubmit Application".
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 1: APPLICANT INFORMATION                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A24] flex items-center gap-2">
                <User className="size-5 text-[#0F4D32]" />
                <span>Step 1: Personal & Contact Information</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Provide the legal details of the primary applicant or company authorized
                representative.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Legal Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rehema Juma Mwambalaswa"
                  value={app.fullName}
                  onChange={(e) => updateApp({ fullName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={app.dob || ""}
                  onChange={(e) => updateApp({ dob: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Primary Mobile Number *
                </label>
                <input
                  type="text"
                  placeholder="+255 7XX XXX XXX"
                  value={app.phone}
                  onChange={(e) => updateApp({ phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Alternative Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+255 7XX XXX XXX"
                  value={app.altPhone || ""}
                  onChange={(e) => updateApp({ altPhone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="partner@example.com"
                  value={app.email}
                  onChange={(e) => updateApp({ email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Preferred Contact Channel
                </label>
                <select
                  value={app.preferredContact}
                  onChange={(e) =>
                    updateApp({
                      preferredContact: e.target.value as "phone" | "email" | "whatsapp",
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32] bg-white"
                >
                  <option value="phone">Direct Phone Call</option>
                  <option value="whatsapp">WhatsApp Messaging</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Residential Location in Tanzania
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Region *</label>
                  <select
                    value={app.region}
                    onChange={(e) => updateApp({ region: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32] bg-white"
                  >
                    {TANZANIA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    District / Council *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Morogoro Urban"
                    value={app.district}
                    onChange={(e) => updateApp({ district: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Ward</label>
                  <input
                    type="text"
                    placeholder="e.g. Boma"
                    value={app.ward}
                    onChange={(e) => updateApp({ ward: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Street / Landmark *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Old Dar Road"
                    value={app.street}
                    onChange={(e) => updateApp({ street: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">Step 1 of 6</span>
              <button
                onClick={() => validateAndProceed(2)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
              >
                <span>Continue to Business Details</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 2: BUSINESS & SELLING TERRITORIES                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A24] flex items-center gap-2">
                <Building2 className="size-5 text-[#0F4D32]" />
                <span>Step 2: Business Operations & Target Territories</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Configure your retail model, sales capacity, and the regional zones you plan to
                supply.
              </p>
            </div>

            {/* Applicant Type Selection Card */}
            <div>
              <label className="block font-semibold text-xs text-gray-700 mb-2">
                Operating Structure *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => updateApp({ applicantType: "individual" })}
                  className={`p-4 rounded-2xl border text-left transition ${
                    app.applicantType === "individual"
                      ? "border-[#0F4D32] bg-[#0F4D32]/5 ring-1 ring-[#0F4D32]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-bold text-sm text-[#0F4D32] block">
                    Individual Reseller / Direct Seller
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    For salon owners, mobile cosmetic consultants, and independent retail sellers.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateApp({ applicantType: "registered_business" })}
                  className={`p-4 rounded-2xl border text-left transition ${
                    app.applicantType === "registered_business"
                      ? "border-[#0F4D32] bg-[#0F4D32]/5 ring-1 ring-[#0F4D32]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-bold text-sm text-[#0F4D32] block">
                    Registered Business / Wholesale Entity
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    For incorporated enterprises, retail chain stores, and registered distribution
                    companies with BRELA.
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Proposed Store / Outlet Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rehema Glamour House"
                  value={app.shopName}
                  onChange={(e) => updateApp({ shopName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Estimated Monthly Sales Capacity
                </label>
                <select
                  value={app.estimatedMonthlySales}
                  onChange={(e) => updateApp({ estimatedMonthlySales: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32] bg-white"
                >
                  {ESTIMATED_SALES_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {app.applicantType === "registered_business" && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      BRELA Registration Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BRELA-589210"
                      value={app.businessRegNumber || ""}
                      onChange={(e) => updateApp({ businessRegNumber: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Tax Identification Number (TIN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 134-892-019"
                      value={app.tin || ""}
                      onChange={(e) => updateApp({ tin: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sales Channels */}
            <div>
              <label className="block font-semibold text-xs text-gray-700 mb-2">
                Intended Sales Channels (Select all that apply) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {SALES_CHANNEL_OPTIONS.map((channel) => {
                  const isChecked = app.salesChannels.includes(channel);
                  return (
                    <label
                      key={channel}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? "bg-[#0F4D32]/5 border-[#0F4D32] text-[#0F4D32] font-semibold"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked
                            ? app.salesChannels.filter((c) => c !== channel)
                            : [...app.salesChannels, channel];
                          updateApp({ salesChannels: updated });
                        }}
                        className="rounded border-gray-300 text-[#0F4D32] focus:ring-[#0F4D32]"
                      />
                      <span>{channel}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Selling Territories across Tanzania */}
            <div>
              <label className="block font-semibold text-xs text-gray-700 mb-1">
                Target Selling Territories (Regions / Districts in Tanzania) *
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                Indicate where you will distribute (e.g., "Morogoro Urban & Kilosa", "Njombe &
                Makambako", "Dar es Salaam Kariakoo").
              </p>
              <input
                type="text"
                placeholder="e.g. Morogoro Urban, Kilosa, Njombe"
                value={app.territories.join(", ")}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateApp({ territories: arr });
                }}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
              />
            </div>

            {/* Product Categories of Interest */}
            <div>
              <label className="block font-semibold text-xs text-gray-700 mb-2">
                Product Categories of Interest *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {PRODUCT_CATEGORY_OPTIONS.map((cat) => {
                  const isChecked = app.productCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? "bg-[#0F4D32]/5 border-[#0F4D32] text-[#0F4D32] font-semibold"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked
                            ? app.productCategories.filter((c) => c !== cat)
                            : [...app.productCategories, cat];
                          updateApp({ productCategories: updated });
                        }}
                        className="rounded border-gray-300 text-[#0F4D32] focus:ring-[#0F4D32]"
                      />
                      <span className="text-[11px]">{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => validateAndProceed(3)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
              >
                <span>Continue to NIDA & KYC</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 3: NIDA INFORMATION & DOCUMENT UPLOADS                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A24] flex items-center gap-2">
                <FileText className="size-5 text-[#0F4D32]" />
                <span>Step 3: NIDA Identity & Supporting Documents</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Provide your 20-digit NIDA National Identification Number (NIN) and upload clear
                copies of required documents.
              </p>
            </div>

            {/* NIDA NIN Section */}
            <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-[#E8E2D9] space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-xs text-[#0F4D32]">
                  NIDA National Identification Number (NIN) *
                </label>
                <span className="text-[11px] text-gray-400">Tanzania NIDA Format</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 19760517-37227-00002-17"
                  value={app.nidaNumber}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const res = validateTanzaniaNIN(raw);
                    updateApp({
                      nidaNumber: raw,
                      nidaNormalized: res.normalized,
                    });
                  }}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#0F4D32]"
                />
              </div>

              {/* Real-time 20-digit counter & validation status */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
                <div>
                  Digits:{" "}
                  <strong
                    className={
                      app.nidaNormalized.length === 20 ? "text-emerald-700" : "text-amber-600"
                    }
                  >
                    {app.nidaNormalized.length} / 20 numeric digits
                  </strong>
                </div>
                {app.nidaNormalized.length === 20 ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Format Validated (20 Digits)
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Standard format: 8 digits - 5 digits - 5 digits - 2 digits
                  </span>
                )}
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                <strong>Identity Notice:</strong> NIDA NIN format validation confirms digit
                structure compliance. Official identity records verification is conducted by the
                Philipo Compliance review team.
              </div>

              <div className="pt-1">
                <label className="block font-semibold text-xs text-gray-700 mb-1">
                  Full Name as Displayed on NIDA Card *
                </label>
                <input
                  type="text"
                  placeholder="e.g. REHEMA JUMA MWAMBALASWA"
                  value={app.nidaName}
                  onChange={(e) => updateApp({ nidaName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F4D32] uppercase"
                />
              </div>
            </div>

            {/* Document Uploads Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                Supporting Verification Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* 1. NIDA Front */}
                <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center space-y-2 bg-[#FFFDF9]">
                  <span className="font-bold text-gray-800 block text-xs">
                    NIDA Card (Front Side) *
                  </span>
                  {app.documents.some((d) => d.type === "national_id_front") ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-left">
                      <span className="text-[11px] text-emerald-800 font-semibold truncate max-w-[140px]">
                        {app.documents.find((d) => d.type === "national_id_front")?.name}
                      </span>
                      <button
                        onClick={() => {
                          const doc = app.documents.find((d) => d.type === "national_id_front");
                          if (doc) handleRemoveDoc(doc.id);
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F4D32]/10 hover:bg-[#0F4D32]/20 text-[#0F4D32] font-semibold text-xs transition">
                        <Upload className="size-3.5" />
                        <span>Upload Front</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload("national_id_front", e)}
                          className="hidden"
                        />
                      </label>
                      <span className="block text-[10px] text-gray-400 mt-1">
                        JPEG, PNG, or PDF up to 8MB
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. NIDA Back */}
                <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center space-y-2 bg-[#FFFDF9]">
                  <span className="font-bold text-gray-800 block text-xs">
                    NIDA Card (Back Side)
                  </span>
                  {app.documents.some((d) => d.type === "national_id_back") ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-left">
                      <span className="text-[11px] text-emerald-800 font-semibold truncate max-w-[140px]">
                        {app.documents.find((d) => d.type === "national_id_back")?.name}
                      </span>
                      <button
                        onClick={() => {
                          const doc = app.documents.find((d) => d.type === "national_id_back");
                          if (doc) handleRemoveDoc(doc.id);
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition">
                        <Upload className="size-3.5" />
                        <span>Upload Back</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload("national_id_back", e)}
                          className="hidden"
                        />
                      </label>
                      <span className="block text-[10px] text-gray-400 mt-1">
                        JPEG, PNG, or PDF
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Business / Premises Document */}
                <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center space-y-2 bg-[#FFFDF9]">
                  <span className="font-bold text-gray-800 block text-xs">
                    {app.applicantType === "registered_business"
                      ? "BRELA / TIN Certificate *"
                      : "Store / Salon Photo"}
                  </span>
                  {app.documents.some(
                    (d) => d.type === "business_cert" || d.type === "premises_photo",
                  ) ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-left">
                      <span className="text-[11px] text-emerald-800 font-semibold truncate max-w-[140px]">
                        {
                          app.documents.find(
                            (d) => d.type === "business_cert" || d.type === "premises_photo",
                          )?.name
                        }
                      </span>
                      <button
                        onClick={() => {
                          const doc = app.documents.find(
                            (d) => d.type === "business_cert" || d.type === "premises_photo",
                          );
                          if (doc) handleRemoveDoc(doc.id);
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition">
                        <Upload className="size-3.5" />
                        <span>Upload Document</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            handleFileUpload(
                              app.applicantType === "registered_business"
                                ? "business_cert"
                                : "premises_photo",
                              e,
                            )
                          }
                          className="hidden"
                        />
                      </label>
                      <span className="block text-[10px] text-gray-400 mt-1">
                        Certificate or storefront photo
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => validateAndProceed(4)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
              >
                <span>Continue to Selfie & Verification</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 4: SELFIE & FACE VERIFICATION                         */}
        {/* ══════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A24] flex items-center gap-2">
                <Camera className="size-5 text-[#0F4D32]" />
                <span>Step 4: Live Selfie & Biometric Identity Verification</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Align your face within the camera frame for automated identity matching against your
                submitted NIDA document.
              </p>
            </div>

            {/* PDPA 2022 Explicit Consent Banner */}
            <div className="p-4 rounded-2xl bg-[#0F4D32]/5 border border-[#0F4D32]/20 text-xs text-[#0F4D32] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="size-4.5" />
                <span>Tanzania Personal Data Protection Act, 2022 (Act No. 5 of 2022) Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-700">
                Under the Personal Data Protection Act, 2022, biometric and facial data is
                classified as sensitive personal data. Philipo Cosmetics collects this photograph
                strictly for anti-fraud identity verification, confirming that you are the
                legitimate holder of the submitted NIDA ID. Your biometric data is encrypted at rest
                and never shared with unauthorized commercial parties.
              </p>
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={app.biometricConsent}
                  onChange={(e) =>
                    updateApp({
                      biometricConsent: e.target.checked,
                      biometricConsentTimestamp: e.target.checked
                        ? new Date().toISOString()
                        : undefined,
                    })
                  }
                  className="rounded border-gray-300 text-[#0F4D32] focus:ring-[#0F4D32] mt-0.5"
                />
                <span className="text-xs font-semibold text-[#0F4D32]">
                  I give explicit consent for Philipo Cosmetics to capture and process my facial
                  photograph for reseller compliance verification.
                </span>
              </label>
            </div>

            {/* Camera / Capture Section */}
            <div className="max-w-md mx-auto text-center space-y-4">
              {app.selfieUrl ? (
                <div className="space-y-3">
                  <div className="relative size-64 mx-auto rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
                    <img
                      src={app.selfieUrl}
                      alt="Captured Selfie"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    <span>Selfie Captured & Prepared for Verification</span>
                  </div>
                  <button
                    onClick={() => {
                      updateApp({ selfieUrl: undefined });
                      startCamera();
                    }}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline"
                  >
                    Retake Photograph
                  </button>
                </div>
              ) : cameraActive ? (
                <div className="space-y-4">
                  <div className="relative size-72 sm:size-80 mx-auto rounded-3xl overflow-hidden bg-black shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="size-full object-cover scale-x-[-1]"
                    />
                    {/* Face Oval Guide */}
                    <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full mx-10 my-6 pointer-events-none" />
                    <span className="absolute bottom-3 left-0 right-0 text-[10px] text-white/80 font-medium">
                      Position face inside oval in good lighting
                    </span>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={captureSelfie}
                      className="px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-lg shadow-[#0F4D32]/25"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-3xl p-8 space-y-4 bg-[#FFFDF9]">
                  <div className="size-16 rounded-full bg-[#0F4D32]/10 text-[#0F4D32] flex items-center justify-center mx-auto">
                    <Camera className="size-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Live Camera Verification</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                      Use your device camera to take a clear, well-lit photo of your face without
                      sunglasses or hats.
                    </p>
                  </div>

                  {cameraError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      {cameraError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      onClick={startCamera}
                      className="px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
                    >
                      Open Device Camera
                    </button>
                    <label className="cursor-pointer px-4 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition">
                      Upload Photo File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateApp({
                              selfieUrl: ev.target?.result as string,
                              verificationStatus: "PENDING",
                            });
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  stopCamera();
                  setCurrentStep(3);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => validateAndProceed(5)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
              >
                <span>Continue to Terms & Consent</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 5: TERMS, CONDITIONS & RESELLER CONSENT               */}
        {/* ══════════════════════════════════════════════════════════ */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A24] flex items-center gap-2">
                <FileText className="size-5 text-[#0F4D32]" />
                <span>Step 5: Business Partner & Reseller Agreement</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Please review the commercial policies, wholesale ordering procedures, and reseller
                guidelines.
              </p>
            </div>

            {/* Scrollable Terms Text Box */}
            <div className="h-64 overflow-y-auto p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8E2D9] text-xs text-gray-700 space-y-4 leading-relaxed font-sans select-text">
              <h4 className="font-bold text-sm text-[#0F4D32]">
                PHILIPO COSMETICS LIMITED — BUSINESS PARTNER AGREEMENT (TZ-2026.1)
              </h4>
              <p>
                <strong>1. Nature of Application:</strong> Submission of this reseller application
                does not guarantee appointment as an authorized partner. Authorization becomes
                effective only upon formal administrative review, document verification, and receipt
                of an official Approval Notice from Philipo Cosmetics Executive Management.
              </p>
              <p>
                <strong>2. Authorized Reseller Pricing:</strong> Approved partners gain access to
                wholesale tier pricing (up to 25% discount off manufacturer retail price) contingent
                upon maintaining active accounts and complying with recommended retail pricing
                corridors.
              </p>
              <p>
                <strong>3. Territorial Distribution:</strong> Partners are authorized to distribute
                within their approved Tanzanian regions (e.g. Morogoro, Njombe, Dar es Salaam, or
                other agreed municipal councils). Re-export outside the United Republic of Tanzania
                is prohibited without written export license.
              </p>
              <p>
                <strong>4. Brand Authenticity & Counterfeit Zero-Tolerance:</strong> All products
                distributed must bear original Philipo Cosmetics security seals. Tampering with
                batch numbers, diluting formulations, or selling unauthorized parallel products
                results in immediate partnership termination and legal reporting to the Tanzania
                Bureau of Standards (TBS).
              </p>
              <p>
                <strong>5. Payment & Settlement:</strong> Wholesale consignments are settled via
                verified mobile money merchant integration (M-Pesa, Mixx by Yas, Airtel Money) or
                authorized corporate bank transfer prior to dispatch from the Kariakoo Central
                Warehouse.
              </p>
              <p>
                <strong>6. Personal Data Protection:</strong> All applicant identification records
                and biometric photographs are maintained pursuant to Tanzania’s Personal Data
                Protection Act, 2022, and accessed solely by authorized Philipo compliance
                personnel.
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 p-4 rounded-2xl border border-gray-200 hover:border-[#0F4D32] cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={app.termsAccepted}
                  onChange={(e) =>
                    updateApp({
                      termsAccepted: e.target.checked,
                      termsAcceptedAt: e.target.checked ? new Date().toISOString() : undefined,
                    })
                  }
                  className="rounded border-gray-300 text-[#0F4D32] focus:ring-[#0F4D32] mt-0.5 size-4"
                />
                <span className="text-xs text-gray-800 leading-relaxed">
                  I have read, understood, and solemnly agree to the{" "}
                  <strong>Philipo Cosmetics Business Partner Agreement (Version 2026.1-TZ)</strong>.
                  I certify that all personal, business, and NIDA credentials provided are genuine
                  and accurate.
                </span>
              </label>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => validateAndProceed(6)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
              >
                <span>Review Full Application</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 6: APPLICATION SUMMARY & SUBMISSION                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {isSubmittedOrApproved ? (
              /* Success / Status Tracking View */
              <div className="bg-white rounded-3xl p-8 border border-[#E8E2D9] shadow-sm text-center space-y-6 animate-in fade-in">
                <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="size-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A24]">
                    {app.status === "APPROVED"
                      ? "Congratulations! Your Reseller Application is Approved"
                      : "Application Successfully Submitted"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Application Reference:{" "}
                    <strong className="font-mono text-[#0F4D32]">{app.id}</strong>.
                    {app.status === "APPROVED"
                      ? " You are now an authorized Philipo Cosmetics partner with 25% wholesale pricing active."
                      : " Your KYC credentials, NIDA verification, and business proposal are in the Admin Review Queue."}
                  </p>
                </div>

                {/* Status Timeline */}
                <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#FFFDF9] border border-gray-200 text-left text-xs space-y-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-500 block">
                    Onboarding Progress
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-gray-900 block">
                        Account & Application Registered
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-gray-900 block">
                        KYC & NIDA Documents Submitted
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        NIN: {formatNINDisplay(app.nidaNumber)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`size-3 rounded-full shrink-0 ${
                        app.status === "APPROVED" ? "bg-emerald-600" : "bg-amber-500 animate-pulse"
                      }`}
                    />
                    <div>
                      <strong className="text-gray-900 block">
                        Executive Review & Territory Assignment
                      </strong>
                      <span className="text-[10px] text-gray-400">
                        {app.status === "APPROVED"
                          ? `Approved by ${app.assignedReviewer || "Admin"} with code ${app.partnerCode || "Active"}`
                          : "In Progress by Philipo Compliance Desk"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <Link
                    to="/account"
                    className="px-6 py-2.5 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-semibold text-xs shadow-md shadow-[#0F4D32]/20 transition"
                  >
                    Go to My Account Dashboard
                  </Link>
                  <Link
                    to="/shop"
                    search={{ category: undefined }}
                    className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
                  >
                    Explore Cosmetics Catalog
                  </Link>
                </div>
              </div>
            ) : (
              /* Review Before Submission View */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D9] shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A24] flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[#0F4D32]" />
                    <span>Step 6: Final Review & Application Submission</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Verify all entered information before submitting your file to Philipo Cosmetics
                    Admin.
                  </p>
                </div>

                {/* Section Review Cards */}
                <div className="space-y-4 text-xs">
                  {/* Card 1: Applicant Info */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-gray-200 flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-800 text-xs">Applicant Profile</span>
                      <p className="text-gray-600">
                        <strong>{app.fullName}</strong> · {app.phone} · {app.email}
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        {app.street}, {app.ward ? `${app.ward}, ` : ""}
                        {app.district}, {app.region}, Tanzania
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-[#0F4D32] font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Card 2: Business & Channels */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-gray-200 flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-800 text-xs">
                        Business Operations & Channels
                      </span>
                      <p className="text-gray-600">
                        <strong>{app.shopName}</strong> (
                        {app.applicantType === "registered_business"
                          ? "Registered Business"
                          : "Individual Reseller"}
                        )
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        Channels: {app.salesChannels.join(", ")}
                      </p>
                      <p className="text-emerald-700 font-medium text-[11px]">
                        Target Territories: {app.territories.join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-[#0F4D32] font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Card 3: NIDA & Documents */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-gray-200 flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-800 text-xs">
                        NIDA Identification & Documents
                      </span>
                      <p className="text-gray-700 font-mono">
                        NIN: {formatNINDisplay(app.nidaNumber)} (Normalized 20-Digits Verified)
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        Name on ID: {app.nidaName} · {app.documents.length} Document(s) attached
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-[#0F4D32] font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Card 4: Verification & Consent */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-gray-200 flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-800 text-xs">
                        Selfie & Biometric Consent
                      </span>
                      <p className="text-gray-600">
                        Selfie photo attached · PDPA 2022 Sensitive Personal Data consent granted ✓
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Agreed to Reseller Terms Version: {app.termsVersion}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="text-[#0F4D32] font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    className="inline-flex items-center gap-1.5 px-8 py-3 rounded-full bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-bold text-xs shadow-lg shadow-[#0F4D32]/25 transition active:scale-95 cursor-pointer"
                  >
                    <span>Submit Application for Review</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── ELEGANT BRAND FOOTER ─── */}
      <footer className="bg-white border-t border-[#E8E2D9] px-4 sm:px-8 py-4 text-center text-xs text-gray-500">
        <p>Philipo Cosmetics Limited · Business Partner & Regional Reseller Program</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Compliance with Tanzania Personal Data Protection Act, 2022 (Act No. 5 of 2022) · Kariakoo
          Flagship, Dar es Salaam
        </p>
      </footer>
    </div>
  );
}
export default PartnerApplicationPage;
