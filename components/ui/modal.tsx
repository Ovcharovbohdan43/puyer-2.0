"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeOnOverlay?: boolean;
  size?: "md" | "lg" | "full";
  header?: React.ReactNode;
};

export function Modal({
  open,
  title,
  onClose,
  children,
  closeOnOverlay = true,
  size = "md",
  header,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const widthClass =
    size === "full" ? "max-w-5xl" : size === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={() => {
          if (closeOnOverlay) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white shadow-[0px_10px_25px_-5px_rgba(15,23,42,0.1)] ${widthClass} ${header ? "p-0" : "p-6"}`}
      >
        {header}
        <div className={header ? "p-6" : undefined}>
          <h2 id="modal-title" className="text-[24px] font-semibold leading-8 text-black">
            {title}
          </h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
