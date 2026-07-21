"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Lang = "en" | "hi" | "ta";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "EN" },
  { code: "hi", label: "Hindi", native: "हिं" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
];

// Fisher-facing strings only. Researcher pages stay English.
// {var} placeholders are filled by t(key, { var: value }).
const T: Record<string, Record<Lang, string>> = {
  "fisher.title":        { en: "Fisher View", hi: "मछुआरा दृश्य", ta: "மீனவர் பார்வை" },
  "fisher.subtitle":     { en: "Zones near your landing site", hi: "आपके बंदरगाह के पास के क्षेत्र", ta: "உங்கள் துறைமுகத்திற்கு அருகிலுள்ள மண்டலங்கள்" },
  "fisher.yourPort":     { en: "Your port", hi: "आपका बंदरगाह", ta: "உங்கள் துறைமுகம்" },
  "fisher.myLocation":   { en: "My Location", hi: "मेरा स्थान", ta: "எனது இருப்பிடம்" },
  "fisher.useLocation":  { en: "Use my location", hi: "मेरा स्थान उपयोग करें", ta: "எனது இருப்பிடத்தைப் பயன்படுத்து" },
  "fisher.locating":     { en: "Locating…", hi: "स्थान ढूँढ रहे हैं…", ta: "இருப்பிடத்தைக் கண்டறிகிறது…" },
  "fisher.gpsUnsupported":{ en: "Location isn't available on this device.", hi: "इस डिवाइस पर स्थान उपलब्ध नहीं है।", ta: "இந்த சாதனத்தில் இருப்பிடம் கிடைக்கவில்லை." },
  "fisher.gpsDenied":    { en: "Couldn't get your location. Enable location access and try again.", hi: "आपका स्थान नहीं मिल सका। स्थान पहुँच चालू करें और फिर से प्रयास करें।", ta: "உங்கள் இருப்பிடத்தைப் பெற முடியவில்லை. இருப்பிட அணுகலை இயக்கி மீண்டும் முயற்சிக்கவும்." },
  "fisher.gpsAccuracy":  { en: "GPS · ±{m}m", hi: "GPS · ±{m}मी", ta: "GPS · ±{m}மீ" },
  "fisher.switchToPort": { en: "Use a port instead", hi: "इसके बजाय बंदरगाह चुनें", ta: "பதிலாக துறைமுகத்தைப் பயன்படுத்து" },
  "fisher.nearPort":     { en: "≈ {km} km from {port}", hi: "{port} से ≈ {km} किमी", ta: "{port} இலிருந்து ≈ {km} கிமீ" },

  "verdict.GO":          { en: "GO", hi: "जाएँ", ta: "செல்லலாம்" },
  "verdict.CAUTION":     { en: "CAUTION", hi: "सावधान", ta: "எச்சரிக்கை" },
  "verdict.AVOID":       { en: "AVOID", hi: "न जाएँ", ta: "வேண்டாம்" },
  "verdict.GO.desc":     { en: "Good conditions to head out today", hi: "आज समुद्र में जाने के लिए अच्छी स्थिति", ta: "இன்று கடலுக்கு செல்ல நல்ல நிலை" },
  "verdict.CAUTION.desc":{ en: "Mixed conditions — be careful", hi: "स्थिति मिली-जुली है — सावधान रहें", ta: "நிலை கலவையானது — கவனமாக இருங்கள்" },
  "verdict.AVOID.desc":  { en: "Not safe to fish today", hi: "आज मछली पकड़ना सुरक्षित नहीं", ta: "இன்று மீன்பிடிக்க பாதுகாப்பானதல்ல" },
  "verdict.score":       { en: "Fishing score", hi: "मछली स्कोर", ta: "மீன்பிடி மதிப்பெண்" },
  "verdict.loading":     { en: "Checking today's conditions…", hi: "आज की स्थिति जाँच रहे हैं…", ta: "இன்றைய நிலையை சரிபார்க்கிறது…" },

  "banner.monsoon":      { en: "Monsoon season — check the local fishing ban before heading out", hi: "मानसून का मौसम — जाने से पहले स्थानीय मछली पकड़ने पर रोक जाँचें", ta: "பருவமழை காலம் — செல்வதற்கு முன் உள்ளூர் மீன்பிடித் தடையை சரிபார்க்கவும்" },
  "banner.alerts":       { en: "{n} marine stress alerts near {port}", hi: "{port} के पास {n} समुद्री तनाव चेतावनियाँ", ta: "{port} அருகில் {n} கடல் அழுத்த எச்சரிக்கைகள்" },
  "banner.safeZones":    { en: "{n} zones near {port} rated low-bycatch this week — see today's sea conditions above before heading out", hi: "{port} के पास इस सप्ताह {n} क्षेत्र कम-बायकैच रेटेड — निकलने से पहले ऊपर आज की समुद्री स्थिति देखें", ta: "{port} அருகில் இந்த வாரம் {n} மண்டலங்கள் குறைந்த-பைகேட்ச் மதிப்பீடு — புறப்படும் முன் மேலே இன்றைய கடல் நிலையைப் பாருங்கள்" },

  "stat.safe":           { en: "Good zones", hi: "अच्छे क्षेत्र", ta: "நல்ல மண்டலங்கள்" },
  "stat.caution":        { en: "Mixed zones", hi: "मिश्रित क्षेत्र", ta: "கலப்பு மண்டலங்கள்" },
  "stat.avoid":          { en: "Risk zones", hi: "जोखिम क्षेत्र", ta: "ஆபத்து மண்டலங்கள்" },
  "stat.seaTemp":        { en: "Sea temp", hi: "समुद्र तापमान", ta: "கடல் வெப்பம்" },
  "stat.zonesHeader":    { en: "Zone quality this week", hi: "इस सप्ताह क्षेत्र गुणवत्ता", ta: "இந்த வாரம் மண்டல தரம்" },
  "stat.zonesSubhead":   { en: "Species & bycatch rating — not today's weather", hi: "प्रजाति और बायकैच रेटिंग — आज का मौसम नहीं", ta: "இனங்கள் & பைகேட்ச் மதிப்பீடு — இன்றைய வானிலை அல்ல" },

  "seasky.title":        { en: "Sea & sky", hi: "समुद्र और आकाश", ta: "கடலும் வானமும்" },
  "seasky.swell":        { en: "SWELL", hi: "लहर", ta: "அலை" },
  "seasky.water":        { en: "WATER", hi: "पानी", ta: "நீர்" },
  "seasky.vis":          { en: "VIS", hi: "दृश्यता", ta: "தெரிவு" },
  "seasky.good":         { en: "Good", hi: "अच्छी", ta: "நல்லது" },
  "seasky.moderate":     { en: "Moderate", hi: "मध्यम", ta: "நடுத்தரம்" },
  "tide.high":           { en: "High tide", hi: "उच्च ज्वार", ta: "உயர் அலை" },
  "tide.low":            { en: "Low tide", hi: "निम्न ज्वार", ta: "தாழ் அலை" },

  "safety.headBack":     { en: "Head back by {time}", hi: "{time} तक लौट आएँ", ta: "{time} க்குள் திரும்புங்கள்" },
  "safety.sunset":       { en: "Sunset {time} · keep a 30 min buffer", hi: "सूर्यास्त {time} · 30 मिनट का समय रखें", ta: "சூரிய அஸ்தமனம் {time} · 30 நிமிடம் வைத்திருங்கள்" },

  "catches.title":       { en: "Recent catches — {port}", hi: "हाल की पकड़ — {port}", ta: "சமீபத்திய மீன்பிடி — {port}" },
  "catches.empty":       { en: "No catches logged at this site yet.", hi: "इस स्थान पर अभी तक कोई पकड़ दर्ज नहीं।", ta: "இந்த இடத்தில் இதுவரை பதிவு இல்லை." },

  "explore.title":       { en: "Explore", hi: "और देखें", ta: "மேலும்" },
  "explore.advisory":    { en: "Detailed fishing advisory", hi: "विस्तृत मछली सलाह", ta: "விரிவான மீன்பிடி ஆலோசனை" },
  "explore.migration":   { en: "Where are fish moving?", hi: "मछलियाँ कहाँ जा रही हैं?", ta: "மீன்கள் எங்கே செல்கின்றன?" },
  "explore.species":     { en: "Species near {port}", hi: "{port} के पास प्रजातियाँ", ta: "{port} அருகில் இனங்கள்" },
  "explore.twin":        { en: "What if the sea warms +2°C?", hi: "अगर समुद्र +2°C गर्म हो तो?", ta: "கடல் +2°C சூடானால்?" },

  "action.logCatch":     { en: "Log catch", hi: "पकड़ दर्ज करें", ta: "மீன்பிடியைப் பதிவு செய்" },
  "action.scan":         { en: "Scan catch photo", hi: "पकड़ की फ़ोटो स्कैन करें", ta: "மீன் புகைப்படத்தை ஸ்கேன் செய்" },
  "action.ask":          { en: "Ask a question", hi: "सवाल पूछें", ta: "கேள்வி கேளுங்கள்" },
  "action.alerts":       { en: "Get alerts", hi: "अलर्ट पाएँ", ta: "எச்சரிக்கை பெறு" },

  "form.title":          { en: "Log catch at {port}", hi: "{port} पर पकड़ दर्ज करें", ta: "{port} இல் மீன்பிடியைப் பதிவு செய்" },
  "form.species":        { en: "Species", hi: "प्रजाति", ta: "இனம்" },
  "form.quantity":       { en: "Quantity (kg)", hi: "मात्रा (किग्रा)", ta: "அளவு (கிலோ)" },
  "form.record":         { en: "Record catch", hi: "पकड़ दर्ज करें", ta: "பதிவு செய்" },
  "form.logging":        { en: "Logging…", hi: "दर्ज हो रहा है…", ta: "பதிவாகிறது…" },
  "form.recorded":       { en: "Catch recorded — Block #{n}", hi: "पकड़ दर्ज हुई — ब्लॉक #{n}", ta: "மீன்பிடி பதிவானது — தொகுதி #{n}" },

  "map.zones":           { en: "Zone quality (weekly)", hi: "क्षेत्र गुणवत्ता (साप्ताहिक)", ta: "மண்டல தரம் (வாராந்திரம்)" },
  "map.recommended":     { en: "Recommended", hi: "अनुशंसित", ta: "பரிந்துரை" },
  "map.caution":         { en: "Mixed", hi: "मिश्रित", ta: "கலப்பு" },
  "map.avoid":           { en: "High bycatch risk", hi: "उच्च बायकैच जोखिम", ta: "அதிக பைகேட்ச் ஆபத்து" },
  "map.safeToFish":      { en: "Recommended zone", hi: "अनुशंसित क्षेत्र", ta: "பரிந்துரைக்கப்பட்ட மண்டலம்" },
  "map.avoidArea":       { en: "High bycatch risk — avoid", hi: "उच्च बायकैच जोखिम — बचें", ta: "அதிக பைகேட்ச் ஆபத்து — தவிர்க்கவும்" },
  "map.fishCaution":     { en: "Mixed zone — check bycatch risk", hi: "मिश्रित क्षेत्र — बायकैच जोखिम जाँचें", ta: "கலப்பு மண்டலம் — பைகேட்ச் ஆபத்தைச் சரிபார்க்கவும்" },

  "geofence.warning":    { en: "You're near a no-go zone ({km} km away) — avoid fishing here.", hi: "आप एक निषिद्ध क्षेत्र के पास हैं ({km} किमी दूर) — यहाँ मछली न पकड़ें।", ta: "நீங்கள் தடைசெய்யப்பட்ட மண்டலத்திற்கு அருகில் ({km} கிமீ) — இங்கு மீன்பிடிக்க வேண்டாம்." },

  "nav.cta":             { en: "Navigate to nearest safe zone", hi: "निकटतम सुरक्षित क्षेत्र तक जाएँ", ta: "அருகிலுள்ள பாதுகாப்பான மண்டலத்திற்கு செல்" },
  "nav.tapToGo":         { en: "Tap to navigate here", hi: "यहाँ जाने के लिए टैप करें", ta: "இங்கு செல்ல தட்டவும்" },
  "nav.zoneName":        { en: "Safe fishing zone", hi: "सुरक्षित मछली क्षेत्र", ta: "பாதுகாப்பான மீன்பிடி மண்டலம்" },
  "nav.headingTo":       { en: "Heading to", hi: "जा रहे हैं", ta: "செல்கிறது" },
  "nav.eta":             { en: "Time to reach", hi: "पहुँचने का समय", ta: "வருகை நேரம்" },
  "nav.speed":           { en: "Boat speed", hi: "नाव की गति", ta: "படகு வேகம்" },
  "nav.min":             { en: "min", hi: "मिनट", ta: "நிமிடம்" },
  "nav.steer":           { en: "Steer toward the arrow", hi: "तीर की दिशा में चलें", ta: "அம்புக்குறியை நோக்கி செலுத்துங்கள்" },
  "nav.northUp":         { en: "North is up — turn toward the arrow", hi: "उत्तर ऊपर है — तीर की ओर मुड़ें", ta: "வடக்கு மேலே — அம்பை நோக்கி திரும்பவும்" },
  "nav.arrived":         { en: "You've reached the zone", hi: "आप क्षेत्र में पहुँच गए", ta: "நீங்கள் மண்டலத்தை அடைந்தீர்கள்" },
  "nav.gpsWait":         { en: "Getting your GPS position…", hi: "आपकी GPS स्थिति ले रहे हैं…", ta: "உங்கள் GPS இருப்பிடத்தைப் பெறுகிறது…" },
  "nav.gpsError":        { en: "Location unavailable. Enable GPS to navigate.", hi: "स्थान उपलब्ध नहीं। नेविगेट करने के लिए GPS चालू करें।", ta: "இருப்பிடம் இல்லை. வழிசெலுத்த GPS ஐ இயக்கவும்." },
  "nav.offline":         { en: "Works offline · GPS only", hi: "ऑफ़लाइन काम करता है · केवल GPS", ta: "ஆஃப்லைனில் இயங்கும் · GPS மட்டும்" },

  "econ.title":          { en: "Zone yield & trip cost", hi: "क्षेत्र उपज और यात्रा लागत", ta: "மண்டல விளைச்சல் & பயண செலவு" },
  "econ.indicative":     { en: "Indicative — prices vary locally", hi: "सांकेतिक — स्थानीय दाम अलग हो सकते हैं", ta: "குறிப்பிடத்தக்கது — உள்ளூர் விலைகள் மாறுபடும்" },
  "econ.nearbyCatches":  { en: "{n} catches logged nearby (last {d}d) · avg {kg}kg · mostly {species}", hi: "पास में {n} पकड़ दर्ज (पिछले {d} दिन) · औसत {kg}किग्रा · अधिकतर {species}", ta: "அருகில் {n} பிடிகள் பதிவு (கடந்த {d} நாட்கள்) · சராசரி {kg}கிலோ · பெரும்பாலும் {species}" },
  "econ.noHistory":      { en: "No catches logged near this zone yet — log yours to help build this estimate.", hi: "इस क्षेत्र के पास अभी कोई पकड़ दर्ज नहीं — अनुमान बनाने में मदद के लिए अपनी पकड़ दर्ज करें।", ta: "இந்த மண்டலத்திற்கு அருகில் இதுவரை பிடிகள் பதிவு இல்லை — மதிப்பீட்டை உருவாக்க உங்களுடையதை பதிவு செய்யுங்கள்." },
  "econ.fuelCost":       { en: "Fuel (round trip)", hi: "ईंधन (आना-जाना)", ta: "எரிபொருள் (இரு வழி)" },
  "econ.catchValue":     { en: "Est. catch value", hi: "अनुमानित पकड़ मूल्य", ta: "மதிப்பிடப்பட்ட பிடிப்பு மதிப்பு" },
  "econ.net":            { en: "Net estimate", hi: "शुद्ध अनुमान", ta: "நிகர மதிப்பீடு" },

  "trip.start":          { en: "Start trip", hi: "यात्रा शुरू करें", ta: "பயணத்தைத் தொடங்கு" },
  "trip.active":         { en: "Trip active", hi: "यात्रा जारी", ta: "பயணம் நடைபெறுகிறது" },
  "trip.fromHome":       { en: "From home", hi: "घर से", ta: "வீட்டிலிருந்து" },
  "trip.farthest":       { en: "Farthest", hi: "अधिकतम दूरी", ta: "அதிக தூரம்" },
  "trip.timeLeft":       { en: "Time left", hi: "शेष समय", ta: "மீதி நேரம்" },
  "trip.returnBy":       { en: "Return by", hi: "वापसी", ta: "திரும்பு" },
  "trip.overdue":        { en: "Time to head back", hi: "अब लौटने का समय", ta: "திரும்பும் நேரம் வந்தது" },
  "trip.overdueDesc":    { en: "You're past your return time — head home now.", hi: "आपका वापसी समय बीत चुका है — अब घर लौटें।", ta: "திரும்பும் நேரம் தாண்டிவிட்டது — இப்போது வீடு திரும்புங்கள்." },
  "trip.sos":            { en: "Send SOS", hi: "SOS भेजें", ta: "SOS அனுப்பு" },
  "trip.imSafe":         { en: "I'm safe", hi: "मैं सुरक्षित हूँ", ta: "நான் பாதுகாப்பு" },
  "trip.end":            { en: "End trip", hi: "यात्रा समाप्त", ta: "பயணத்தை முடி" },
  "trip.summary":        { en: "Last trip: {dur} out · farthest {km} km", hi: "पिछली यात्रा: {dur} · अधिकतम {km} किमी", ta: "கடந்த பயணம்: {dur} · அதிக {km} கிமீ" },

  "comm.title":          { en: "Community Catch Map", hi: "समुदाय पकड़ मानचित्र", ta: "சமூக மீன்பிடி வரைபடம்" },
  "comm.subtitle":       { en: "Recent catches reported by fishers nearby — see where the fish are biting.", hi: "आस-पास के मछुआरों द्वारा दर्ज हाल की पकड़ — देखें मछली कहाँ मिल रही है।", ta: "அருகிலுள்ள மீனவர்கள் பதிவு செய்த சமீபத்திய மீன்பிடி — மீன் எங்கே கிடைக்கிறது என்று பாருங்கள்." },
  "comm.catches":        { en: "Catches (48h)", hi: "पकड़ (48घं)", ta: "மீன்பிடி (48ம)" },
  "comm.landed":         { en: "Total landed", hi: "कुल पकड़", ta: "மொத்தம்" },
  "comm.species":        { en: "Species", hi: "प्रजातियाँ", ta: "இனங்கள்" },
  "comm.reporters":      { en: "Reporters", hi: "मछुआरे", ta: "பதிவாளர்கள்" },
  "comm.recent":         { en: "Recent reports", hi: "हाल की रिपोर्ट", ta: "சமீபத்திய அறிக்கைகள்" },
  "comm.all":            { en: "All", hi: "सभी", ta: "அனைத்தும்" },
  "comm.away":           { en: "{km} km away", hi: "{km} किमी दूर", ta: "{km} கிமீ தொலைவில்" },
  "comm.hoursAgo":       { en: "{h}h ago", hi: "{h}घं पहले", ta: "{h}ம முன்" },
  "comm.justNow":        { en: "just now", hi: "अभी", ta: "இப்போது" },
  "comm.empty":          { en: "No community catches yet — log one to start the map.", hi: "अभी कोई सामुदायिक पकड़ नहीं — मानचित्र शुरू करने के लिए एक दर्ज करें।", ta: "இதுவரை சமூக மீன்பிடி இல்லை — வரைபடத்தைத் தொடங்க ஒன்றைப் பதிவு செய்யுங்கள்." },
  "comm.report":         { en: "Report your catch", hi: "अपनी पकड़ दर्ज करें", ta: "உங்கள் மீன்பிடியைப் பதிவு செய்" },
  "comm.fresh":          { en: "Fresh (<6h)", hi: "ताज़ा (<6घं)", ta: "புதிது (<6ம)" },
  "comm.today":          { en: "Today", hi: "आज", ta: "இன்று" },
  "comm.older":          { en: "Older", hi: "पुराना", ta: "பழையது" },

  "comp.open":           { en: "Fishing permitted", hi: "मछली पकड़ने की अनुमति", ta: "மீன்பிடி அனுமதி" },
  "comp.openDesc":       { en: "Waters open · next ban in {days} days", hi: "समुद्र खुला · अगला प्रतिबंध {days} दिनों में", ta: "கடல் திறந்துள்ளது · அடுத்த தடை {days} நாட்களில்" },
  "comp.ban":            { en: "Monsoon fishing ban", hi: "मानसून मछली प्रतिबंध", ta: "பருவமழை மீன்பிடித் தடை" },
  "comp.banDesc":        { en: "Ban active · {days} days left", hi: "प्रतिबंध लागू · {days} दिन शेष", ta: "தடை அமலில் · {days} நாட்கள் மீதம்" },
  "comp.notake":         { en: "Protected marine area", hi: "संरक्षित समुद्री क्षेत्र", ta: "பாதுகாக்கப்பட்ட கடல் பகுதி" },
  "comp.notakeDesc":     { en: "No-take zone — fishing restricted", hi: "नो-टेक क्षेत्र — मछली पकड़ना प्रतिबंधित", ta: "தடை மண்டலம் — மீன்பிடி தடை" },
  "comp.advisory":       { en: "Advisory — confirm with local authority", hi: "सलाह — स्थानीय अधिकारी से पुष्टि करें", ta: "ஆலோசனை — உள்ளூர் அதிகாரியிடம் உறுதிப்படுத்தவும்" },
  "comp.checking":       { en: "Checking fishing rules…", hi: "मछली नियम जाँच रहे हैं…", ta: "மீன்பிடி விதிகளை சரிபார்க்கிறது…" },

  "fp.title":            { en: "Ocean Footprint", hi: "समुद्री पदचिह्न", ta: "கடல் தடம்" },
  "fp.subtitle":         { en: "How sustainable is the catch? Scored from species status, fishing zone, and legality — indicative, not certified.", hi: "पकड़ कितनी टिकाऊ है? प्रजाति स्थिति, क्षेत्र और वैधता से स्कोर — संकेतात्मक।", ta: "மீன்பிடி எவ்வளவு நிலையானது? இனம், மண்டலம், சட்டப்படி மதிப்பெண் — சுட்டிக்காட்டல் மட்டும்." },
  "fp.blueScore":        { en: "Fleet Blue Score", hi: "बेड़ा ब्लू स्कोर", ta: "கடற்படை நீல மதிப்பெண்" },
  "fp.catches":          { en: "Catches", hi: "पकड़", ta: "மீன்பிடி" },
  "fp.landed":           { en: "Landed", hi: "कुल", ta: "மொத்தம்" },
  "fp.greenShare":       { en: "Sustainable", hi: "टिकाऊ", ta: "நிலையானது" },
  "fp.sustainability":   { en: "Sustainability", hi: "स्थिरता", ta: "நிலைத்தன்மை" },
  "fp.compliance":       { en: "Season compliance", hi: "मौसम अनुपालन", ta: "பருவ இணக்கம்" },
  "fp.sustainable":      { en: "Sustainable", hi: "टिकाऊ", ta: "நிலையானது" },
  "fp.moderate":         { en: "Moderate", hi: "मध्यम", ta: "நடுத்தரம்" },
  "fp.highImpact":       { en: "High impact", hi: "अधिक प्रभाव", ta: "அதிக பாதிப்பு" },
  "fp.compliant":        { en: "Within season", hi: "मौसम में", ta: "பருவத்தில்" },
  "fp.closedSeason":     { en: "Closed-season catches", hi: "बंद मौसम की पकड़", ta: "தடைக்கால மீன்பிடி" },
  "fp.speciesStatus":    { en: "Species conservation status", hi: "प्रजाति संरक्षण स्थिति", ta: "இன பாதுகாப்பு நிலை" },
  "fp.method":           { en: "Indicative score from IUCN Red List + OceanMind zones + state ban calendars. Not a certified assessment.", hi: "IUCN रेड लिस्ट + OceanMind क्षेत्र + राज्य प्रतिबंध कैलेंडर से संकेतात्मक स्कोर। प्रमाणित नहीं।", ta: "IUCN சிவப்புப் பட்டியல் + OceanMind மண்டலங்கள் + மாநிலத் தடை நாட்காட்டியிலிருந்து சுட்டிக்காட்டல் மதிப்பெண். சான்றளிக்கப்பட்டதல்ல." },
  "fp.empty":            { en: "No catches scored yet — log one to start your footprint.", hi: "अभी कोई पकड़ स्कोर नहीं — शुरू करने के लिए एक दर्ज करें।", ta: "இதுவரை மதிப்பெண் இல்லை — தொடங்க ஒன்றைப் பதிவு செய்யுங்கள்." },
  "fp.blueScoreShort":   { en: "Blue Score", hi: "ब्लू स्कोर", ta: "நீல மதிப்பெண்" },
  "footer.data":         { en: "Live weather via Open-Meteo · fishing zones via ML models · OceanMind AI", hi: "Open-Meteo से लाइव मौसम · ML मॉडल से मछली क्षेत्र · OceanMind AI", ta: "Open-Meteo வழியாக நேரடி வானிலை · ML மாதிரிகள் வழியாக மீன்பிடி மண்டலங்கள் · OceanMind AI" },

  "adv.title":           { en: "Fishing Advisory", hi: "मछली पकड़ने की सलाह", ta: "மீன்பிடி ஆலோசனை" },
  "adv.subtitle":        { en: "Live sea conditions and a clear GO / CAUTION / AVOID answer for any spot.", hi: "किसी भी स्थान के लिए लाइव समुद्री स्थिति और साफ़ जाएँ / सावधान / न जाएँ जवाब।", ta: "எந்த இடத்திற்கும் நேரடி கடல் நிலை மற்றும் தெளிவான செல்லலாம் / எச்சரிக்கை / வேண்டாம் பதில்." },
  "adv.orTap":           { en: "Or tap a fishing spot", hi: "या कोई स्थान चुनें", ta: "அல்லது ஒரு இடத்தைத் தட்டவும்" },
  "adv.advanced":        { en: "Advanced: enter coordinates", hi: "एडवांस: निर्देशांक दर्ज करें", ta: "மேம்பட்டது: ஆயத்தொலைவுகளை உள்ளிடவும்" },
  "adv.lat":             { en: "Latitude", hi: "अक्षांश", ta: "அட்சரேகை" },
  "adv.lon":             { en: "Longitude", hi: "देशांतर", ta: "தீர்க்கரேகை" },
  "adv.site":            { en: "Place name", hi: "स्थान का नाम", ta: "இடத்தின் பெயர்" },
  "adv.getBtn":          { en: "Get advisory", hi: "सलाह पाएँ", ta: "ஆலோசனை பெறு" },
  "adv.what":            { en: "What you get", hi: "आपको क्या मिलेगा", ta: "உங்களுக்கு என்ன கிடைக்கும்" },
  "adv.whatSst":         { en: "Sea temperature", hi: "समुद्र का तापमान", ta: "கடல் வெப்பநிலை" },
  "adv.whatSstDesc":     { en: "7-day history + now", hi: "7 दिन का इतिहास + अभी", ta: "7 நாள் வரலாறு + இப்போது" },
  "adv.whatWave":        { en: "Wave height", hi: "लहर की ऊँचाई", ta: "அலை உயரம்" },
  "adv.whatWind":        { en: "Wind speed", hi: "हवा की गति", ta: "காற்றின் வேகம்" },
  "adv.what3d":          { en: "Next 3 days, hourly", hi: "अगले 3 दिन, हर घंटे", ta: "அடுத்த 3 நாட்கள், மணிநேரம்" },
  "adv.whatScore":       { en: "Fishing score (0–100)", hi: "मछली स्कोर (0–100)", ta: "மீன்பிடி மதிப்பெண் (0–100)" },
  "adv.whatScoreDesc":   { en: "GO / CAUTION / AVOID", hi: "जाएँ / सावधान / न जाएँ", ta: "செல்லலாம் / எச்சரிக்கை / வேண்டாம்" },
  "adv.whatWindows":     { en: "Best time windows", hi: "सबसे अच्छा समय", ta: "சிறந்த நேரம்" },
  "adv.whatWindowsDesc": { en: "Best hours to head out", hi: "निकलने के सबसे अच्छे घंटे", ta: "புறப்பட சிறந்த மணிநேரங்கள்" },
  "adv.sstNow":          { en: "Sea temp now", hi: "समुद्र तापमान अभी", ta: "கடல் வெப்பம் இப்போது" },
  "adv.sstTrend":        { en: "7-day trend", hi: "7-दिन का रुझान", ta: "7 நாள் போக்கு" },
  "adv.wave":            { en: "Wave height", hi: "लहर ऊँचाई", ta: "அலை உயரம்" },
  "adv.wind":            { en: "Wind speed", hi: "हवा की गति", ta: "காற்று வேகம்" },
  "adv.cloud":           { en: "Cloud cover", hi: "बादल", ta: "மேகம்" },
  "adv.sstChart":        { en: "Sea temperature — last 7 days", hi: "समुद्र तापमान — पिछले 7 दिन", ta: "கடல் வெப்பநிலை — கடந்த 7 நாட்கள்" },
  "adv.waveChart":       { en: "Wave height — next 3 days", hi: "लहर ऊँचाई — अगले 3 दिन", ta: "அலை உயரம் — அடுத்த 3 நாட்கள்" },
  "adv.windChart":       { en: "Wind speed — next 3 days", hi: "हवा की गति — अगले 3 दिन", ta: "காற்று வேகம் — அடுத்த 3 நாட்கள்" },
  "adv.bestWindows":     { en: "Best times to head out", hi: "निकलने का सबसे अच्छा समय", ta: "புறப்பட சிறந்த நேரம்" },
  "adv.scoreWord":       { en: "score", hi: "स्कोर", ta: "மதிப்பெண்" },
  "adv.onLand":          { en: "Those coordinates are on land — pick a spot in the sea.", hi: "ये निर्देशांक ज़मीन पर हैं — समुद्र में कोई स्थान चुनें।", ta: "இந்த ஆயத்தொலைவுகள் நிலத்தில் உள்ளன — கடலில் ஒரு இடத்தைத் தேர்ந்தெடுக்கவும்." },
  "adv.failed":          { en: "Couldn't fetch the advisory. Check your connection and try again.", hi: "सलाह नहीं मिल सकी। कनेक्शन जाँचें और फिर कोशिश करें।", ta: "ஆலோசனையைப் பெற முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்." },

  "bio.scanTitle":       { en: "Scan your catch", hi: "अपनी पकड़ स्कैन करें", ta: "உங்கள் மீன்பிடியை ஸ்கேன் செய்யுங்கள்" },
  "bio.scanDesc":        { en: "Take a photo of your catch and OceanMind will identify the species — no typing needed.", hi: "अपनी पकड़ की फ़ोटो लें — OceanMind प्रजाति पहचान लेगा। टाइप करने की ज़रूरत नहीं।", ta: "உங்கள் மீன்பிடியின் புகைப்படத்தை எடுங்கள் — OceanMind இனத்தை அடையாளம் காணும். தட்டச்சு தேவையில்லை." },
  "bio.guess.title":     { en: "This looks like", hi: "यह दिखता है", ta: "இது போல் தெரிகிறது" },
  "bio.guess.match":     { en: "{p}% match", hi: "{p}% मेल", ta: "{p}% பொருத்தம்" },
  "bio.guess.uncertain": { en: "Not fully sure — it could also be:", hi: "पक्का नहीं — यह भी हो सकता है:", ta: "முழுமையாக உறுதியில்லை — இதுவாகவும் இருக்கலாம்:" },
  "bio.guess.tip":       { en: "For a better match, take a clear, well-lit photo of a single fish.", hi: "बेहतर पहचान के लिए एक मछली की साफ़, अच्छी रोशनी वाली फ़ोटो लें।", ta: "சிறந்த பொருத்தத்திற்கு ஒரு மீனின் தெளிவான, நல்ல வெளிச்சப் புகைப்படம் எடுங்கள்." },
  "bio.guess.estSize":   { en: "Est. size", hi: "अनुमानित आकार", ta: "தோராயமான அளவு" },
  "bio.guess.estWeight": { en: "Est. weight", hi: "अनुमानित वज़न", ta: "தோராயமான எடை" },
  "bio.guess.notMeasured":{ en: "Size is estimated from species averages — not measured from the photo.", hi: "आकार प्रजाति औसत से अनुमानित है — फ़ोटो से मापा नहीं गया।", ta: "அளவு இன சராசரியிலிருந்து மதிப்பிடப்பட்டது — புகைப்படத்திலிருந்து அளக்கப்படவில்லை." },
  "bio.guess.moreFish":  { en: "{n} fish detected in this photo — details below.", hi: "इस फ़ोटो में {n} मछलियाँ मिलीं — नीचे विवरण।", ta: "இந்த புகைப்படத்தில் {n} மீன்கள் கண்டறியப்பட்டன — கீழே விவரங்கள்." },
  "bio.guess.library":   { en: "Read about this species", hi: "इस प्रजाति के बारे में पढ़ें", ta: "இந்த இனத்தைப் பற்றி படியுங்கள்" },

  "voice.title":         { en: "Ask by Voice", hi: "आवाज़ से पूछें", ta: "குரலில் கேளுங்கள்" },
  "voice.subtitle":      { en: "Ask in Hindi, Tamil, or English — speak or type, and hear the answer read back.", hi: "हिंदी, तमिल या अंग्रेज़ी में पूछें — बोलें या टाइप करें, और जवाब सुनें।", ta: "இந்தி, தமிழ் அல்லது ஆங்கிலத்தில் கேளுங்கள் — பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள், பதிலைக் கேளுங்கள்." },
  "voice.textTab":       { en: "Type a question", hi: "सवाल टाइप करें", ta: "கேள்வியைத் தட்டச்சு செய்" },
  "voice.voiceTab":      { en: "Speak", hi: "बोलें", ta: "பேசுங்கள்" },
  "voice.askBtn":        { en: "Ask OceanMind", hi: "OceanMind से पूछें", ta: "OceanMind இடம் கேளுங்கள்" },
  "voice.processing":    { en: "Processing…", hi: "जवाब आ रहा है…", ta: "பதில் வருகிறது…" },
  "voice.placeholder":   { en: "Type in your selected language…", hi: "अपनी चुनी भाषा में टाइप करें…", ta: "தேர்ந்தெடுத்த மொழியில் தட்டச்சு செய்யவும்…" },
  "voice.tryAsking":     { en: "Try asking", hi: "ये पूछ कर देखें", ta: "இதைக் கேட்டுப் பாருங்கள்" },
  "voice.says":          { en: "OceanMind says", hi: "OceanMind कहता है", ta: "OceanMind கூறுகிறது" },
  "voice.listen":        { en: "Listen", hi: "सुनें", ta: "கேள்" },
  "voice.stop":          { en: "Stop", hi: "रोकें", ta: "நிறுத்து" },
  "voice.translation":   { en: "English translation", hi: "अंग्रेज़ी अनुवाद", ta: "ஆங்கில மொழிபெயர்ப்பு" },
  "voice.heard":         { en: "Heard ({lang}):", hi: "सुना ({lang}):", ta: "கேட்டது ({lang}):" },
  "voice.retrieving":    { en: "Getting your answer…", hi: "आपका जवाब ला रहे हैं…", ta: "உங்கள் பதிலைப் பெறுகிறது…" },

  "bg.title":            { en: "Background boundary alerts", hi: "बैकग्राउंड सीमा चेतावनी", ta: "பின்னணி எல்லை எச்சரிக்கை" },
  "bg.desc":             { en: "Warns you near no-go zones even when the screen is off or you're using another app.", hi: "स्क्रीन बंद होने या दूसरा ऐप चलने पर भी निषिद्ध क्षेत्र के पास चेतावनी देता है।", ta: "திரை அணைந்திருந்தாலும் அல்லது வேறு ஆப் பயன்படுத்தினாலும் தடை மண்டலத்திற்கு அருகில் எச்சரிக்கும்." },
  "bg.on":               { en: "Watching your position — you'll be warned near a no-go zone.", hi: "आपकी स्थिति पर नज़र है — निषिद्ध क्षेत्र के पास चेतावनी मिलेगी।", ta: "உங்கள் இருப்பிடம் கண்காணிப்பில் — தடை மண்டலத்திற்கு அருகில் எச்சரிக்கை கிடைக்கும்." },
  "bg.enable":           { en: "Turn on", hi: "चालू करें", ta: "இயக்கு" },
  "bg.disable":          { en: "Turn off", hi: "बंद करें", ta: "அணை" },
  "bg.denied":           { en: "Location permission needed — choose 'Allow all the time' in settings.", hi: "स्थान अनुमति चाहिए — सेटिंग्स में 'हमेशा अनुमति दें' चुनें।", ta: "இருப்பிட அனுமதி தேவை — அமைப்புகளில் 'எப்போதும் அனுமதி' என்பதைத் தேர்ந்தெடுக்கவும்." },
  "bg.openSettings":     { en: "Open settings", hi: "सेटिंग्स खोलें", ta: "அமைப்புகளைத் திற" },
  "bg.trackTitle":       { en: "OceanMind boundary watch", hi: "OceanMind सीमा निगरानी", ta: "OceanMind எல்லை கண்காணிப்பு" },
  "bg.trackMsg":         { en: "Watching your distance to no-go zones.", hi: "निषिद्ध क्षेत्रों से आपकी दूरी पर नज़र।", ta: "தடை மண்டலங்களிலிருந்து உங்கள் தூரம் கண்காணிப்பில்." },
  "bg.alertTitle":       { en: "OceanMind — boundary warning", hi: "OceanMind — सीमा चेतावनी", ta: "OceanMind — எல்லை எச்சரிக்கை" },

  "sos.sent":            { en: "SOS SMS sent with your location.", hi: "आपके स्थान के साथ SOS SMS भेज दिया गया।", ta: "உங்கள் இருப்பிடத்துடன் SOS SMS அனுப்பப்பட்டது." },

  "pwa.installTitle":    { en: "Add OceanMind to your phone", hi: "OceanMind को अपने फ़ोन में जोड़ें", ta: "OceanMind ஐ உங்கள் போனில் சேர்க்கவும்" },
  "pwa.installDesc":     { en: "Opens like an app and keeps working offline at sea.", hi: "ऐप की तरह खुलता है और समुद्र में ऑफ़लाइन भी काम करता है।", ta: "ஆப் போல் திறக்கும், கடலில் ஆஃப்லைனிலும் இயங்கும்." },
  "pwa.installBtn":      { en: "Install", hi: "इंस्टॉल करें", ta: "நிறுவு" },
  "pwa.installLater":    { en: "Not now", hi: "अभी नहीं", ta: "இப்போது வேண்டாம்" },
  "pwa.iosHint":         { en: "Tap the Share button, then “Add to Home Screen”.", hi: "शेयर बटन दबाएँ, फिर “होम स्क्रीन में जोड़ें” चुनें।", ta: "பகிர் பொத்தானைத் தட்டி, “முகப்புத் திரையில் சேர்” என்பதைத் தேர்ந்தெடுக்கவும்." },

  "persona.title":       { en: "Welcome to OceanMind", hi: "OceanMind में आपका स्वागत है", ta: "OceanMind க்கு வரவேற்கிறோம்" },
  "persona.subtitle":    { en: "How will you use it? You can switch anytime.", hi: "आप इसे कैसे उपयोग करेंगे? आप कभी भी बदल सकते हैं।", ta: "இதை எப்படி பயன்படுத்துவீர்கள்? எப்போது வேண்டுமானாலும் மாற்றலாம்." },
  "persona.fisher":      { en: "I'm a Fisher", hi: "मैं मछुआरा हूँ", ta: "நான் ஒரு மீனவர்" },
  "persona.fisherDesc":  { en: "Today's zones, weather & safety", hi: "आज के क्षेत्र, मौसम और सुरक्षा", ta: "இன்றைய மண்டலங்கள், வானிலை & பாதுகாப்பு" },
  "persona.researcher":  { en: "I'm a Researcher", hi: "मैं शोधकर्ता हूँ", ta: "நான் ஒரு ஆராய்ச்சியாளர்" },
  "persona.researcherDesc": { en: "Full data & analysis console", hi: "पूरा डेटा और विश्लेषण कंसोल", ta: "முழு தரவு & பகுப்பாய்வு பலகை" },
  "persona.skip":        { en: "Just show me everything", hi: "मुझे सब कुछ दिखाएँ", ta: "எல்லாவற்றையும் காட்டு" },

  // First-run fisher tour — a plain-language preview of what the app does.
  "tour.badge":          { en: "Quick tour", hi: "झटपट परिचय", ta: "விரைவு அறிமுகம்" },
  "tour.title":          { en: "What OceanMind does for you", hi: "OceanMind आपके लिए क्या करता है", ta: "OceanMind உங்களுக்கு என்ன செய்கிறது" },
  "tour.subtitle":       { en: "A quick look at everything you can do. Tap anything to open it.", hi: "आप जो कुछ कर सकते हैं उसकी एक झलक। खोलने के लिए किसी पर टैप करें।", ta: "நீங்கள் செய்யக்கூடிய அனைத்தையும் ஒரு பார்வை. திறக்க எதையும் தட்டவும்." },
  "tour.verdict.t":      { en: "Should I go out today?", hi: "क्या आज समुद्र में जाऊँ?", ta: "இன்று கடலுக்கு செல்லலாமா?" },
  "tour.verdict.d":      { en: "One clear answer — GO, CAUTION or AVOID — from live wind, waves and weather.", hi: "एक साफ़ जवाब — जाएँ, सावधान या न जाएँ — लाइव हवा, लहर और मौसम से।", ta: "ஒரு தெளிவான பதில் — செல்லலாம், எச்சரிக்கை அல்லது வேண்டாம் — நேரடி காற்று, அலை, வானிலையிலிருந்து." },
  "tour.zones.t":        { en: "Find the best fishing spot", hi: "सबसे अच्छी मछली जगह खोजें", ta: "சிறந்த மீன்பிடி இடத்தைக் கண்டறியுங்கள்" },
  "tour.zones.d":        { en: "See recommended zones near you and a compass that points to the closest one.", hi: "आपके पास अनुशंसित क्षेत्र देखें और एक कम्पास जो निकटतम तक ले जाए।", ta: "உங்களுக்கு அருகிலுள்ள பரிந்துரைக்கப்பட்ட மண்டலங்கள் மற்றும் அருகிலுள்ளதை நோக்கிக் காட்டும் திசைகாட்டி." },
  "tour.rules.t":        { en: "Know the fishing rules", hi: "मछली नियम जानें", ta: "மீன்பிடி விதிகளை அறியுங்கள்" },
  "tour.rules.d":        { en: "See instantly if fishing is allowed where you are — bans and protected areas.", hi: "तुरंत देखें कि आप जहाँ हैं वहाँ मछली पकड़ने की अनुमति है या नहीं — प्रतिबंध और संरक्षित क्षेत्र।", ta: "நீங்கள் இருக்கும் இடத்தில் மீன்பிடி அனுமதிக்கப்படுகிறதா என உடனே பாருங்கள் — தடைகள் மற்றும் பாதுகாக்கப்பட்ட பகுதிகள்." },
  "tour.safety.t":       { en: "Stay safe at sea", hi: "समुद्र में सुरक्षित रहें", ta: "கடலில் பாதுகாப்பாக இருங்கள்" },
  "tour.safety.d":       { en: "Track your trip, get a reminder to head back before dark, and send SOS with your location.", hi: "अपनी यात्रा ट्रैक करें, अंधेरा होने से पहले लौटने की याद पाएँ, और अपने स्थान के साथ SOS भेजें।", ta: "உங்கள் பயணத்தைக் கண்காணியுங்கள், இருள் முன் திரும்ப நினைவூட்டல் பெறுங்கள், உங்கள் இருப்பிடத்துடன் SOS அனுப்புங்கள்." },
  "tour.catch.t":        { en: "Log your catch", hi: "अपनी पकड़ दर्ज करें", ta: "உங்கள் மீன்பிடியைப் பதிவு செய்யுங்கள்" },
  "tour.catch.d":        { en: "Record it in seconds and see where other fishers are catching nearby.", hi: "इसे सेकंडों में दर्ज करें और देखें कि आस-पास अन्य मछुआरे कहाँ पकड़ रहे हैं।", ta: "சில விநாடிகளில் பதிவு செய்து, அருகில் மற்ற மீனவர்கள் எங்கே பிடிக்கிறார்கள் என்று பாருங்கள்." },
  "tour.scan.t":         { en: "Scan a fish to name it", hi: "मछली स्कैन कर पहचानें", ta: "மீனை ஸ்கேன் செய்து அடையாளம் காணுங்கள்" },
  "tour.scan.d":         { en: "Not sure what it is? Take a photo and the app identifies the species.", hi: "पक्का नहीं कौन-सी है? फ़ोटो लें और ऐप प्रजाति पहचान लेगा।", ta: "எது என்று தெரியவில்லையா? புகைப்படம் எடுங்கள், ஆப் இனத்தை அடையாளம் காணும்." },
  "tour.voice.t":        { en: "Ask in your language", hi: "अपनी भाषा में पूछें", ta: "உங்கள் மொழியில் கேளுங்கள்" },
  "tour.voice.d":        { en: "Ask by voice or text in Hindi, Tamil or English and hear the answer back.", hi: "हिंदी, तमिल या अंग्रेज़ी में बोलकर या टाइप करके पूछें और जवाब सुनें।", ta: "இந்தி, தமிழ் அல்லது ஆங்கிலத்தில் பேசியோ தட்டச்சு செய்தோ கேளுங்கள், பதிலைக் கேளுங்கள்." },
  "tour.cta":            { en: "Start using OceanMind", hi: "OceanMind उपयोग करना शुरू करें", ta: "OceanMind ஐப் பயன்படுத்தத் தொடங்குங்கள்" },
  "tour.footer":         { en: "Reopen this anytime from the ? button at the top.", hi: "इसे ऊपर ? बटन से कभी भी दोबारा खोलें।", ta: "மேலே உள்ள ? பொத்தானில் இருந்து எப்போது வேண்டுமானாலும் மீண்டும் திறக்கலாம்." },
  "tour.reopen":         { en: "What can this app do?", hi: "यह ऐप क्या कर सकता है?", ta: "இந்த ஆப் என்ன செய்யும்?" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function useI18n() {
  return useContext(Ctx);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("oceanmind_lang") as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("oceanmind_lang", l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = T[key];
      let str = entry ? entry[lang] ?? entry.en : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}
