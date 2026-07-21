"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

export default function PitchPage() {
  const [slide, setSlide] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [selectedCell, setSelectedCell] = useState("Gujarat-01");
  const [micState, setMicState] = useState<"idle" | "listening" | "transcribing" | "speaking">("idle");
  const [voiceText, setVoiceText] = useState("");

  const slides = [
    // Slide 1: Hook
    {
      title: "The 4:00 AM Dilemma",
      subtitle: "A traditional fisher looking out at the Arabian Sea",
      content: (
        <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#9fe0d6]/10 text-[#9fe0d6] flex items-center justify-center mb-8 border border-[#9fe0d6]/20 animate-pulse">
            <i className="ph ph-wave-sine text-[32px]" />
          </div>
          <p className="text-[28px] md:text-[34px] leading-relaxed text-[#f3f8f6] font-medium" style={serif}>
            &ldquo;Will I come home alive today, where do I find fish without burning all my diesel, and will the buyers give me a fair price?&rdquo;
          </p>
          <div className="h-[1px] w-24 bg-white/20 my-8" />
          <p className="text-sm tracking-[0.2em] text-[#9fe0d6] uppercase font-bold" style={mono}>
            Kochi Harbor · 4:00 AM
          </p>
        </div>
      ),
    },
    // Slide 2: Problem
    {
      title: "The Reality Gap",
      subtitle: "Traditional fishers vs. complex oceanographic telemetry",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto h-full items-center px-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-[#e0a94f] text-[36px] font-bold mb-2">7 Million</div>
            <h4 className="text-[16px] font-bold text-white mb-2">Small-scale Fishers</h4>
            <p className="text-[13px] text-[#cfe6e2] leading-relaxed">
              Operating boats under 12 meters without satellite internet, expensive sonar, or digital charts.
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-accent text-[36px] font-bold mb-2">15% Drop</div>
            <h4 className="text-[16px] font-bold text-white mb-2">Catch Productivity (CPUE)</h4>
            <p className="text-[13px] text-[#cfe6e2] leading-relaxed">
              Warming Arabian Sea waters disrupt seasonal fish routes, forcing boats further offshore.
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="text-accent text-[36px] font-bold mb-2">25% Spike</div>
            <h4 className="text-[16px] font-bold text-white mb-2">Diesel Fuel Consumption</h4>
            <p className="text-[13px] text-[#cfe6e2] leading-relaxed">
              Fishers travel further and search longer blindly, shrinking profit margins below 15%.
            </p>
          </div>
        </div>
      ),
    },
    // Slide 3: Safety & Advisory
    {
      title: "Safety-First Marine Advisory",
      subtitle: "Translating live Open-Meteo sea states into safe return actions",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 max-w-4xl mx-auto items-center px-4">
          {/* Mock Mobile View */}
          <div className="bg-[#10333b] border border-white/10 rounded-[32px] p-4 shadow-2xl relative overflow-hidden" style={{ height: "380px" }}>
            <div className="w-20 h-4 bg-black rounded-full mx-auto mb-4" />
            <div className="space-y-4">
              <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#e74c3c]" style={mono}>Sea Alert</span>
                <div className="text-[18px] font-bold text-white mt-0.5">AVOID ADVISORY</div>
                <p className="text-[9px] text-[#cfe6e2] mt-1">Wind gusts exceeding 28 knots near coastal shelf.</p>
              </div>
              <div className="bg-white/[0.05] rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-[10px] text-[#cfe6e2]">
                  <span>Wave Height:</span>
                  <span className="text-white font-bold">2.8m (Rough)</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#cfe6e2]">
                  <span>Monsoon Ban:</span>
                  <span className="text-white font-bold">ACTIVE</span>
                </div>
              </div>
              <button onClick={() => setSosActive(!sosActive)}
                className={`w-full py-3 rounded-xl font-bold text-[12px] transition-all duration-300 ${sosActive ? "bg-[#e74c3c] text-white animate-pulse" : "bg-red-600/20 text-[#e74c3c] border border-[#e74c3c]/30"}`}>
                <i className="ph-fill ph-warning-octagon mr-1.5" />
                {sosActive ? "SOS BROADCASTING..." : "ACTIVATE SOS"}
              </button>
            </div>
          </div>
          {/* Slide Description */}
          <div className="space-y-4">
            <h3 className="text-[20px] font-bold text-white">Live Sea State & Geofencing</h3>
            <ul className="space-y-3 text-[14px] text-[#cfe6e2]">
              <li className="flex items-start gap-2.5">
                <i className="ph ph-check text-accent text-[18px] mt-0.5" />
                <span>**GO/CAUTION/AVOID** computed live from Open-Meteo wind, wave, and temperature data.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="ph ph-check text-accent text-[18px] mt-0.5" />
                <span>**Geofenced Boundary Warnings** to prevent maritime border violations and marine sanctuary intrusion.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="ph ph-check text-accent text-[18px] mt-0.5" />
                <span>**One-Tap Offline SOS** that packs GPS coordinates into an SMS buffer for coast guard delivery under low signal.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    // Slide 4: SFZ
    {
      title: "Sustainable Fishing Zones (SFZ)",
      subtitle: "XGBoost classifier + SHAP explainability for smarter fishing",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center px-4">
          {/* Interactive Grid Mockup */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <h4 className="text-[12px] font-bold tracking-wider uppercase text-[#9fe0d6]" style={mono}>Regional Shelf Grid</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Gujarat-01", class: "GREEN" },
                { id: "Gujarat-02", class: "AMBER" },
                { id: "Gujarat-03", class: "RED" },
              ].map((c) => (
                <button key={c.id} onClick={() => setSelectedCell(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${selectedCell === c.id ? "bg-[#16434c] border-accent" : "bg-white/[0.03] border-white/5"}`}>
                  <div className="text-[11px] text-[#cfe6e2] font-semibold">{c.id}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.class === "GREEN" ? "#3a8c5f" : c.class === "AMBER" ? "#d49a2e" : "#e74c3c" }} />
                    <span className="text-[10px] font-bold text-white">{c.class}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* Cell parameters */}
            <div className="bg-white/[0.03] rounded-xl p-3 text-[11px] grid grid-cols-3 gap-2" style={mono}>
              <div>SST: <span className="text-white font-bold">{selectedCell === "Gujarat-01" ? "26.4°C" : selectedCell === "Gujarat-02" ? "28.1°C" : "29.8°C"}</span></div>
              <div>Chlorophyll: <span className="text-white font-bold">{selectedCell === "Gujarat-01" ? "0.42" : selectedCell === "Gujarat-02" ? "0.22" : "0.08"}</span></div>
              <div>Bycatch: <span className="text-white font-bold">{selectedCell === "Gujarat-01" ? "Low" : selectedCell === "Gujarat-02" ? "Med" : "High"}</span></div>
            </div>
          </div>
          {/* Slide Description & SHAP */}
          <div className="space-y-4">
            <h3 className="text-[20px] font-bold text-white">Explainable AI (XGBoost + SHAP)</h3>
            <p className="text-[13px] text-[#cfe6e2] leading-relaxed">
              We replace standard black-box fish predictors. Our classifier grades fishing zones and shows the exact contributors behind each recommendation:
            </p>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-[#cfe6e2] mb-1">
                  <span>Sea Surface Temp Anomaly (SST)</span>
                  <span className="text-white font-bold" style={mono}>{selectedCell === "Gujarat-01" ? "+45% (Favorable)" : "-15% (Warm)"}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: selectedCell === "Gujarat-01" ? "85%" : selectedCell === "Gujarat-02" ? "40%" : "15%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-[#cfe6e2] mb-1">
                  <span>Chlorophyll Concentrations</span>
                  <span className="text-white font-bold" style={mono}>{selectedCell === "Gujarat-01" ? "+30% (Favorable)" : "-5% (Low)"}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: selectedCell === "Gujarat-01" ? "70%" : selectedCell === "Gujarat-02" ? "35%" : "10%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 5: Voice
    {
      title: "Bhashini Voice Interface",
      subtitle: "Translating voice commands into live RAG telemetry",
      content: (
        <div className="flex flex-col items-center justify-center max-w-2xl mx-auto h-full text-center px-4">
          <button
            onClick={() => {
              if (micState === "idle") {
                setMicState("listening");
                setVoiceText("Listening...");
                setTimeout(() => {
                  setMicState("transcribing");
                  setVoiceText('"गुजरात के पास समुद्री स्वास्थ्य कैसा है?"');
                  setTimeout(() => {
                    setMicState("speaking");
                    setVoiceText("Response: 'गुजरात तट पर औसत समुद्री स्वास्थ्य सूचकांक (MHI) 84 है। यह क्षेत्र मछली पकड़ने के लिए पूरी तरह से अनुकूल है।'");
                  }, 2000);
                }, 2000);
              } else {
                setMicState("idle");
                setVoiceText("");
              }
            }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border transition-all duration-300 ${
              micState === "listening"
                ? "bg-[#e74c3c] border-[#e74c3c]/30 animate-pulse text-white scale-110"
                : micState === "transcribing"
                ? "bg-[#e0a94f] border-[#e0a94f]/30 text-[#16323a] scale-105"
                : micState === "speaking"
                ? "bg-accent border-accent/30 text-[#16323a] scale-105"
                : "bg-[#16434c] border-[#9fe0d6]/20 text-[#9fe0d6] hover:bg-[#1a4f59]"
            }`}
          >
            <i className={`ph ${micState === "speaking" ? "ph-speaker-high" : "ph-microphone"} text-[28px]`} />
          </button>
          <div className="h-6 mb-4 text-[#9fe0d6] font-bold text-xs uppercase tracking-widest" style={mono}>
            {micState === "idle" && "Tap to talk"}
            {micState === "listening" && "Recording input..."}
            {micState === "transcribing" && "Bhashini Transcribing..."}
            {micState === "speaking" && "RAG Telemetry Response"}
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 min-h-[90px] w-full max-w-lg flex items-center justify-center text-white text-[14px]">
            {voiceText || "Speak in Hindi, Tamil, or Malayalam (e.g. 'Gujarat ke paas marine health kaisa hai?')" }
          </div>
        </div>
      ),
    },
    // Slide 6: Provenance & Blockchain
    {
      title: "Catch-to-Plate Blockchain Provenance",
      subtitle: "Confirming and writing catch events onto a SHA-256 ledger",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto h-full items-center px-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <i className="ph ph-camera text-[36px] text-accent mb-2" />
            <h4 className="text-[13px] font-bold text-white mb-1">1. Photo Upload</h4>
            <p className="text-[10.5px] text-[#cfe6e2]">Fisher snaps a landing photo at the auction floor.</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <i className="ph ph-brain text-[36px] text-accent mb-2" />
            <h4 className="text-[13px] font-bold text-white mb-1">2. Species Vision ID</h4>
            <p className="text-[10.5px] text-[#cfe6e2]">ResNet50 identifies species and gets global WoRMS AphiaID.</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <i className="ph ph-shield-check text-[36px] text-accent mb-2" />
            <h4 className="text-[13px] font-bold text-white mb-1">3. Blockchain Ledger</h4>
            <p className="text-[10.5px] text-[#cfe6e2]">SHA-256 ledger seals coordinates, vessel, and timestamp.</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <i className="ph ph-qr-code text-[36px] text-accent mb-2" />
            <h4 className="text-[13px] font-bold text-white mb-1">4. QR Catch Certificate</h4>
            <p className="text-[10.5px] text-[#cfe6e2]">Consumer scans package QR code to trace catch to origin.</p>
          </div>
        </div>
      ),
    },
    // Slide 7: Exporter Console
    {
      title: "Exporter B2B Compliance",
      subtitle: "Converting blockchain ledger blocks into Customs-ready audit certificates",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 max-w-4xl mx-auto items-center px-4">
          {/* Mock Certificate */}
          <div className="bg-white text-text p-5 rounded-xl shadow-2xl relative text-[10px] space-y-3">
            <div className="flex justify-between items-center border-b pb-2 border-card-border">
              <div className="font-bold text-[#16434c] uppercase tracking-wider text-[9px]" style={mono}>OceanMind Provenance</div>
              <span className="bg-[#3a8c5f]/10 text-[#3a8c5f] font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">Compliant</span>
            </div>
            <div className="space-y-1">
              <div>Vessel: <span className="font-semibold">IND-KL-02-1402 (M.V. Karunya)</span></div>
              <div>Catch ID: <span className="font-semibold">OM_CATCH_2026_07_21</span></div>
              <div>Species: <span className="font-semibold" style={serif}>Rastrelliger kanagurta (Indian Mackerel)</span></div>
              <div>Origin: <span className="font-semibold">09°48'N, 75°33'E (Malabar Shelf)</span></div>
            </div>
            <div className="border-t pt-2 border-card-border flex justify-between items-center">
              <div>Hash: <span className="font-mono text-[7.5px] text-text-muted">c9bd7a3d8e3...</span></div>
              <i className="ph ph-qr-code text-[24px] text-text" />
            </div>
          </div>
          {/* Slide Description */}
          <div className="space-y-4">
            <h3 className="text-[20px] font-bold text-white">The Exporter Business Model</h3>
            <ul className="space-y-3 text-[14px] text-[#cfe6e2]">
              <li className="flex items-start gap-2.5">
                <i className="ph ph-currency-inr text-accent text-[18px] mt-0.5" />
                <span>**₹100 Per Catch Certificate:** Seafood exporters pay per certificate generated for EU/US exports.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="ph ph-shield text-accent text-[18px] mt-0.5" />
                <span>**Compliance Auditing:** Eliminates manual paper trails, saving exporters time and protecting them from cargo rejections.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <i className="ph ph-chart-line-up text-accent text-[18px] mt-0.5" />
                <span>**High Retention:** Secure compliance records and historical chain-of-custody data create high switching costs.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    // Slide 8: Scaled Impact
    {
      title: "Scaled Regional Impact",
      subtitle: "The Gujarat coastline case study & financial projection",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto h-full items-center px-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-[#9fe0d6] text-[40px] font-bold mb-2">₹25.6 Crore</div>
            <h4 className="text-[15px] font-bold text-white mb-2">Annual Fuel Savings</h4>
            <p className="text-[12px] text-[#cfe6e2] leading-relaxed">
              If just 10% of Gujarat's 30,000-vessel fleet saves 5 litres of diesel per fishing trip.
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-[#9fe0d6] text-[40px] font-bold mb-2">₹150 Crore</div>
            <h4 className="text-[15px] font-bold text-white mb-2">Additional Export Revenue</h4>
            <p className="text-[12px] text-[#cfe6e2] leading-relaxed">
              Unlocked by a 5% sustainability price premium on certified fish exports.
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-[#e0a94f] text-[40px] font-bold mb-2">₹0.00</div>
            <h4 className="text-[15px] font-bold text-white mb-2">Cost to Fishers</h4>
            <p className="text-[12px] text-[#cfe6e2] leading-relaxed">
              Platform is 100% free to fishers, subsidized entirely by the B2B exporter transactions.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = useCallback(() => setSlide((prev) => Math.min(prev + 1, slides.length - 1)), [slides.length]);
  const prevSlide = useCallback(() => setSlide((prev) => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-between p-6 select-none"
      style={{ background: "linear-gradient(160deg, #10333b 0%, #0c2a30 50%, #081e22 100%)" }}>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="ph ph-wave-sine text-[22px] text-accent" />
          <span className="text-[14px] font-bold tracking-[0.15em] text-[#f3f8f6] uppercase" style={mono}>OceanMind</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#9fe0d6] font-bold" style={mono}>
            Slide {slide + 1} of {slides.length}
          </span>
          <Link href="/" className="text-[11px] border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg px-3 py-1.5 transition">
            Exit Deck
          </Link>
        </div>
      </div>

      {/* Slide Body */}
      <div className="flex-1 my-6 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h2 className="text-[28px] md:text-[36px] font-bold text-white tracking-tight" style={serif}>{slides[slide].title}</h2>
          <p className="text-[13px] md:text-[14px] text-accent tracking-wide mt-1">{slides[slide].subtitle}</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {slides[slide].content}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center border-t border-white/5 pt-4">
        <button onClick={prevSlide} disabled={slide === 0}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white/50 hover:text-white disabled:opacity-20 transition">
          <i className="ph ph-arrow-left text-[14px]" /> Previous
        </button>
        {/* Progress Bar */}
        <div className="flex-1 mx-8 h-[2px] bg-white/5 rounded-full overflow-hidden max-w-md hidden sm:block">
          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${((slide + 1) / slides.length) * 100}%` }} />
        </div>
        <button onClick={nextSlide} disabled={slide === slides.length - 1}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:brightness-110 disabled:opacity-20 transition">
          Next <i className="ph ph-arrow-right text-[14px]" />
        </button>
      </div>
    </div>
  );
}
