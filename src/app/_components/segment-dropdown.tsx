"use client";

import { useState, useEffect } from "react";
import { CaretDown } from "@phosphor-icons/react";

type Seg = "employers" | "lawgroups" | "insurers";

const LABELS: Record<Seg, string> = {
  employers: "for employers",
  lawgroups: "for law groups",
  insurers: "for insurers",
};

export function SegmentDropdown() {
  const [seg, setSeg] = useState<Seg>("employers");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-seg-drop]")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" data-seg-drop>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        style={{
          color: "rgba(255,255,255,0.8)",
          background: open ? "rgba(255,255,255,0.18)" : "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "rgba(255,255,255,0.18)" : "transparent")}
      >
        {LABELS[seg]}
        <CaretDown
          size={12}
          weight="bold"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden py-1"
          style={{
            background: "#fff",
            border: "1px solid #ccdaec",
            boxShadow: "0 8px 24px rgba(13,37,64,0.15)",
            minWidth: "160px",
            zIndex: 100,
          }}
        >
          {(Object.keys(LABELS) as Seg[]).map((s) => (
            <button
              key={s}
              onClick={() => { setSeg(s); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{
                background: s === seg ? "#EEF0FF" : "transparent",
                color: s === seg ? "#3040F5" : "#3a4070",
                fontWeight: s === seg ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (s !== seg) e.currentTarget.style.background = "#F5F6FF"; }}
              onMouseLeave={(e) => { if (s !== seg) e.currentTarget.style.background = "transparent"; }}
            >
              {LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
