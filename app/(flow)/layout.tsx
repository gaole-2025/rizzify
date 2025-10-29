"use client";

import FunctionalHeader from "@/components/stage1/Header";
import { ReactNode } from "react";

export default function FlowLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-light">
      <FunctionalHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-20 md:pt-24">
        {children}
      </main>
    </div>
  );
}
