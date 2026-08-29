"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  from?: "up" | "left" | "right";
};

export function LandingReveal({ children, className = "", delayMs = 0, from = "up" }: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const revealIfVisible = (entry?: IntersectionObserverEntry) => {
      const rect = node.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (entry?.isIntersecting || inView) {
        setVisible(true);
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (revealIfVisible(entry)) {
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(node);
    if (revealIfVisible()) {
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = { transitionDelay: `${delayMs}ms` };

  return (
    <div
      ref={ref}
      className={`landing-reveal landing-reveal--${from}${visible ? " is-in" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
