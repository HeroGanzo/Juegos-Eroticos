"use client";

import { useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaPlus, FaTimes, FaUpload } from "react-icons/fa";
import { btnSecondary, inputCls, labelCls } from "@/lib/ui";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

export function MediaInput({
  label,
  value,
  onChange,
  accept = "image/*",
  placeholder,
  hint,
  preview = "image",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accept?: string;
  placeholder?: string;
  hint?: string;
  preview?: "image" | "none";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadFile(file));
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "https://... o sube un archivo"}
          className={inputCls}
        />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={cn(btnSecondary, "shrink-0 px-3")}>
          <FaUpload /> <span className="hidden sm:inline">{busy ? "Subiendo..." : "Subir"}</span>
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className={cn(btnSecondary, "shrink-0 px-3")} title="Quitar">
            <FaTimes />
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onFile} />
      </div>
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
      {err && <p className="mt-1.5 text-xs text-red-400">{err}</p>}
      {value && preview === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-3 max-h-44 rounded-xl border border-white/10 bg-black/40 object-contain" />
      )}
    </div>
  );
}

export function GalleryInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setErr("");
    const added: string[] = [];
    for (const f of files) {
      try {
        added.push(await uploadFile(f));
      } catch (er) {
        setErr(er instanceof Error ? er.message : "Error al subir");
      }
    }
    onChange([...value, ...added]);
    setBusy(false);
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    onChange([...value, u]);
    setUrl("");
  };

  return (
    <div>
      <label className={labelCls}>Galería de fotos ({value.length})</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/70 p-1 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="rounded-md p-1.5 text-xs text-white hover:bg-white/20" title="Mover a la izquierda">
                <FaArrowLeft />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded-md p-1.5 text-xs text-red-300 hover:bg-white/20" title="Quitar">
                <FaTimes />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="rounded-md p-1.5 text-xs text-white hover:bg-white/20" title="Mover a la derecha">
                <FaArrowRight />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid aspect-video place-items-center rounded-xl border-2 border-dashed border-white/15 text-sm text-zinc-400 transition hover:border-brand hover:text-white"
        >
          <span className="flex flex-col items-center gap-1.5">
            <FaUpload /> {busy ? "Subiendo..." : "Subir fotos"}
          </span>
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="O pega la URL de una imagen y pulsa Añadir"
          className={inputCls}
        />
        <button type="button" onClick={addUrl} className={cn(btnSecondary, "shrink-0")}>
          <FaPlus /> Añadir
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
      {err && <p className="mt-1.5 text-xs text-red-400">{err}</p>}
    </div>
  );
}
