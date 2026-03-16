import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  /* Light mode: active = dark brown, inactive = muted brown
     Dark mode:  active = bright amber, inactive = muted amber */
  const activeStyle = theme === "light"
    ? { color: "#3b2407", backgroundColor: "rgba(180,140,60,0.25)", borderColor: "rgba(146,100,30,0.5)" }
    : { color: "#fff3c4", backgroundColor: "rgba(146,64,14,0.6)", borderColor: "rgba(180,120,40,0.5)" };

  const inactiveStyle = theme === "light"
    ? { color: "#7a4b16", backgroundColor: "rgba(200,170,100,0.12)", borderColor: "rgba(146,100,30,0.25)" }
    : { color: "rgba(251,191,36,0.55)", backgroundColor: "rgba(30,20,10,0.3)", borderColor: "rgba(120,53,15,0.3)" };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setTheme("dark")}
        className="p-1 rounded-l-md text-[10px] transition-all border flex items-center gap-0.5"
        style={theme === "dark" ? activeStyle : inactiveStyle}
        title="Dark"
      >
        <Moon size={10} />
      </button>
      <button
        onClick={() => setTheme("light")}
        className="p-1 rounded-r-md text-[10px] transition-all border flex items-center gap-0.5"
        style={theme === "light" ? activeStyle : inactiveStyle}
        title="Light"
      >
        <Sun size={10} />
      </button>
    </div>
  );
};

export default ThemeToggle;
