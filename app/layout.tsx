import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "French with Puja | Learn, Practise, Progress",
  description: "Access French class recordings by topic and learn at your own pace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
