"use client";

import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle,
  File,
  Paperclip,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";

import { api } from "@/trpc/react";

interface UploadScannerProps {
  caseId: string;
  caseHash: string;
  token: string;
}

const MAX_BYTES = 20 * 1024 * 1024;

async function prepareFile(
  file: File,
): Promise<{ contentBase64: string; filename: string }> {
  if (file.type === "application/pdf") {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return { contentBase64: btoa(bin), filename: file.name };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 2000 / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({
        contentBase64: dataUrl.split(",")[1]!,
        filename: file.name.replace(/\.[^.]+$/, ".jpg"),
      });
    };
    img.src = objectUrl;
  });
}

function Bracket({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const size = 22;
  const thickness = 1.5;
  const color = "#c89a3f";
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
  };
  const pos: React.CSSProperties =
    position === "tl"
      ? { top: -1, left: -1, borderTop: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }
      : position === "tr"
      ? { top: -1, right: -1, borderTop: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }
      : position === "bl"
      ? { bottom: -1, left: -1, borderBottom: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }
      : { bottom: -1, right: -1, borderBottom: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` };
  return <div aria-hidden style={{ ...base, ...pos }} />;
}

type State = "idle" | "preview" | "uploading" | "success";

export function UploadScanner({ caseId, caseHash, token }: UploadScannerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<State>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  const upload = api.document.upload.useMutation();
  const consume = api.intake.consumeHandoff.useMutation();

  function handleFile(f: File) {
    setError(null);
    if (f.size > MAX_BYTES) {
      setError("File must be under 20 MB.");
      return;
    }
    setFile(f);
    setIsPdf(f.type === "application/pdf");
    setPreview(URL.createObjectURL(f));
    setState("preview");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setState("uploading");
    try {
      const { contentBase64, filename } = await prepareFile(file);
      await upload.mutateAsync({ caseId, filename, contentBase64 });
      await consume.mutateAsync({ token, caseId });
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setState("preview");
    }
  }

  return (
    <div
      style={{ backgroundColor: "#0e0d0c", minHeight: "100svh", color: "#ede5d0" }}
      className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-12"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 40% at 50% 45%, rgba(200,154,63,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Wordmark */}
      <p
        className="font-[family-name:var(--font-heading)] absolute left-0 right-0 top-6 text-center text-sm font-bold tracking-[0.15em]"
        style={{ color: "#3a3632" }}
      >
        gett
      </p>

      {state === "idle" && (
        <div className="flex w-full max-w-[17rem] flex-col items-center">
          {/* Document frame */}
          <div
            className="relative mb-8 flex items-center justify-center"
            style={{
              width: 224,
              height: 290,
              backgroundColor: "#131210",
              border: "1px solid #1e1d1b",
            }}
          >
            <Bracket position="tl" />
            <Bracket position="tr" />
            <Bracket position="bl" />
            <Bracket position="br" />

            {/* Scan line animation */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(200,154,63,0.18), transparent)",
                animation: "scanline 3s ease-in-out infinite",
              }}
            />

            <div className="flex flex-col items-center gap-2 text-center">
              <Camera size={28} style={{ color: "#3a3632" }} weight="light" />
              <p
                className="text-[0.75rem] leading-snug"
                style={{ color: "#4a4642" }}
              >
                Position your document
                <br />
                within the frame
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="mb-3 flex w-full items-center justify-center gap-2 py-3.5 text-[0.8125rem] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#c89a3f", color: "#0e0d0c", letterSpacing: "0.04em" }}
          >
            <Camera size={15} weight="bold" />
            Capture with camera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 border py-3.5 text-[0.8125rem] transition-colors hover:border-[#3a3632]"
            style={{
              borderColor: "#2a2825",
              color: "#6a6358",
              backgroundColor: "transparent",
            }}
          >
            <Paperclip size={14} />
            Attach a file
          </button>

          {error && (
            <div
              className="mt-4 flex items-center gap-2 text-[0.75rem]"
              style={{ color: "#c0392b" }}
            >
              <WarningCircle size={13} />
              {error}
            </div>
          )}
        </div>
      )}

      {state === "preview" && (
        <div className="flex w-full max-w-[17rem] flex-col items-center">
          {/* Preview area */}
          <div
            className="relative mb-6 flex items-center justify-center overflow-hidden"
            style={{
              width: 224,
              height: 290,
              backgroundColor: "#131210",
              border: "1px solid #1e1d1b",
            }}
          >
            <Bracket position="tl" />
            <Bracket position="tr" />
            <Bracket position="bl" />
            <Bracket position="br" />

            {isPdf ? (
              <div className="flex flex-col items-center gap-2">
                <File size={36} style={{ color: "#c89a3f" }} weight="light" />
                <p
                  className="max-w-[10rem] truncate text-center text-[0.75rem]"
                  style={{ color: "#6a6358" }}
                >
                  {file?.name}
                </p>
              </div>
            ) : (
              preview && (
                <img
                  src={preview}
                  alt="Document preview"
                  className="h-full w-full object-cover"
                />
              )
            )}
          </div>

          {error && (
            <div
              className="mb-4 flex items-center gap-2 text-[0.75rem]"
              style={{ color: "#c0392b" }}
            >
              <WarningCircle size={13} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            className="mb-3 flex w-full items-center justify-center gap-2 py-3.5 text-[0.8125rem] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#c89a3f", color: "#0e0d0c", letterSpacing: "0.04em" }}
          >
            Upload this document →
          </button>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setPreview(null);
              setFile(null);
              setError(null);
              if (cameraRef.current) cameraRef.current.value = "";
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="w-full py-3 text-[0.8125rem] transition-colors"
            style={{ color: "#4a4642" }}
          >
            ← Retake
          </button>
        </div>
      )}

      {state === "uploading" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <SpinnerGap
            size={36}
            style={{ color: "#c89a3f", animation: "spin 1s linear infinite" }}
          />
          <div className="space-y-1">
            <p
              className="font-[family-name:var(--font-heading)] text-base font-semibold"
              style={{ color: "#ede5d0" }}
            >
              Uploading securely…
            </p>
            <p className="text-[0.8125rem]" style={{ color: "#4a4642" }}>
              Do not close this tab.
            </p>
          </div>
        </div>
      )}

      {state === "success" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <CheckCircle size={48} style={{ color: "#c89a3f" }} weight="light" />
          <div className="space-y-2">
            <p
              className="font-mono text-[0.6875rem] tracking-widest"
              style={{ color: "#4a4642" }}
            >
              {caseHash}
            </p>
            <p
              className="font-[family-name:var(--font-heading)] text-xl font-bold"
              style={{ color: "#ede5d0" }}
            >
              Document received.
            </p>
            <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#6a6358" }}>
              Your lawyer has been notified.
              <br />
              You can close this tab.
            </p>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Keyframe styles */}
      <style>{`
        @keyframes scanline {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
