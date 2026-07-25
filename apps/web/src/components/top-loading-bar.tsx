"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When path or params change, finish progress bar
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (target.target === "_blank") return;

      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(href, window.location.href);

      if (currentUrl.origin === targetUrl.origin && currentUrl.pathname !== targetUrl.pathname) {
        setLoading(true);
        setProgress(30);
      }
    };

    const anchors = document.querySelectorAll("a[href]");
    anchors.forEach((a) => a.addEventListener("click", handleAnchorClick as EventListener));

    return () => {
      anchors.forEach((a) => a.removeEventListener("click", handleAnchorClick as EventListener));
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      aria-label="Loading page"
      className="top-loading-bar-container"
    >
      <div
        className="top-loading-bar-fill"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 0.2s ease, opacity 0.3s ease 0.1s" : "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
