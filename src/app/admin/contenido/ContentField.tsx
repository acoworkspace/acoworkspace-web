"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface TextFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (val: string) => Promise<void>;
}

export function TextField({ label, value: initial, multiline, onSave }: TextFieldProps) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-neutral-500 uppercase tracking-widest">{label}</label>
        {saved && <span className="text-xs text-green-400">✓ Guardado</span>}
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              autoFocus
              className="w-full bg-neutral-800 border border-neutral-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 resize-none"
            />
          ) : (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="w-full bg-neutral-800 border border-neutral-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400"
            />
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => { setValue(initial); setEditing(false); }}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}
          className="w-full text-left bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 rounded-lg px-3 py-2.5 text-sm text-neutral-300 transition-all group-hover:border-neutral-700">
          <span className="line-clamp-2">{value || <span className="text-neutral-600 italic">Vacío — click para editar</span>}</span>
        </button>
      )}
    </div>
  );
}

interface ImageFieldProps {
  label: string;
  currentUrl: string;
  currentPosition?: string;
  storagePath: string;
  /** CSS aspect-ratio for the crop preview, e.g. "16/9" or "4/3" */
  aspect?: string;
  onSave: (url: string) => Promise<void>;
  onSavePosition?: (pos: string) => Promise<void>;
}

export function ImageField({
  label,
  currentUrl,
  currentPosition = "50% 50%",
  storagePath,
  aspect = "16/9",
  onSave,
  onSavePosition,
}: ImageFieldProps) {
  const [preview, setPreview] = useState(currentUrl);
  const [cacheBust, setCacheBust] = useState("");
  const [position, setPosition] = useState(currentPosition);
  const [pendingPosition, setPendingPosition] = useState(currentPosition);
  const [uploading, setUploading] = useState(false);
  const [imgSaved, setImgSaved] = useState(false);
  const [posSaved, setPosSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  // Parse percentages for display
  const [px, py] = pendingPosition.split(" ").map((v) => parseFloat(v) ?? 50);

  const handleFile = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("path", storagePath);

    const res = await fetch("/api/admin/content/upload", { method: "POST", body: form });
    const data = await res.json();

    if (data.url) {
      const bust = `?t=${Date.now()}`;
      setPreview(data.url);
      setCacheBust(bust);
      await onSave(data.url);
      setImgSaved(true);
      setTimeout(() => setImgSaved(false), 2500);
    }
    setUploading(false);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!cropRef.current) return;

    const rect = cropRef.current.getBoundingClientRect();
    const isTouch = "touches" in e;
    const startClientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const startClientY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Snapshot current percentages at drag start
    const [startPx, startPy] = pendingPosition.split(" ").map((v) => parseFloat(v) ?? 50);

    const onMove = (me: MouseEvent | TouchEvent) => {
      const clientX = "touches" in me ? me.touches[0].clientX : (me as MouseEvent).clientX;
      const clientY = "touches" in me ? me.touches[0].clientY : (me as MouseEvent).clientY;
      // Dragging right → image moves right → see more left → X decreases
      const dx = ((clientX - startClientX) / rect.width) * 100;
      const dy = ((clientY - startClientY) / rect.height) * 100;
      const newPx = Math.max(0, Math.min(100, startPx - dx));
      const newPy = Math.max(0, Math.min(100, startPy - dy));
      setPendingPosition(`${Math.round(newPx)}% ${Math.round(newPy)}%`);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const handleSavePosition = async () => {
    if (!onSavePosition) return;
    setPosition(pendingPosition);
    await onSavePosition(pendingPosition);
    setPosSaved(true);
    setTimeout(() => setPosSaved(false), 2500);
  };

  const hasChanges = pendingPosition !== position;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-neutral-500 uppercase tracking-widest">{label}</label>
        <div className="flex gap-3">
          {posSaved && <span className="text-xs text-green-400">✓ Encuadre guardado</span>}
          {imgSaved && <span className="text-xs text-green-400">✓ Imagen guardada</span>}
        </div>
      </div>

      {/* Crop preview — drag to pan */}
      <div
        ref={cropRef}
        className={`relative rounded-xl overflow-hidden border border-neutral-700 select-none ${preview ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
        style={{ aspectRatio: aspect }}
        onMouseDown={preview ? handleDragStart : undefined}
        onTouchStart={preview ? handleDragStart : undefined}
        onClick={preview ? undefined : () => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={`${preview}${cacheBust}`}
            alt={label}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: pendingPosition }}
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex flex-col items-center justify-center gap-2 cursor-pointer"
            onClick={() => inputRef.current?.click()}>
            <span className="text-2xl">+</span>
            <span className="text-neutral-500 text-sm">Subir imagen</span>
          </div>
        )}

        {/* Drag hint overlay */}
        {preview && (
          <div className="absolute inset-0 pointer-events-none flex items-end justify-start p-2">
            <span className="text-white/40 text-xs bg-black/30 rounded px-1.5 py-0.5 select-none">
              Arrastrá para reencuadrar
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {preview && (
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
          >
            Cambiar imagen
          </button>

          {onSavePosition && (
            <button
              onClick={handleSavePosition}
              disabled={!hasChanges}
              className="ml-auto px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-30 transition-opacity"
              style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
            >
              Guardar encuadre
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

interface PillsFieldProps {
  label: string;
  value: string; // newline-separated
  onSave: (val: string) => Promise<void>;
}

export function PillsField({ label, value: initial, onSave }: PillsFieldProps) {
  const [items, setItems] = useState<string[]>(
    initial ? initial.split("\n").filter(Boolean) : []
  );
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const persist = async (next: string[]) => {
    setSaving(true);
    await onSave(next.join("\n"));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const add = async () => {
    const trimmed = input.trim();
    if (!trimmed || items.includes(trimmed)) return;
    const next = [...items, trimmed];
    setItems(next);
    setInput("");
    await persist(next);
  };

  const remove = async (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    await persist(next);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(i, 0, moved);
    dragIndex.current = i;
    setItems(next);
  };
  const handleDragEnd = () => { dragIndex.current = null; persist(items); };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-neutral-500 uppercase tracking-widest">{label}</label>
        {saving && <span className="text-xs text-neutral-500">Guardando...</span>}
        {saved && !saving && <span className="text-xs text-green-400">✓ Guardado</span>}
      </div>
      <p className="text-neutral-600 text-xs mb-2">Arrastrá para reordenar · × para eliminar</p>

      {/* Pills existentes */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-8">
        {items.length === 0 && (
          <span className="text-xs text-neutral-600 italic">Sin items — agregá uno abajo</span>
        )}
        {items.map((item, i) => (
          <span key={item + i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-full px-3 py-1.5 cursor-grab active:cursor-grabbing select-none hover:border-neutral-500 transition-colors">
            <span className="text-neutral-600 text-xs mr-0.5">⠿</span>
            {item}
            <button
              onClick={() => remove(i)}
              className="text-neutral-500 hover:text-red-400 transition-colors ml-0.5 leading-none"
              title="Eliminar"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input para agregar */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nuevo item... (Enter para agregar)"
          className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-30 transition-opacity"
          style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
        >
          + Agregar
        </button>
      </div>
    </div>
  );
}

// ─── GalleryField ────────────────────────────────────────────────────────────

export interface GalleryItem { url: string; position: string; }

interface GalleryFieldProps {
  label: string;
  items: GalleryItem[];
  storagePath: (index: number) => string;
  onSaveItem: (index: number, url: string, position: string) => Promise<void>;
  onReorder: (items: GalleryItem[]) => Promise<void>;
}

export function GalleryField({ label, items: initial, storagePath, onSaveItem, onReorder }: GalleryFieldProps) {
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const MAX = 6;

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleFile = async (file: File, index: number) => {
    setUploading(index);
    const form = new FormData();
    form.append("file", file);
    form.append("path", storagePath(index));
    const res = await fetch("/api/admin/content/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) {
      const bust = `?t=${Date.now()}`;
      const next = [...items];
      while (next.length <= index) next.push({ url: "", position: "50% 50%" });
      next[index] = { ...next[index], url: data.url + bust };
      setItems(next);
      await onSaveItem(index, data.url, next[index].position);
      flashSaved();
    }
    setUploading(null);
  };

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(i, 0, moved);
    dragIndex.current = i;
    setItems(next);
  };
  const handleDragEnd = async () => {
    dragIndex.current = null;
    await onReorder(items);
    flashSaved();
  };

  const slots = Array.from({ length: Math.max(MAX, items.filter(i => i.url).length + 1) }).slice(0, MAX);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-neutral-500 uppercase tracking-widest">{label}</label>
        {saved && <span className="text-xs text-green-400">✓ Guardado</span>}
      </div>
      <p className="text-neutral-600 text-xs mb-3">Arrastrá para reordenar · Click para subir</p>

      <div className="grid grid-cols-3 gap-3">
        {slots.map((_, i) => {
          const item = items[i];
          const hasImg = !!item?.url;
          return (
            <div
              key={i}
              draggable={hasImg}
              onDragStart={() => hasImg && handleDragStart(i)}
              onDragOver={(e) => hasImg && handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`relative rounded-xl overflow-hidden border bg-neutral-800 cursor-pointer group ${
                hasImg ? "border-neutral-700 cursor-grab active:cursor-grabbing" : "border-dashed border-neutral-700 hover:border-neutral-500"
              }`}
              style={{ aspectRatio: "4/3" }}
              onClick={() => inputRefs.current[i]?.click()}
            >
              {hasImg ? (
                <>
                  <img src={item.url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-medium">Reemplazar</span>
                  </div>
                  <div className="absolute top-1.5 left-1.5 bg-black/50 rounded text-white text-xs px-1.5 py-0.5 pointer-events-none">
                    {i + 1}
                  </div>
                </>
              ) : uploading === i ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <span className="text-neutral-600 text-xl">+</span>
                  <span className="text-neutral-600 text-xs">Foto {i + 1}</span>
                </div>
              )}
              <input
                ref={el => { inputRefs.current[i] = el; }}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
