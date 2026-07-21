"use client";
import { useState } from "react";
import { apiPost, apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import TabGroup from "@/components/ui/TabGroup";

export default function AlertsPage() {
  const [tab, setTab] = useState("subscribe");
  const { toast } = useToast();

  const [subForm, setSubForm] = useState({ phone: "", device_token: "", language: "en", alert_types: ["zone_change", "mhw", "cyclone"] });
  const [subResult, setSubResult] = useState<Record<string, unknown> | null>(null);
  const [subError, setSubError] = useState("");
  const [showDevOpts, setShowDevOpts] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault(); setSubError("");
    if (!subForm.phone && !subForm.device_token) { setSubError("Enter your mobile number to get alerts."); return; }
    const res = await apiPost<Record<string, unknown>>("/api/v1/alerts/subscribe", {
      phone: subForm.phone || null, device_token: subForm.device_token || null,
      language: subForm.language, alert_types: subForm.alert_types,
    });
    setSubResult(res);
    toast(`Subscribed! ID: ${res.sub_id}`, "success");
  }

  const [demoResult, setDemoResult] = useState<Record<string, unknown> | null>(null);

  async function triggerDemo() {
    const res = await apiGet<Record<string, unknown>>("/api/v1/alerts/trigger-demo");
    setDemoResult(res);
    toast("Demo zone-change alert fired!", "info");
  }

  const alertTypes = ["zone_change", "mhw", "cyclone", "mhi_threshold"];
  const ALERT_TYPE_LABELS: Record<string, string> = {
    zone_change: "Zone change",
    mhw: "Marine heatwave",
    cyclone: "Cyclone",
    mhi_threshold: "MHI threshold",
  };

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Alerts & Subscriptions"
        description="The subscription registry is live — zone-change events are computed server-side. SMS delivery (Twilio), FCM push, and Bhashini voice are <b>wired into the code but not yet sending</b> — that's the next milestone. Target: &lt; 60s delivery."
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-stagger">
        <MetricCard label="Alert Channels" value="2" icon="ph ph-broadcast" delta="SMS + Push (planned)" deltaColor="amber" />
        <MetricCard label="Languages" value="3" icon="ph ph-translate" delta="EN · HI · TA" deltaColor="green" />
        <MetricCard label="Alert Types" value="4" icon="ph ph-bell-ringing" delta="Zone · MHW · Cyclone · MHI" deltaColor="amber" />
        <MetricCard label="Delivery Target" value="<60s" icon="ph ph-timer" delta="Design target · not yet measured" deltaColor="amber" />
      </div>

      <TabGroup tabs={[
        { id: "subscribe", label: "Subscribe" },
        { id: "demo", label: "Demo Alert" },
        { id: "pipeline", label: "Pipeline" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "subscribe" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <form onSubmit={handleSubscribe} className="space-y-4">
            <label className="block"><span className="text-xs text-text-muted">Mobile number</span>
              <input type="tel" inputMode="tel" value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-faint" />
              <span className="block mt-1 text-[11px] text-text-faint">Include your country code (e.g. +91 for India). We&apos;ll text zone and weather alerts here.</span></label>
            <label className="block"><span className="text-xs text-text-muted">Language</span>
              <select value={subForm.language} onChange={(e) => setSubForm({ ...subForm, language: e.target.value })}
                className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2.5 text-sm text-text">
                <option value="en">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option>
              </select></label>
            <div>
              <span className="text-xs text-text-muted">Alert Types</span>
              <div className="flex flex-wrap gap-3 mt-2">
                {alertTypes.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <input type="checkbox" checked={subForm.alert_types.includes(t)}
                      onChange={(e) => setSubForm({ ...subForm, alert_types: e.target.checked ? [...subForm.alert_types, t] : subForm.alert_types.filter((x) => x !== t) })}
                      className="accent-[#1f7a8c]" />
                    {ALERT_TYPE_LABELS[t] ?? t}
                  </label>
                ))}
              </div>
            </div>
            {/* Developer option — a raw Firebase push token. Hidden by default so
                the everyday subscribe flow stays a single field: your number. */}
            <div>
              <button type="button" onClick={() => setShowDevOpts((v) => !v)}
                className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-accent transition-colors">
                <i className={`ph ${showDevOpts ? "ph-caret-down" : "ph-caret-right"}`} style={{ fontSize: 12 }} />
                Advanced (push notifications)
              </button>
              {showDevOpts && (
                <label className="block mt-2"><span className="text-xs text-text-muted">FCM device token (optional)</span>
                  <input type="text" value={subForm.device_token} onChange={(e) => setSubForm({ ...subForm, device_token: e.target.value })}
                    placeholder="Firebase Cloud Messaging token…"
                    className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-faint" />
                  <span className="block mt-1 text-[11px] text-text-faint">For app-based push instead of SMS. Most users can leave this empty.</span></label>
              )}
            </div>
            {subError && <p className="text-[#c25a44] text-sm">{subError}</p>}
            <button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2">
              <i className="ph ph-bell-ringing" style={{ fontSize: 16 }} /> Subscribe
            </button>
            {subResult && (
              <div className="bg-zone-green-bg border border-[#cfe6dd] rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 flex-none rounded-full bg-[#3a8c5f]/15 text-[#2f6f4c] flex items-center justify-center">
                  <i className="ph-fill ph-check-circle" style={{ fontSize: 22 }} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#2f6f4c]">Subscribed successfully</div>
                  <div className="text-[12px] text-text-muted mt-1">ID: {String(subResult.sub_id)} · Language: {String(subResult.language)}</div>
                </div>
              </div>
            )}
          </form>

          {/* Alert preview mockup */}
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Alert preview</div>
            <div className="bg-white border border-card-border rounded-2xl p-5 space-y-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
              {/* SMS preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <i className="ph ph-chat-circle-text text-[15px] text-accent" />
                  <span className="text-[10px] tracking-[0.08em] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>SMS</span>
                </div>
                <div className="bg-card-hover rounded-xl p-3.5 text-[12.5px] text-text-secondary leading-relaxed border border-card-border">
                  <span className="font-semibold text-text">OceanMind Alert:</span> Veraval Bank zone changed from AMBER → RED. High bycatch risk detected. Avoid this zone this week.
                </div>
              </div>
              {/* Push preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <i className="ph ph-device-mobile text-[15px] text-accent" />
                  <span className="text-[10px] tracking-[0.08em] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>PUSH NOTIFICATION</span>
                </div>
                <div className="bg-[#16323a] rounded-xl p-3.5 text-[12px] leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ph ph-wave-sine text-[13px] text-[#9fe0d6]" />
                    <span className="text-[10px] text-white/60 font-medium">OceanMind</span>
                    <span className="text-[10px] text-white/35 ml-auto">now</span>
                  </div>
                  <div className="text-white/90 font-medium text-[12.5px]">Zone Change Alert</div>
                  <div className="text-white/55 text-[11.5px] mt-0.5">Veraval Bank → RED. Avoid fishing.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "demo" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-[13.5px] text-text-secondary leading-relaxed">
              Simulates the full event pipeline: INCOIS SST update triggers SFZ reclassification,
              which fires an alert to all subscribed fishers in the affected zone.
            </p>
            <button onClick={triggerDemo} className="bg-accent hover:bg-accent-dark text-white rounded-xl px-6 py-3 font-semibold transition-colors flex items-center gap-2">
              <i className="ph ph-lightning" style={{ fontSize: 17 }} /> Fire Demo Zone-Change Alert
            </button>
            {demoResult && (
              <div className="bg-zone-amber-bg border border-[#ecddb8] rounded-xl p-5 space-y-3 animate-data-enter">
                <div className="flex items-center gap-2">
                  <i className="ph-fill ph-warning text-[18px] text-[#d49a2e]" />
                  <span className="text-[14px] font-semibold text-[#8f6516]">Demo alert triggered</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <div className="bg-white/60 rounded-lg px-3 py-2 border border-[#ecddb8]">
                    <div className="text-[9px] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>TYPE</div>
                    <div className="text-text font-medium mt-0.5">{String(demoResult.alert_type)}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2 border border-[#ecddb8]">
                    <div className="text-[9px] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ZONE</div>
                    <div className="text-text font-medium mt-0.5">{String(demoResult.zone_id)}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2 border border-[#ecddb8]">
                    <div className="text-[9px] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>TRANSITION</div>
                    <div className="text-text font-medium mt-0.5">{String(demoResult.old_class)} → {String(demoResult.new_class)}</div>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2 border border-[#ecddb8]">
                    <div className="text-[9px] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>RECIPIENTS</div>
                    <div className="text-text font-medium mt-0.5">{String(demoResult.recipients_notified)} notified</div>
                  </div>
                </div>
                <div className="text-[12px] text-[#8f6516]">{String(demoResult.reason)}</div>
              </div>
            )}
          </div>

          {/* Recent alerts timeline */}
          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
            <h3 className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Sample alert timeline (illustrative)</h3>
            {[
              { time: "07:42", type: "zone_change", msg: "Veraval Bank → GREEN", color: "#3a8c5f", icon: "ph ph-map-trifold" },
              { time: "06:18", type: "mhw", msg: "Gulf of Mannar heat stress +1.2°C", color: "#c25a44", icon: "ph ph-thermometer-simple" },
              { time: "05:55", type: "zone_change", msg: "Paradip Shelf → AMBER", color: "#d49a2e", icon: "ph ph-map-trifold" },
              { time: "04:30", type: "mhi_threshold", msg: "Andaman MHI dropped below 40", color: "#c25a44", icon: "ph ph-heartbeat" },
              { time: "03:12", type: "zone_change", msg: "Kochi Shelf → GREEN", color: "#3a8c5f", icon: "ph ph-map-trifold" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-t border-[#f0ebdf] first:border-0">
                <span className="w-8 h-8 flex-none rounded-lg flex items-center justify-center mt-0.5" style={{ background: a.color + "15", color: a.color }}>
                  <i className={a.icon} style={{ fontSize: 15 }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text">{a.msg}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{a.type} · {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual pipeline */}
          <div className="bg-white border border-card-border rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.04)" }}>
            <h3 className="text-[16px] font-semibold text-text mb-5" style={{ fontFamily: "'Newsreader', serif" }}>Alert delivery pipeline</h3>
            <div className="space-y-0">
              {[
                { icon: "ph ph-thermometer-simple", label: "INCOIS SST Update", desc: "New satellite composite ingested", color: "#1f7a8c" },
                { icon: "ph ph-map-trifold", label: "SFZ Reclassification", desc: "XGBoost re-scores all zones", color: "#1f7a8c" },
                { icon: "ph ph-funnel", label: "Event Queue", desc: "Zone-change event dispatched", color: "#d49a2e" },
                { icon: "ph ph-chat-circle-text", label: "Twilio SMS", desc: "Localised message in HI / TA / EN", color: "#3a8c5f" },
                { icon: "ph ph-device-mobile", label: "Firebase FCM", desc: "Android push notification", color: "#3a8c5f" },
                { icon: "ph ph-speaker-high", label: "Bhashini TTS", desc: "Voice alert (Hindi / Tamil)", color: "#3a8c5f" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: step.color + "15", color: step.color }}>
                      <i className={step.icon} style={{ fontSize: 19 }} />
                    </span>
                    {i < 5 && <div className="w-px h-6 bg-card-border" />}
                  </div>
                  <div className="pt-1.5 pb-4">
                    <div className="text-[13.5px] font-semibold text-text">{step.label}</div>
                    <div className="text-[12px] text-text-muted mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA & coverage */}
          <div className="space-y-5">
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>SLA targets (design)</h3>
              <p className="text-[10.5px] text-text-faint mb-3">Latency goals for live delivery — not yet measured in production.</p>
              {[
                { label: "SMS delivery", target: "< 60s", status: "Planned" },
                { label: "Push notification", target: "< 10s", status: "Planned" },
                { label: "Voice synthesis", target: "< 30s", status: "Planned" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-t border-[#f0ebdf] first:border-0 text-[12.5px]">
                  <span className="text-text-secondary">{s.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-text font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.target}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zone-amber-bg text-[#8f6516] border border-[#ecddb8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.status}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Coverage</h3>
              {[
                { label: "Indian EEZ", value: "5°–25°N, 60°–100°E" },
                { label: "Grid resolution", value: "0.5° (~55 km)" },
                { label: "Update frequency", value: "Weekly (SFZ)" },
                { label: "Languages", value: "English, Hindi, Tamil" },
              ].map((c) => (
                <div key={c.label} className="flex justify-between py-2 border-t border-[#f0ebdf] first:border-0 text-[12.5px]">
                  <span className="text-text-muted">{c.label}</span>
                  <span className="text-text font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
