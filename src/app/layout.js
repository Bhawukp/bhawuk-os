import { Geist, Geist_Mono } from "next/font/google";
import { flags, siteUrl } from "@/config/flags";
import { profile } from "@/content/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: `${profile.name} — ${profile.role}`,
  description: profile.summary,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: `${profile.role} · ${profile.tagline}`,
    type: "website",
  },
};

export const viewport = {
  themeColor: "#07060b",
  colorScheme: "dark",
};

// Runs before paint: skip the boot for repeat visits and reduced-motion users.
const bootScript = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem("bp-booted")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-booted","1")}else{sessionStorage.setItem("bp-booted","1")}}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      data-booted={flags.bootSequence ? undefined : "1"}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
