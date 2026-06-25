"use client";
import { useState } from "react";
import { apiPost, apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import HeroBanner from "@/components/ui/HeroBanner";
import TabGroup from "@/components/ui/TabGroup";

export default function AlertsPage() {
  const [tab, setTab] = useState("subscribe");
  const { toast } = useToast();

  // Subscribe
  const [subForm, setSubForm] = useState({ phone: "", device_token: "", language: "en", alert_types: ["zone_change", "mhw", "cyclone"] });
  const [subResult, setSubResult] = useState<Record<string, unknown> | null>(null);
  const [subError, setSubError] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault(); setSubError("");
    if (!subForm.phone && !subForm.device_token) { setSubError("Provide at least a phone number or FCM token."); return; }
    const res = await apiPost<Record<string, unknown>>("/api/v1/alerts/subscribe", {
      phone: subForm.phone || null, device_token: subForm.device_token || null,
      language: subForm.language, alert_types: subForm.alert_types,
    });
    setSubResult(res);
    toast(`Subscribed! ID: ${res.sub_id}`, "success");
  }

  // Demo
  const [demoResult, setDemoResult] = useState<Record<string, unknown> | null>(null);

  async function triggerDemo() {
    const res = await apiGet<Record<string, unknown>>("/api/v1/alerts/trigger-demo");
    setDemoResult(res);
    toast("Demo zone-change alert fired!", "info");
  }

  const alertTypes = ["zone_change", "mhw", "cyclone", "mhi_threshold"];

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Alerts & Subscriptions"
        description="<b>Phase F:</b> Zone-change SMS (Twilio) + Firebase FCM push. Bhashini voice: <b>Hindi + Tamil</b> (MVP). &lt; 60-second SLA."
      />

      <TabGroup tabs={[
        { id: "subscribe", label: "Subscribe" },
        { id: "demo", label: "Demo Alert" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "subscribe" && (
        <form onSubmit={handleSubscribe} className="max-w-lg space-y-4">
          <label className="block"><span className="text-xs text-text-muted">Phone (E.164)</span>
            <input type="text" value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })}
              placeholder="+919876543210"
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint" /></label>
          <label className="block"><span className="text-xs text-text-muted">FCM Device Token (optional)</span>
            <input type="text" value={subForm.device_token} onChange={(e) => setSubForm({ ...subForm, device_token: e.target.value })}
              placeholder="Firebase token..."
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint" /></label>
          <label className="block"><span className="text-xs text-text-muted">Language</span>
            <select value={subForm.language} onChange={(e) => setSubForm({ ...subForm, language: e.target.value })}
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text">
              <option value="en">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option>
            </select></label>
          <div>
            <span className="text-xs text-text-muted">Alert Types</span>
            <div className="flex flex-wrap gap-3 mt-2">
              {alertTypes.map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm text-text-muted">
                  <input type="checkbox" checked={subForm.alert_types.includes(t)}
                    onChange={(e) => setSubForm({ ...subForm, alert_types: e.target.checked ? [...subForm.alert_types, t] : subForm.alert_types.filter((x) => x !== t) })}
                    className="accent-[#1f7a8c]" />
                  {t}
                </label>
              ))}
            </div>
          </div>
          {subError && <p className="text-[#c25a44] text-sm">{subError}</p>}
          <button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors">
            Subscribe
          </button>
          {subResult && (
            <div className="bg-card-hover rounded-lg p-4">
              <p className="text-[#3a8c5f] font-medium mb-1">Subscribed!</p>
              <pre className="text-xs text-text-muted">{JSON.stringify(subResult, null, 2)}</pre>
            </div>
          )}
        </form>
      )}

      {tab === "demo" && (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-text-muted">
            Simulates the full event pipeline: INCOIS SST update → SFZ reclassification → alert dispatch → delivery log.
          </p>
          <button onClick={triggerDemo} className="bg-accent hover:bg-accent-dark text-white rounded-lg px-6 py-2.5 font-medium transition-colors">
            Fire Demo Zone-Change Alert
          </button>
          {demoResult && (
            <div className="bg-card-hover rounded-lg p-4">
              <p className="text-[#d49a2e] font-medium mb-1">Demo alert triggered!</p>
              <pre className="text-xs text-text-muted">{JSON.stringify(demoResult, null, 2)}</pre>
            </div>
          )}
          <div className="bg-card-hover rounded-lg p-4 font-mono text-xs text-text-muted whitespace-pre">{`INCOIS SST update  →  SFZ reclassification
       │
       ▼
Async event queue
       │
  ┌────┴────────┐
  │             │
Twilio SMS    Firebase FCM
(< 60s SLA)   (Android push)
       │
Bhashini TTS
(Hindi / Tamil)`}</div>
        </div>
      )}
    </div>
  );
}
