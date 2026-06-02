"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Loader2, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  saving?: boolean;
  onSave: (blob: Blob) => void;
}

/** Lightweight canvas signature pad (pointer/touch). Exports a PNG blob. */
export function SignaturePad({ saving, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Match backing resolution to displayed size for crisp lines.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0f172a";
    }
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setDirty(true);
  }

  function end() {
    drawing.current = false;
    last.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !dirty) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-40 w-full touch-none rounded-md border border-input bg-white"
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={saving}>
          <Eraser className="h-4 w-4" aria-hidden />
          Очистити
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <PenLine className="h-4 w-4" aria-hidden />
          )}
          Зберегти підпис
        </Button>
      </div>
    </div>
  );
}
