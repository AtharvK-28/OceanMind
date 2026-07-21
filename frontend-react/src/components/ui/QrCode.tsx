"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders an offline, self-contained QR (no external QR service) as a data-URL
// image. Encodes whatever URL/text is passed — used for catch-to-plate provenance.
export default function QrCode({ value, size = 120 }: { value: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: "#16323a", light: "#ffffff" } })
      .then((u) => { if (alive) setUrl(u); })
      .catch(() => {});
    return () => { alive = false; };
  }, [value, size]);

  return (
    <span className="inline-block bg-white rounded-lg p-1.5 border border-card-border" style={{ width: size + 12, height: size + 12 }}>
      {url
        ? <img src={url} width={size} height={size} alt="Scan for catch provenance" />
        : <span className="block bg-card-hover animate-pulse rounded" style={{ width: size, height: size }} />}
    </span>
  );
}
