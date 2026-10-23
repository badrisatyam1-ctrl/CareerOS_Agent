import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "CareerOS — Autonomous Career & Open-Source Operations",
  description: "Personal career operations and open-source contribution assistant for Badri Vishal Pandey.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#f8fafc] text-slate-900 flex min-h-screen font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DemoBanner />
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
