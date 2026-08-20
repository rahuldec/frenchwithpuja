import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "French with Puja | Class Recordings",
  description: "Access French class recordings by topic.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
