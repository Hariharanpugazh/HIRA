import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "HIRA - Hiring Intelligence and Ranking Assistant",
  description: "AI-powered hiring platform for intelligent candidate ranking and analysis"
};

const themeBootScript = `
(() => {
  try {
    const root = document.documentElement;
    const raw = localStorage.getItem("cashewnut.dashboard.state.v2");
    const parsed = raw ? JSON.parse(raw) : null;
    const settings = parsed?.settings?.interface ?? {};
    const savedTheme = settings.theme || "dark";
    const resolvedTheme =
      savedTheme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : savedTheme;
    root.dataset.theme = resolvedTheme;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.contrast = settings.highContrastMode ? "high" : "normal";
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.contrast = "normal";
  }
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      data-contrast="normal"
      className={outfit.className}
    >
      <body className={`${GeistSans.variable} min-h-screen font-sans antialiased`}>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  );
}