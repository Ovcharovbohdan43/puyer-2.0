"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { floodClearBackground } from "@/lib/invoices/logo-bg";
import { clampLogoScale, LOGO_SCALE_MAX, LOGO_SCALE_MIN } from "@/lib/invoices/logo";
import { t } from "@/lib/i18n";

const FRAME = 280;
const EXPORT = 512;

type LogoEditorProps = {
  open: boolean;
  source: File | string | null;
  scale: number;
  onClose: () => void;
  onApply: (blob: Blob, scale: number) => void;
};

function sourceKey(source: File | string): string {
  return source instanceof File ? `file:${source.name}:${source.size}:${source.lastModified}` : source;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = src.startsWith("http") ? "anonymous" : null;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the image."));
    image.src = src;
  });
}

async function imageToCanvas(image: HTMLImageElement): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not edit the image.");
  }
  ctx.drawImage(image, 0, 0);
  return canvas;
}

export function LogoEditor({ open, source, scale, onClose, onApply }: LogoEditorProps) {
  if (!open || !source) {
    return null;
  }
  return (
    <LogoEditorSession
      key={sourceKey(source)}
      source={source}
      scale={scale}
      onClose={onClose}
      onApply={onApply}
    />
  );
}

function LogoEditorSession({
  source,
  scale,
  onClose,
  onApply,
}: {
  source: File | string;
  scale: number;
  onClose: () => void;
  onApply: (blob: Blob, scale: number) => void;
}) {
  const copy = t("builder");
  const [working, setWorking] = useState<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [nextScale, setNextScale] = useState(() => clampLogoScale(scale));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let revoked = "";
    const src = source instanceof File ? URL.createObjectURL(source) : source;
    if (source instanceof File) {
      revoked = src;
    }
    void loadImage(src)
      .then(imageToCanvas)
      .then((canvas) => {
        if (cancelled) {
          return;
        }
        setWorking(canvas);
        setPreviewUrl(canvas.toDataURL("image/png"));
      })
      .catch(() => {
        if (!cancelled) {
          setError(copy.logoReadFailed);
        }
      });
    return () => {
      cancelled = true;
      if (revoked) {
        URL.revokeObjectURL(revoked);
      }
    };
  }, [copy.logoReadFailed, source]);

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) {
      return;
    }
    setPan({
      x: drag.current.panX + (event.clientX - drag.current.x),
      y: drag.current.panY + (event.clientY - drag.current.y),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const removeBackground = useCallback(() => {
    if (!working) {
      return;
    }
    const ctx = working.getContext("2d");
    if (!ctx) {
      return;
    }
    const image = ctx.getImageData(0, 0, working.width, working.height);
    const cleared = floodClearBackground(image.data, working.width, working.height);
    if (!cleared) {
      setError(copy.logoBgFailed);
      return;
    }
    ctx.putImageData(image, 0, 0);
    setPreviewUrl(working.toDataURL("image/png"));
    setError("");
  }, [copy.logoBgFailed, working]);

  const apply = useCallback(async () => {
    if (!working || busy) {
      return;
    }
    setBusy(true);
    try {
      const out = document.createElement("canvas");
      out.width = EXPORT;
      out.height = EXPORT;
      const ctx = out.getContext("2d");
      if (!ctx) {
        throw new Error(copy.logoReadFailed);
      }
      const cover = Math.max(EXPORT / working.width, EXPORT / working.height) * zoom;
      const drawW = working.width * cover;
      const drawH = working.height * cover;
      const panScale = EXPORT / FRAME;
      ctx.clearRect(0, 0, EXPORT, EXPORT);
      ctx.drawImage(
        working,
        (EXPORT - drawW) / 2 + pan.x * panScale,
        (EXPORT - drawH) / 2 + pan.y * panScale,
        drawW,
        drawH,
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        out.toBlob((next) => (next ? resolve(next) : reject(new Error(copy.logoReadFailed))), "image/png");
      });
      onApply(blob, clampLogoScale(nextScale));
    } catch {
      setError(copy.logoReadFailed);
    } finally {
      setBusy(false);
    }
  }, [busy, copy.logoReadFailed, onApply, nextScale, pan.x, pan.y, working, zoom]);

  return (
    <Modal open title={copy.logoEditorTitle} onClose={onClose} size="lg" closeOnOverlay={!busy}>
      <p className="text-[14px] leading-5 text-puyer-muted">{copy.logoPngHint}</p>
      <div
        className="relative mx-auto mt-4 h-[280px] w-[280px] cursor-grab overflow-hidden rounded-lg border border-[#e2e8f0] active:cursor-grabbing"
        style={{
          backgroundColor: "#f8fafc",
          backgroundImage:
            "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {previewUrl && working ? (
          // PNG alpha + blob/data URLs: next/image is the wrong tool here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            draggable={false}
            src={previewUrl}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              width: working.width,
              height: working.height,
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${Math.max(FRAME / working.width, FRAME / working.height) * zoom})`,
            }}
          />
        ) : (
          <p className="flex h-full items-center justify-center text-[13px] text-puyer-muted">
            {error ? copy.logoEmpty : copy.logoLoading}
          </p>
        )}
      </div>
      <label className="mt-4 flex flex-col gap-1 text-[14px] font-medium text-[#0b1c30]">
        {copy.logoCrop}
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      <label className="mt-3 flex flex-col gap-1 text-[14px] font-medium text-[#0b1c30]">
        {copy.logoSize}
        <input
          type="range"
          min={LOGO_SCALE_MIN}
          max={LOGO_SCALE_MAX}
          step={1}
          value={nextScale}
          onChange={(event) => setNextScale(Number(event.target.value))}
        />
        <span className="text-[12px] font-normal text-puyer-muted">{nextScale}%</span>
      </label>
      {error ? <p className="mt-3 text-[13px] text-[#b91c1c]">{error}</p> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#0b1c30]"
          onClick={removeBackground}
          disabled={!working || busy}
        >
          {copy.logoRemoveBg}
        </button>
        <button
          type="button"
          className="ml-auto rounded border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#0b1c30]"
          onClick={onClose}
          disabled={busy}
        >
          {copy.logoCancel}
        </button>
        <button
          type="button"
          className="rounded bg-[#006c49] px-3 py-2 text-[14px] font-semibold text-white disabled:opacity-60"
          onClick={() => void apply()}
          disabled={!working || busy}
        >
          {busy ? copy.logoApplying : copy.logoApply}
        </button>
      </div>
    </Modal>
  );
}
