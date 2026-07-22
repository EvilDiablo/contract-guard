import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContractGuard — catch breaking API changes before production",
  description:
    "Semantic JSON/API payload diff engine for GitHub PRs, CLI, and staging captures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main>
          <nav className="nav">
            <a className="brand" href="/">
              contractguard
            </a>
            <div className="nav-links">
              <a href="/pricing">Pricing</a>
              <a href="/dashboard">Dashboard</a>
              <a href="https://github.com" rel="noreferrer">
                GitHub
              </a>
            </div>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
