"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { SPECIES_OPTIONS } from "@/lib/constants";
import type { CVAnalyzeResponse } from "@/types/api";

export interface DetectedSpecies {
  common: string;
  sci: string;
  aphia: number;
  confidence: number;
}

/**
 * Photo → species identification, shared by every surface a fisher can report a
 * catch from (Fisher View, Community Catch, Catch Ledger). The vision model is
 * the fastest path to a correct species name for someone on a boat — typing a
 * scientific name on a wet phone is not realistic.
 *
 * `onDetect` fires with the identification so the parent can pre-fill its form;
 * the parent still owns the actual ledger write.
 */
export default function CatchPhotoScan({
  lat,
  lon,
  onDetect,
  compact = false,
}: {
  lat: number;
  lon: number;
  onDetect: (d: DetectedSpecies) => void;
  compact?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detected, setDetected] = useState<DetectedSpecies | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setDetected(null);
    setErr(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = (reader.result as string).split(",")[1];
        const res = await apiPost<CVAnalyzeResponse>("/api/v1/cv/analyze", {
          site_lat: lat,
          site_lon: lon,
          image_base64: b64,
        });
        const id = res.identification;
        if (id) {
          const d: DetectedSpecies = {
            common: id.species_common,
            sci: id.species_scientific,
            aphia: id.aphia_id,
            confidence: id.confidence,
          };
          setDetected(d);
          onDetect(d);
        } else {
          setErr("No fish detected — pick the species manually below.");
        }
      } catch {
        setErr("Couldn't reach the vision model — pick the species manually below.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }

  // Whether the detected species maps onto a species we can write to the ledger.
  const known = detected
    ? Object.keys(SPECIES_OPTIONS).some((s) => s.toLowerCase().startsWith(detected.common.toLowerCase().slice(0, 6)))
    : false;

  return (
    <div className={compact ? "" : "mb-4"}>
      <div className="flex items-start gap-3">
        <label
          className="flex-none cursor-pointer rounded-xl border border-dashed border-card-border bg-card-hover
                     hover:border-accent/50 hover:bg-[#eaf3ef] transition-colors flex flex-col items-center
                     justify-center text-center"
          style={{ width: compact ? 84 : 104, height: compact ? 84 : 104 }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Catch" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <>
              <i className="ph ph-camera text-[22px] text-accent" />
              <span className="text-[10px] text-text-muted mt-1 px-2 leading-tight">Scan photo</span>
            </>
          )}
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        </label>

        <div className="flex-1 min-w-0 pt-0.5">
          {analyzing ? (
            <div className="flex items-center gap-2 text-[12.5px] text-text-muted">
              <i className="ph ph-circle-notch animate-spin text-[14px] text-accent" />
              Identifying species…
            </div>
          ) : detected ? (
            <div className="animate-data-enter">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-semibold text-text">{detected.common}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: detected.confidence >= 0.75 ? "#eaf3ef" : "#f7efdb",
                    color: detected.confidence >= 0.75 ? "#2f6f4c" : "#8f6516",
                  }}
                >
                  {Math.round(detected.confidence * 100)}% confident
                </span>
              </div>
              <div className="text-[11.5px] italic text-text-muted mt-0.5">{detected.sci}</div>
              <div
                className="text-[10.5px] text-text-faint mt-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                WoRMS AphiaID {detected.aphia}
              </div>
              {!known && (
                <div className="text-[11px] text-[#8f6516] mt-1.5 leading-snug">
                  Not one of the four species this demo ledger accepts — pick the closest below.
                </div>
              )}
            </div>
          ) : err ? (
            <div className="text-[12px] text-[#8f6516] leading-snug">{err}</div>
          ) : (
            <div className="text-[12px] text-text-muted leading-snug">
              Photograph the catch and the vision model names the species, its scientific name and its
              WoRMS AphiaID — then it goes on the ledger.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
