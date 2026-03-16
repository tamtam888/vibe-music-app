import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  const { theme } = useTheme();

  const activeStyle = theme === "light"
    ? { color: "#3b2407", backgroundColor: "rgba(180,140,60,0.25)", borderColor: "rgba(146,100,30,0.5)" }
    : { color: "#fff3c4", backgroundColor: "rgba(146,64,14,0.6)", borderColor: "rgba(180,120,40,0.5)" };

  const inactiveStyle = theme === "light"
    ? { color: "#7a4b16", backgroundColor: "rgba(200,170,100,0.12)", borderColor: "rgba(146,100,30,0.25)" }
    : { color: "rgba(251,191,36,0.55)", backgroundColor: "rgba(30,20,10,0.3)", borderColor: "rgba(120,53,15,0.3)" };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setLang("en")}
        className="px-2 py-0.5 rounded-l-md text-[10px] font-bold uppercase tracking-wider transition-all border"
        style={lang === "en" ? activeStyle : inactiveStyle}
      >
        EN
      </button>
      <button
        onClick={() => setLang("he")}
        className="px-2 py-0.5 rounded-r-md text-[10px] font-bold uppercase tracking-wider transition-all border"
        style={lang === "he" ? activeStyle : inactiveStyle}
      >
        HE
      </button>
    </div>
  );
};

export default LanguageToggle;
