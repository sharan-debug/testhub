
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="group w-9 h-9 flex items-center justify-center
                 text-slate-500 dark:text-zinc-400
                 bg-white dark:bg-zinc-950
                 border border-slate-200 dark:border-zinc-800
                 rounded-lg
                 hover:bg-slate-50 dark:hover:bg-zinc-900
                 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                 active:scale-95
                 transition-all duration-200 ease-in-out"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:rotate-12" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:-rotate-12" />
      )}
    </button>
  );
}
