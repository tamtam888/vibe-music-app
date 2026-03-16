import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

interface AuthControlsProps {
  /** When true, renders inline (no fixed positioning). Default: fixed top-right overlay. */
  inline?: boolean;
}

/**
 * Language and theme controls.
 * Use inline={true} to embed inside a layout section.
 * Default (no prop) renders as fixed top-right overlay.
 */
export default function AuthControls({ inline = false }: AuthControlsProps) {
  const { lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  // Active = currently selected state
  const active: React.CSSProperties = isDark
    ? {
        color: "#e8d5a0",
        backgroundColor: "rgba(120,53,15,0.48)",
        borderColor: "rgba(212,160,86,0.38)",
      }
    : {
        color: "#3b2407",
        backgroundColor: "rgba(146,64,14,0.12)",
        borderColor: "rgba(146,100,30,0.48)",
      };

  // Inactive = available but not selected
  const inactive: React.CSSProperties = isDark
    ? {
        color: "rgba(220,190,140,0.52)",
        backgroundColor: "rgba(0,0,0,0.1)",
        borderColor: "rgba(120,53,15,0.18)",
      }
    : {
        color: "rgba(91,58,20,0.52)",
        backgroundColor: "rgba(200,160,80,0.06)",
        borderColor: "rgba(146,100,30,0.18)",
      };

  const dividerBg = isDark
    ? "rgba(120,53,15,0.28)"
    : "rgba(146,100,30,0.2)";

  const base =
    "px-2.5 py-[5px] rounded-md border text-[10px] font-semibold tracking-wide transition-all " +
    "flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 select-none";

  return (
    <div
      className={inline ? "flex items-center justify-center gap-1" : "fixed top-3 right-3 z-50 flex items-center gap-1"}
      dir="ltr"
      aria-label="Language and theme controls"
    >
      {/* Language */}
      <button
        className={base}
        style={lang === "en" ? active : inactive}
        onClick={() => setLang("en")}
        aria-label="Switch to English"
        aria-pressed={lang === "en"}
      >
        English
      </button>
      <button
        className={base}
        style={lang === "he" ? active : inactive}
        onClick={() => setLang("he")}
        aria-label="Switch to Hebrew"
        aria-pressed={lang === "he"}
      >
        עברית
      </button>

      {/* Divider */}
      <span
        className="h-3 w-px mx-0.5 flex-shrink-0"
        style={{ backgroundColor: dividerBg }}
        aria-hidden="true"
      />

      {/* Theme */}
      <button
        className={base}
        style={theme === "dark" ? active : inactive}
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark mode"
        aria-pressed={theme === "dark"}
      >
        <Moon size={9} />
        Dark
      </button>
      <button
        className={base}
        style={theme === "light" ? active : inactive}
        onClick={() => setTheme("light")}
        aria-label="Switch to light mode"
        aria-pressed={theme === "light"}
      >
        <Sun size={9} />
        Light
      </button>
    </div>
  );
}
