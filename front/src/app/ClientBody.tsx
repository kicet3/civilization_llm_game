"use client";

import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased bg-gradient-to-b from-[#223151] to-[#0e151f] text-white min-h-screen";
  }, []);

  return (
    <>
      {children}
    </>
  );
}