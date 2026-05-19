import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intern Online Exam Portal",
  description: "Secure online exam portal for intern hiring"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
