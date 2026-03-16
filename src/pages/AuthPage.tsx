import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ONBOARDED_KEY } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthControls from "@/components/AuthControls";
import { Loader2, Mail, Lock, Disc3, Check } from "lucide-react";
import VinylRecord from "@/components/VinylRecord";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthMode = "signin" | "signup" | "magic";

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(
  email: string,
  password: string,
  mode: AuthMode
): string | null {
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "invalidEmail";
  }
  if (mode !== "magic" && password.length < 6) {
    return "passwordTooShort";
  }
  return null;
}

// ─── Theme-aware colour tokens ─────────────────────────────────────────────────
//
// All colour decisions for this page live here.
//
// Dark mode principle: use solid warm colours (no opacity mixing) so text reads
// as cream/stone against the deep brown background — not muddy amber.
//
// Light mode principle: strong warm-brown text on cream/stone surfaces.

interface AuthColors {
  // Typography
  subtitle: string;
  helperText: string;
  footerText: string;
  linkText: string;
  // Decorative
  iconColor: string;
  dividerThin: string;
  // Tabs
  tabDivider: string;
  tabActiveBg: string;
  tabActiveBorder: string;
  tabActiveText: string;
  tabInactiveText: string;
  // Inputs — bg/border only; text is set by index.css global !important rules
  inputBg: string;
  inputBorder: string;
  inputIcon: string;
  // Button
  btnBg: string;
  btnBgHover: string;
  btnBorder: string;
  btnText: string;
  // Checkbox
  checkCheckedBg: string;
  checkCheckedBorder: string;
  checkUncheckedBorder: string;
  checkLabel: string;
  // Error
  errorText: string;
  // Success icons / text
  iconMailBg: string;
  iconMailBorder: string;
  iconMailColor: string;
  iconCheckBg: string;
  iconCheckBorder: string;
  iconCheckColor: string;
  successTitle: string;
  successBody: string;
}

function buildColors(theme: "dark" | "light"): AuthColors {
  if (theme === "light") {
    return {
      subtitle:            "rgba(91,58,20,0.72)",
      helperText:          "rgba(91,58,20,0.65)",
      footerText:          "rgba(91,58,20,0.5)",
      linkText:            "rgba(91,58,20,0.62)",
      iconColor:           "#92400e",
      dividerThin:         "rgba(146,100,30,0.22)",
      tabDivider:          "rgba(146,100,30,0.28)",
      tabActiveBg:         "rgba(146,64,14,0.1)",
      tabActiveBorder:     "#92400e",
      tabActiveText:       "#3b2407",
      tabInactiveText:     "rgba(91,58,20,0.5)",
      inputBg:             "rgba(200,160,80,0.1)",
      inputBorder:         "rgba(146,100,30,0.35)",
      inputIcon:           "rgba(91,58,20,0.45)",
      btnBg:               "#78350f",
      btnBgHover:          "#92400e",
      btnBorder:           "rgba(120,64,20,0.3)",
      btnText:             "#fef3c7",
      checkCheckedBg:      "#92400e",
      checkCheckedBorder:  "#b45309",
      checkUncheckedBorder:"rgba(146,100,30,0.45)",
      checkLabel:          "rgba(91,58,20,0.72)",
      errorText:           "#dc2626",
      iconMailBg:          "rgba(146,100,30,0.1)",
      iconMailBorder:      "rgba(146,100,30,0.25)",
      iconMailColor:       "#92400e",
      iconCheckBg:         "rgba(5,150,105,0.08)",
      iconCheckBorder:     "rgba(5,150,105,0.2)",
      iconCheckColor:      "#047857",
      successTitle:        "#3b2407",
      successBody:         "rgba(91,58,20,0.65)",
    };
  }

  // Dark mode — solid warm cream/stone values instead of opacity-mixed amber,
  // which produces muddy mid-brown when blended against the dark background.
  return {
    subtitle:            "#b08840",   // solid warm amber, L≈46% on near-black
    helperText:          "#a07838",   // slightly darker, readable muted
    footerText:          "#7a5a28",   // intentionally quiet footer
    linkText:            "#b89248",   // interactive warmth
    iconColor:           "#d97706",
    dividerThin:         "rgba(120,53,15,0.35)",
    tabDivider:          "rgba(120,53,15,0.38)",
    tabActiveBg:         "rgba(120,53,15,0.3)",
    tabActiveBorder:     "#d97706",
    tabActiveText:       "#e8d5a0",   // warm cream, high contrast
    tabInactiveText:     "#9a7838",   // solid mid-warm, clearly secondary
    inputBg:             "rgba(0,0,0,0.22)",
    inputBorder:         "rgba(120,53,15,0.45)",
    inputIcon:           "#9a7838",
    btnBg:               "#92400e",
    btnBgHover:          "#b45309",
    btnBorder:           "rgba(180,100,30,0.35)",
    btnText:             "#fef3c7",
    checkCheckedBg:      "#b45309",
    checkCheckedBorder:  "#d97706",
    checkUncheckedBorder:"rgba(180,120,40,0.45)",
    checkLabel:          "#c4a060",   // solid warm, clearly readable
    errorText:           "#f87171",
    iconMailBg:          "rgba(120,53,15,0.28)",
    iconMailBorder:      "rgba(146,64,14,0.4)",
    iconMailColor:       "#d97706",
    iconCheckBg:         "rgba(5,150,105,0.12)",
    iconCheckBorder:     "rgba(5,150,105,0.25)",
    iconCheckColor:      "#34d399",
    successTitle:        "#e8d5a0",
    successBody:         "#b49050",   // solid warm, readable
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const { user, loading, signIn, signUp, sendMagicLink } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const c = buildColors(theme);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  // Already authenticated — skip the auth screen.
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const resetMode = (next: AuthMode) => {
    setMode(next);
    setFieldError(null);
    setMagicSent(false);
    setSignUpDone(false);
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const validationKey = validateForm(email, password, mode);
    if (validationKey) {
      setFieldError(t(validationKey as Parameters<typeof t>[0]));
      return;
    }

    setSubmitting(true);

    if (mode === "magic") {
      const error = await sendMagicLink(email.trim());
      setSubmitting(false);
      if (error) toast.error(error.message);
      else setMagicSent(true);
      return;
    }

    if (mode === "signup") {
      const error = await signUp(email.trim(), password);
      setSubmitting(false);
      if (error) toast.error(error.message);
      else setSignUpDone(true);
      return;
    }

    // Sign in with password
    const error = await signIn(email.trim(), password, rememberMe);
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        setFieldError(t("incorrectCredentials"));
      } else if (msg.includes("email not confirmed")) {
        setFieldError(t("emailNotConfirmed"));
      } else {
        toast.error(error.message);
      }
    } else {
      localStorage.setItem(ONBOARDED_KEY, "1");
      navigate("/", { replace: true });
    }
  };

  const handleContinueLocal = () => {
    localStorage.setItem(ONBOARDED_KEY, "1");
    navigate("/", { replace: true });
  };

  const tabs: { id: AuthMode; label: string }[] = [
    { id: "signin", label: t("signIn") },
    { id: "signup", label: t("signUp") },
    { id: "magic", label: t("magicLinkTab") },
  ];

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{
          background: `linear-gradient(to bottom, var(--vibe-page-from), var(--vibe-page-via), var(--vibe-page-to))`,
        }}
      >
        <Loader2 className="animate-spin" style={{ color: c.iconColor }} size={24} />
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 pt-16 pb-12 transition-colors duration-300"
      style={{
        background: `linear-gradient(to bottom, var(--vibe-page-from), var(--vibe-page-via), var(--vibe-page-to))`,
      }}
    >
      {/* Fixed top-right controls — language + theme */}
      <AuthControls />

      <div className="w-full max-w-sm mx-auto">

        {/* ── Hero section ──────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Vinyl record — central identity element, always gently spinning */}
          <VinylRecord isSpinning={true} emoji="🎵" />

          {/* WELCOME label */}
          <p
            className="text-[10px] uppercase tracking-[0.6em] font-medium select-none mb-1.5"
            style={{ color: c.subtitle }}
          >
            {t("welcome")}
          </p>

          {/* VIBE MUSIC gradient title */}
          <div className="inline-flex items-center gap-2.5 mb-1.5">
            <Disc3 style={{ color: c.iconColor }} size={18} />
            <h1
              className="text-[28px] font-bold tracking-[0.3em] uppercase select-none"
              style={{
                background: `linear-gradient(180deg, var(--vibe-title-from), var(--vibe-title-to))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("vibeMusic")}
            </h1>
            <Disc3 style={{ color: c.iconColor }} size={18} />
          </div>

          {/* Subtitle */}
          <p
            className="text-[10px] uppercase tracking-[0.5em] font-medium select-none"
            style={{ color: c.subtitle }}
          >
            {t("vintageVibePlayer")}
          </p>

          {/* Decorative thin divider — separates hero from auth card */}
          <div
            className="mx-auto mt-5 h-px w-14 rounded-full"
            style={{ backgroundColor: c.dividerThin }}
            aria-hidden="true"
          />
        </div>

        {/* ── Auth card — CSS variables keep it in sync with the player ─────── */}
        <div
          className="w-full rounded-3xl overflow-hidden relative"
          style={{
            background: "var(--vibe-card-bg)",
            boxShadow: "var(--vibe-card-shadow)",
            border: "1px solid var(--vibe-card-border)",
          }}
        >
          {/* Subtle grain texture — same as the player card */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent, transparent 2px,
                var(--vibe-grain-color) 2px, var(--vibe-grain-color) 4px
              )`,
            }}
            aria-hidden="true"
          />

          {/* ── Tab bar ─────────────────────────────────────────────────────── */}
          <div
            className="relative z-10 flex"
            style={{ borderBottom: `1px solid ${c.tabDivider}` }}
            role="tablist"
          >
            {tabs.map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => resetMode(tab.id)}
                  className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all"
                  style={{
                    color:           active ? c.tabActiveText : c.tabInactiveText,
                    backgroundColor: active ? c.tabActiveBg  : "transparent",
                    borderBottom:    active
                      ? `2px solid ${c.tabActiveBorder}`
                      : "2px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <div className="relative z-10 p-7">

            {/* Magic-link sent confirmation */}
            {magicSent && (
              <div className="text-center py-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                  style={{
                    background: c.iconMailBg,
                    border: `1px solid ${c.iconMailBorder}`,
                  }}
                >
                  <Mail style={{ color: c.iconMailColor }} size={20} />
                </div>
                <p className="text-sm font-semibold" style={{ color: c.successTitle }}>
                  {t("magicLinkSent")}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: c.successBody }}>
                  {t("magicLinkInbox")}
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  className="text-[10px] uppercase tracking-widest pt-1 transition-colors hover:opacity-75"
                  style={{ color: c.linkText }}
                >
                  {t("tryAgain")}
                </button>
              </div>
            )}

            {/* Sign-up confirmation */}
            {signUpDone && (
              <div className="text-center py-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                  style={{
                    background: c.iconCheckBg,
                    border: `1px solid ${c.iconCheckBorder}`,
                  }}
                >
                  <Check style={{ color: c.iconCheckColor }} size={20} />
                </div>
                <p className="text-sm font-semibold" style={{ color: c.successTitle }}>
                  {t("accountCreated")}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: c.successBody }}>
                  {t("confirmEmailPrompt")}
                </p>
                <button
                  onClick={() => resetMode("signin")}
                  className="text-[10px] uppercase tracking-widest pt-1 transition-colors hover:opacity-75"
                  style={{ color: c.linkText }}
                >
                  {t("signIn")}
                </button>
              </div>
            )}

            {/* Auth form */}
            {!magicSent && !signUpDone && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Email */}
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: c.inputIcon }}
                    size={14}
                  />
                  <Input
                    type="email"
                    placeholder={t("email")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldError(null);
                    }}
                    autoComplete="email"
                    disabled={submitting}
                    // bg / border only — text colour is controlled by index.css global rules
                    className="text-sm h-10 pl-9 focus-visible:ring-1 focus-visible:ring-offset-0"
                    style={{
                      backgroundColor: c.inputBg,
                      borderColor:     c.inputBorder,
                    }}
                  />
                </div>

                {/* Password — hidden for magic-link mode */}
                {mode !== "magic" && (
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: c.inputIcon }}
                      size={14}
                    />
                    <Input
                      type="password"
                      placeholder={t("password")}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldError(null);
                      }}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      disabled={submitting}
                      className="text-sm h-10 pl-9 focus-visible:ring-1 focus-visible:ring-offset-0"
                      style={{
                        backgroundColor: c.inputBg,
                        borderColor:     c.inputBorder,
                      }}
                    />
                  </div>
                )}

                {/* Magic-link helper text */}
                {mode === "magic" && (
                  <p className="text-xs px-0.5" style={{ color: c.helperText }}>
                    {t("emailLoginHelper")}
                  </p>
                )}

                {/* Validation / server error */}
                {fieldError && (
                  <p
                    className="text-xs px-0.5 font-medium"
                    role="alert"
                    style={{ color: c.errorText }}
                  >
                    {fieldError}
                  </p>
                )}

                {/* Remember me — sign-in only */}
                {mode === "signin" && (
                  <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={rememberMe}
                      onClick={() => setRememberMe((v) => !v)}
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        backgroundColor: rememberMe
                          ? c.checkCheckedBg
                          : "transparent",
                        border: `1px solid ${
                          rememberMe
                            ? c.checkCheckedBorder
                            : c.checkUncheckedBorder
                        }`,
                      }}
                    >
                      {rememberMe && (
                        <Check className="text-white" size={10} strokeWidth={3} />
                      )}
                    </button>
                    <span
                      className="text-xs select-none"
                      style={{ color: c.checkLabel }}
                    >
                      {t("rememberMe")}
                    </span>
                  </label>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 text-xs font-bold uppercase tracking-widest transition-all mt-1 border"
                  style={{
                    backgroundColor: btnHovered ? c.btnBgHover : c.btnBg,
                    borderColor:     c.btnBorder,
                    color:           c.btnText,
                  }}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                >
                  {submitting && (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  )}
                  {mode === "signin"
                    ? t("signIn")
                    : mode === "signup"
                    ? t("signUp")
                    : t("sendMagicLink")}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <button
            onClick={handleContinueLocal}
            className="text-[10px] uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ color: c.linkText }}
          >
            {t("continueWithoutAccount")} →
          </button>
          <p
            className="text-[10px] tracking-wider"
            style={{ color: c.footerText }}
          >
            {t("craftedWithWarmth")}
          </p>
        </div>

      </div>
    </div>
  );
}
