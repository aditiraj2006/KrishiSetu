import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
      className="
p-2
rounded-md
border
transition-colors
duration-200

text-black
border-gray-400
hover:bg-gray-100

dark:text-white
dark:border-gray-500
dark:bg-transparent
dark:hover:bg-gray-800
dark:hover:border-gray-400

focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-green-500
focus-visible:ring-offset-2
"
    >
      {theme === "dark" ? <Moon size={20} /> : <Sun size={18} />}
    </button>
  );
}