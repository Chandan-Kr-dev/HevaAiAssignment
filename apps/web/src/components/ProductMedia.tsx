"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type Ref } from "react";

type ProductMediaProps = {
  imageUrl: string;
  name: string;
  modelSrc?: string;
  modelAlt?: string;
};

type ViewState = "poster" | "loading-model" | "model" | "unavailable";

// Poster-first media: the next/image poster is always server-rendered exactly
// as before (same width/height/sizes/aspect box, so LCP and SEO are
// untouched). The model-viewer library AND the .glb are fetched only after
// the user clicks "View in 3D" — initial page loads never touch them.
export function ProductMedia({
  imageUrl,
  name,
  modelSrc,
  modelAlt,
}: ProductMediaProps) {
  const [view, setView] = useState<ViewState>("poster");
  // Initializer (not an effect) so SSR/first paint never hides anything;
  // the change-listener below only reacts to later OS-level toggles.
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [libFailed, setLibFailed] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);
  // Guards a race: if the user goes "Back to photo" while the library is
  // still downloading, the late import must not yank the viewer back.
  const requestId = useRef(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Attach model load/error listeners imperatively: model-viewer exposes them
  // as DOM events, not React props.
  useEffect(() => {
    if (view !== "model" || !viewerRef.current) {
      return;
    }
    const el = viewerRef.current;
    const onLoad = () => setView("model");
    const onError = () => setView("unavailable");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [view]);

  const show3D = async () => {
    const id = requestId.current + 1;
    requestId.current = id;
    setView("loading-model");
    try {
      // Lazy by design: the library downloads only on explicit click.
      await import("@google/model-viewer");
      if (requestId.current === id) {
        setView("model");
      }
    } catch {
      if (requestId.current === id) {
        setLibFailed(true);
        setView("unavailable");
      }
    }
  };

  const showPoster = () => {
    requestId.current += 1;
    setView("poster");
  };

  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {view === "model" && !libFailed ? (
          // Same box, full-bleed viewer: zero layout shift on swap. The
          // poster attribute keeps the photo visible until the model loads.
          <model-viewer
            ref={viewerRef as unknown as Ref<HTMLElement>}
            src={modelSrc}
            alt={modelAlt ?? name}
            camera-controls
            auto-rotate={!reducedMotion}
            shadow-intensity="1"
            environment-image="neutral"
            exposure="1"
            ar
            ar-modes="webxr scene-viewer quick-look"
            poster={imageUrl}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Image
            src={imageUrl}
            alt={name}
            width={800}
            height={800}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-auto w-full"
            priority
          />
        )}
      </div>
      {view === "loading-model" ? (
        <p aria-live="polite" className="mt-3 text-sm text-zinc-400">
          Loading 3D view…
        </p>
      ) : null}
      {modelSrc ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {view === "poster" || view === "unavailable" ? (
            <button
              type="button"
              onClick={() => void show3D()}
              aria-pressed="false"
              className="inline-flex min-h-[44px] items-center rounded-full border border-violet-400/40 bg-violet-400/10 px-5 text-sm font-medium text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              View in 3D
            </button>
          ) : (
            <button
              type="button"
              onClick={showPoster}
              aria-pressed="true"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              Back to photo
            </button>
          )}
          <p className="text-xs text-zinc-500">Drag to rotate, pinch to zoom</p>
        </div>
      ) : null}
      {view === "unavailable" || libFailed ? (
        <p role="alert" className="mt-2 text-sm text-amber-200">
          3D view unavailable — showing photo instead.
        </p>
      ) : null}
    </div>
  );
}
