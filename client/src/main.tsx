import { ThemeProvider } from "./components/theme-provider";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>);
