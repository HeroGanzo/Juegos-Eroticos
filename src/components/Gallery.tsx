"use client";

import { useCallback, useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i === null ? null : (i + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, go]);

  if (!count) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-zinc-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} - imagen ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
          </button>
        ))}
      </div>

      {index !== null && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={`${title} - imagen ${index + 1}`}
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
            onClick={() => setIndex(null)}
          >
            <FaTimes />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
              >
                <FaChevronRight />
              </button>
            </>
          )}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-zinc-300">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </>
  );
}
