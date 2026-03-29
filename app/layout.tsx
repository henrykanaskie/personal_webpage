import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import PhotographyBackground from "@/components/PhotographyBackground";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-elevated",
});

export const metadata: Metadata = {
  title: "Henry Kanaskie",
  description: "Machine learning engineer and photographer based in Salem, Oregon. I build software that makes a real difference and capture the world as I find it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  document.documentElement.classList.add('dark');
                }
                // Prevent white flash on photography routes before React hydrates
                try {
                  var path = window.location.pathname || "";
                  if (path.indexOf("/photography") === 0) {
                    var bg = prefersDark ? "#050507" : "#f8f5f0";
                    document.documentElement.classList.add('photography-boot');
                    document.documentElement.style.backgroundColor = bg;
                    document.body.style.backgroundColor = bg;
                    document.body.style.backgroundImage = "none";
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${dmSans.className} ${spaceGrotesk.variable}`}>
        <PhotographyBackground />
        <div className="w-full">
          <Header />
          <main className="px-3 pt-10 md:pt-0">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </body>
    </html>
  );
}
