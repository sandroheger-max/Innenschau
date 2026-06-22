import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Play, Pause, Sparkles, Download, Loader2, Mic, ChevronLeft, ChevronRight, Search, X, Volume2, VolumeX } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { addDays, computeLongest, computeStrength, mergeMorning, mergeEvening, storage } from "./logic.js";

const C = {
  paper: "#FCF7EF",
  ink: "#2B2420",
  inkSoft: "#6B6258",
  line: "#E8DFD1",
  coral: "#F0563A",
  coralSoft: "#FDE2DA",
  sage: "#2E9B73",
  sageSoft: "#DCF1E7",
  gold: "#E0A52E",
  goldSoft: "#FBEDD2",
  lavender: "#7858D6",
  lavenderSoft: "#EAE3FA",
};

const G = {
  coral: `linear-gradient(135deg, #F0563A, #FF8A5C)`,
  sage: `linear-gradient(135deg, #2E9B73, #5CC79B)`,
  gold: `linear-gradient(135deg, #E0A52E, #F6C75A)`,
  lavender: `linear-gradient(135deg, #7858D6, #A07EEF)`,
  spectrum: `linear-gradient(90deg, #F0563A, #E0A52E, #2E9B73, #7858D6)`,
  morning: `linear-gradient(135deg, #FBEDD2, #FDE2DA)`,
  evening: `linear-gradient(135deg, #EAE3FA, #D9CEF5)`,
  steel: `linear-gradient(135deg, #6B6258, #938A7E)`,
};

const DISPLAY = "'Fraunces', Georgia, serif";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const MOOD_COLORS = [C.inkSoft, C.lavender, C.gold, C.sage, C.coral];
const TAB_COLOR = { eintrag: C.coral, ziele: C.sage, verlauf: C.gold, ruhe: C.lavender };

const AREAS = ["Beruf & Karriere", "Finanzen", "Gesundheit", "Beziehungen", "Persönliche Entwicklung", "Sonstiges"];
const MOODS = [
  { v: 1, label: "Schwer" }, { v: 2, label: "Angespannt" }, { v: 3, label: "Neutral" },
  { v: 4, label: "Gut" }, { v: 5, label: "Stark" },
];
const TAGS = ["Sport", "Schlaf gut", "Arbeit", "Sozial", "Natur", "Entspannung"];
const REFLECTION_PROMPTS = [
  "Was hat sich verbessert – und sei es noch so klein?",
  "Worauf bin ich heute stolz?",
  "Was war heute die grösste Herausforderung?",
  "Was habe ich heute gelernt?",
  "Wem bin ich heute dankbar begegnet?",
];
const STILL_QUESTIONS = [
  "Wovor laufe ich gerade davon?",
  "Was würde sich ändern, wenn ich mir selbst vertrauen würde?",
  "Wann habe ich mich heute am meisten wie ich selbst gefühlt?",
  "Was brauche ich gerade wirklich – und was glaube ich nur, dass ich es brauche?",
  "Wenn nichts schiefgehen könnte, was würde ich morgen anders machen?",
];
const MUSIK = [
  { kat: "Ambient", beispiel: "Brian Eno – Ambient 1: Music for Airports" },
  { kat: "Klassik, ruhig", beispiel: "Max Richter – Sleep" },
  { kat: "Klavier solo", beispiel: "Erik Satie – Gymnopédies" },
  { kat: "Naturklänge", beispiel: "Regen, Wald oder Meeresrauschen" },
  { kat: "Binaurale Beats", beispiel: "432Hz oder 528Hz Suchbegriffe" },
  { kat: "Lo-fi", beispiel: "\"lofi study beats\" Playlists" },
];
const YOGA = [
  { name: "Kindhaltung", sanskrit: "Balasana", dauer: "2–3 Min", wofür: "Erdung",
    text: "Knie auf der Matte, Gesäss zu den Fersen, Oberkörper nach vorne ablegen. Stirn berührt den Boden, Arme locker. Atme ruhig in den Rücken.",
    d: "M6 24 Q16 8 26 24" },
  { name: "Sitzende Vorwärtsbeuge", sanskrit: "Paschimottanasana", dauer: "2 Min", wofür: "Stille",
    text: "Im Sitzen die Beine ausstrecken, mit langem Rücken nach vorne über die Beine falten. Kein Ziehen, kein Zwingen — so weit wie es sich gut anfühlt.",
    d: "M16 6 V26 M9 16 H23" },
  { name: "Beine an der Wand", sanskrit: "Viparita Karani", dauer: "5–10 Min", wofür: "Beruhigung",
    text: "Rücken auf dem Boden, Gesäss nah an einer Wand, Beine senkrecht daran ablegen. Beruhigt das Nervensystem spürbar — gut am Abend.",
    d: "M7 26 H25 M16 26 V6" },
  { name: "Liegende Drehung", sanskrit: "Supta Matsyendrasana", dauer: "2 Min pro Seite", wofür: "Loslassen",
    text: "Rückenlage, ein Knie zur gegenüberliegenden Seite über den Körper legen, Arme seitlich ausgebreitet. Löst Spannung in Rücken und Hüfte.",
    d: "M8 10 Q17 10 17 16 Q17 22 25 22" },
];
const MEDITATION_STEPS = [
  "Setz oder leg dich bequem hin. Augen schliessen oder Blick senken.",
  "Drei tiefe Atemzüge — einfach beobachten, nichts verändern.",
  "Spüre deine Füsse, deine Beine. Lass sie schwer werden.",
  "Wandere mit der Aufmerksamkeit zum Bauch, zur Brust, zu den Schultern.",
  "Lass die Schultern sinken, den Kiefer lockern.",
  "Spüre den ganzen Körper auf einmal — einfach da sein.",
  "Wenn du bereit bist, öffne langsam die Augen.",
];

function parseProToken(token) {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const { payload } = JSON.parse(atob(padded));
    return JSON.parse(payload);
  } catch { return null; }
}
function isProTokenValid(token) {
  if (!token) return false;
  const p = parseProToken(token);
  return !!(p && p.exp > Date.now());
}

const SpeechRecognitionAPI = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;


function pad(n) { return String(n).padStart(2, "0"); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function fmt(key) { const [y, m, d] = key.split("-"); return `${d}.${m}.${y}`; }
function fmtShort(key) { const [, m, d] = key.split("-"); return `${d}.${m}.`; }
function dayOfYear(d) { const start = new Date(d.getFullYear(), 0, 0); return Math.floor((d - start) / 86400000); }
function todaysPrompt() { return REFLECTION_PROMPTS[dayOfYear(new Date()) % REFLECTION_PROMPTS.length]; }
function todaysQuestion() { return STILL_QUESTIONS[dayOfYear(new Date()) % STILL_QUESTIONS.length]; }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

function MicButton({ active, onClick, color }) {
  if (!SpeechRecognitionAPI) return null;
  return (
    <button type="button" onClick={onClick}
      style={{ color: active ? color : C.inkSoft, animation: active ? "pulse 1.2s infinite" : "none" }}
      className="ml-2 inline-flex items-center">
      <Mic size={14} />
    </button>
  );
}

function Card({ children, tint, className = "" }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${className}`} style={{ backgroundColor: tint || "white", border: `1px solid ${C.line}` }}>
      {children}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("eintrag");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState({});
  const [goals, setGoals] = useState([]);
  const [saved, setSaved] = useState(false);
  const [quickMode, setQuickMode] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const [dayPart, setDayPart] = useState(() => (new Date().getHours() < 14 ? "morgen" : "abend"));
  const [mood, setMood] = useState(null);
  const [woStehe, setWoStehe] = useState("");
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [dankbarkeit, setDankbarkeit] = useState("");
  const [tags, setTags] = useState([]);
  const [linkedGoalId, setLinkedGoalId] = useState(null);
  const [intention, setIntention] = useState("");
  const [gratitudeFor, setGratitudeFor] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [savedMorning, setSavedMorning] = useState(false);
  const [activeMic, setActiveMic] = useState(null);
  const recognitionRef = useRef(null);

  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalArea, setNewGoalArea] = useState(AREAS[0]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiRange, setAiRange] = useState(14);

  const [proToken, setProToken] = useState(null);
  const [proEmail, setProEmail] = useState("");
  const [proEmailInput, setProEmailInput] = useState("");
  const [proStatus, setProStatus] = useState("idle"); // idle | checking | active | inactive | error
  const [pendingProEmail, setPendingProEmail] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState(null);

  const promptText = todaysPrompt();

  useEffect(() => {
    (async () => {
      let e = {}, g = [];
      try { const r = await storage.get("entries"); if (r?.value) e = JSON.parse(r.value); } catch (err) {}
      try { const r = await storage.get("goals"); if (r?.value) g = JSON.parse(r.value); } catch (err) {}
      setEntries(e);
      setGoals(g);
      const t = e[todayKey()];
      if (t) {
        setMood(t.mood ?? null);
        setWoStehe(t.woStehe ?? "");
        setReflectionAnswer(t.reflectionAnswer ?? t.wasVerbessert ?? "");
        setDankbarkeit(t.dankbarkeit ?? "");
        setTags(t.tags ?? []);
        setLinkedGoalId(t.goalId ?? null);
        if (t.morning) {
          setIntention(t.morning.intention ?? "");
          setGratitudeFor(t.morning.gratitudeFor ?? "");
          setAffirmation(t.morning.affirmation ?? "");
        }
      }
      // Load PRO subscription token from localStorage
      const savedToken = localStorage.getItem("innenschau:proToken");
      const savedEmail = localStorage.getItem("innenschau:proEmail");
      if (savedEmail) setProEmailInput(savedEmail);
      if (savedToken && isProTokenValid(savedToken)) {
        setProToken(savedToken);
        setProEmail(savedEmail || "");
        setProStatus("active");
      } else if (savedEmail) {
        setProStatus("inactive");
      }

      // Handle redirect back from Stripe Checkout
      const urlParams = new URLSearchParams(window.location.search);
      const proParam = urlParams.get("pro");
      const emailParam = urlParams.get("email");
      if (proParam) window.history.replaceState({}, "", "/");
      if (proParam === "success" && emailParam) {
        setPendingProEmail(decodeURIComponent(emailParam));
      }

      setLoading(false);
    })();
    return () => recognitionRef.current?.stop();
  }, []);

  const saveEntries = useCallback(async (next) => {
    setEntries(next);
    try { await storage.set("entries", JSON.stringify(next)); } catch (err) { console.error(err); }
  }, []);
  const saveGoals = useCallback(async (next) => {
    setGoals(next);
    try { await storage.set("goals", JSON.stringify(next)); } catch (err) { console.error(err); }
  }, []);

  const checkSubscription = useCallback(async (email) => {
    const trimmed = email.trim().toLowerCase();
    setProStatus("checking");
    try {
      const res = await fetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (data.hasSubscription && data.token) {
        setProToken(data.token);
        setProEmail(trimmed);
        setProStatus("active");
        localStorage.setItem("innenschau:proToken", data.token);
        localStorage.setItem("innenschau:proEmail", trimmed);
      } else if (data.checkoutUrl) {
        setProStatus("inactive");
        window.location.href = data.checkoutUrl;
      } else {
        setProStatus("inactive");
      }
    } catch {
      setProStatus("error");
    }
  }, []);

  useEffect(() => {
    if (pendingProEmail) {
      checkSubscription(pendingProEmail);
      setPendingProEmail(null);
    }
  }, [pendingProEmail, checkSubscription]);

  function toggleTag(t) { setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])); }
  function stopMic() { recognitionRef.current?.stop(); setActiveMic(null); }
  function appendToField(field, text) {
    const setters = { woStehe: setWoStehe, reflectionAnswer: setReflectionAnswer, dankbarkeit: setDankbarkeit, intention: setIntention, gratitudeFor: setGratitudeFor, affirmation: setAffirmation };
    setters[field]((prev) => (prev ? prev + " " : "") + text);
  }
  function toggleMic(field) {
    if (!SpeechRecognitionAPI) return;
    if (activeMic === field) { stopMic(); return; }
    if (activeMic) stopMic();
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "de-DE"; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      appendToField(field, transcript.trim());
    };
    recognition.onend = () => setActiveMic(null);
    recognition.onerror = () => setActiveMic(null);
    recognition.start();
    recognitionRef.current = recognition;
    setActiveMic(field);
  }

  function handleSaveMorning() {
    stopMic();
    saveEntries(mergeMorning(entries, todayKey(), { intention, gratitudeFor, affirmation }));
    setSavedMorning(true);
    setTimeout(() => setSavedMorning(false), 1800);
  }

  function handleSaveEntry() {
    stopMic();
    saveEntries(mergeEvening(entries, todayKey(), { mood, woStehe, reflectionAnswer, reflectionPrompt: promptText, dankbarkeit, tags, goalId: linkedGoalId }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function addGoal() {
    if (!newGoalText.trim()) return;
    const next = [...goals, { id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), text: newGoalText.trim(), area: newGoalArea, progress: 0, createdAt: todayKey() }];
    saveGoals(next);
    setNewGoalText("");
  }
  function updateGoalProgress(id, progress) { saveGoals(goals.map((g) => (g.id === id ? { ...g, progress } : g))); }
  function deleteGoal(id) { saveGoals(goals.filter((g) => g.id !== id)); }
  function answerOf(e) { return e.reflectionAnswer || e.wasVerbessert || ""; }

  function exportEntries() {
    const lines = sortedKeys.map((k) => {
      const e = entries[k];
      const goalText = e.goalId ? goals.find((g) => g.id === e.goalId)?.text : null;
      return [
        `${fmt(k)}`, `Stimmung: ${e.mood ?? "-"}/5`,
        e.morning?.intention ? `Vorsatz (Morgen): ${e.morning.intention}` : null,
        e.morning?.gratitudeFor ? `Dankbarkeit (Morgen): ${e.morning.gratitudeFor}` : null,
        e.morning?.affirmation ? `Bestätigung: ${e.morning.affirmation}` : null,
        e.tags?.length ? `Tags: ${e.tags.join(", ")}` : null,
        e.woStehe ? `Wo stehe ich: ${e.woStehe}` : null,
        answerOf(e) ? `${e.reflectionPrompt || "Was hat sich verbessert"}: ${answerOf(e)}` : null,
        e.dankbarkeit ? `Gut heute: ${e.dankbarkeit}` : null,
        goalText ? `Verknüpftes Ziel: ${goalText}` : null, "",
      ].filter(Boolean).join("\n");
    }).join("\n");
    const blob = new Blob([`INNENSCHAU — Export\n\n${lines}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `innenschau-export-${todayKey()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function runAIAnalysis() {
    setAiError(""); setAiResult(""); setAiLoading(true);
    const recentKeys = sortedKeys.slice(-aiRange);
    const minNeeded = aiRange === 30 ? 5 : 3;
    if (recentKeys.length < minNeeded) {
      setAiError(`Noch zu wenige Einträge — schreib mindestens ${minNeeded} Tage in diesem Zeitraum, dann gibt's eine Analyse.`);
      setAiLoading(false);
      return;
    }
    const lines = recentKeys.map((k) => {
      const e = entries[k];
      const morningPart = e.morning?.intention ? `, Vorsatz morgens: ${e.morning.intention}` : "";
      return `${fmt(k)}: Stimmung ${e.mood ?? "-"}/5, Tags: ${(e.tags || []).join(", ") || "keine"}${morningPart}, ${e.reflectionPrompt || "Reflexion"}: ${answerOf(e) || "-"}, Wo stehe ich: ${e.woStehe || "-"}`;
    }).join("\n");
    const periodLabel = aiRange === 30 ? "des letzten Monats" : "der letzten zwei Wochen";
    const prompt = `Du bist ein einfühlsamer, aber ehrlicher Reflexions-Coach. Hier sind die Tagebucheinträge ${periodLabel} einer Person (${recentKeys.length} Einträge):\n\n${lines}\n\nSchreibe eine kurze Analyse auf Deutsch (maximal 6 Sätze, Fliesstext, keine Überschriften, keine Aufzählungszeichen): 1) Ein Muster, das auffällt, idealerweise ein Zusammenhang zwischen Tags und Stimmung${aiRange === 30 ? " oder eine Entwicklung über den Monat hinweg" : ""}. 2) Eine ehrliche, wohlwollende Beobachtung zum Fortschritt. 3) Eine konkrete, kleine Anregung für die kommende Zeit. Schreib direkt und warm, ohne Floskeln, duze die Person.`;
    try {
      // In the Claude.ai artifact preview this call goes straight to the
      // Anthropic API. In a standalone deployed app, an API key must never
      // sit in browser code, so this calls your own backend instead — see
      // api/analyze.js, which holds the real Anthropic call server-side.
      const response = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, proToken }),
      });
      if (response.status === 402) {
        setProToken(null);
        setProStatus("inactive");
        localStorage.removeItem("innenschau:proToken");
        throw new Error("subscription_expired");
      }
      if (!response.ok) throw new Error("backend not reachable");
      const data = await response.json();
      const text = (data.text || "").trim();
      setAiResult(text || "Konnte keine Analyse erzeugen. Versuch es nochmal.");
    } catch (err) {
      setAiError(
        err.message === "subscription_expired"
          ? "Abo-Token abgelaufen. Bitte prüfe dein Abo erneut (E-Mail oben eingeben)."
          : "Analyse fehlgeschlagen. Prüf deine Verbindung und versuch es nochmal."
      );
    }
    finally { setAiLoading(false); }
  }

  const sortedKeys = Object.keys(entries).sort();
  const last14 = sortedKeys.slice(-14).map((k) => ({ date: fmtShort(k), mood: entries[k].mood }));
  const loggedDays = sortedKeys.length;
  const longestStreak = computeLongest(sortedKeys);
  const strength = computeStrength(sortedKeys, 14);

  const tagStats = TAGS.map((t) => {
    const withTag = sortedKeys.filter((k) => (entries[k].tags || []).includes(t) && entries[k].mood);
    if (withTag.length < 2) return null;
    const avg = withTag.reduce((s, k) => s + entries[k].mood, 0) / withTag.length;
    return { tag: t, avg, n: withTag.length };
  }).filter(Boolean).sort((a, b) => b.avg - a.avg);

  const lookbackKey = addDays(todayKey(), -28);
  const lookbackEntry = entries[lookbackKey];
  const lookbackText = lookbackEntry ? (answerOf(lookbackEntry) || lookbackEntry.woStehe) : null;

  const filteredKeys = sortedKeys.slice().reverse().filter((k) => {
    const e = entries[k];
    const text = `${e.woStehe || ""} ${answerOf(e)} ${e.dankbarkeit || ""} ${(e.tags || []).join(" ")}`.toLowerCase();
    const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || (e.tags || []).includes(filterTag);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.paper, fontFamily: MONO, color: C.inkSoft }}>lädt…</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.paper, fontFamily: SANS, color: C.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:4px;background:${C.line};}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${C.sage};cursor:pointer;margin-top:-6px;box-shadow:0 1px 3px rgba(0,0,0,0.2);}
        input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${C.sage};border:none;cursor:pointer;}
        textarea:focus, input:focus, select:focus{outline:2px solid ${C.coral};outline-offset:1px;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
      `}</style>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-24">
        <div className="flex items-end justify-between mb-1">
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 29, letterSpacing: "-0.01em", color: C.ink }}>Innenschau</h1>
          <span style={{ fontFamily: MONO, color: C.inkSoft, fontSize: 12 }}>{fmt(todayKey())}</span>
        </div>
        <p style={{ fontFamily: DISPLAY, fontStyle: "italic", color: C.inkSoft, fontSize: 15 }} className="mb-3">Tägliche Standortbestimmung</p>

        <div style={{ height: 7, borderRadius: 6, background: G.spectrum, boxShadow: "0 4px 14px -4px rgba(120,88,214,0.35)" }} className="mb-4" />

        <p style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft }} className="mb-6">
          {loggedDays} {loggedDays === 1 ? "Tag" : "Tage"} erfasst
          {loggedDays > 0 && ` · Stärke ${strength}%`}
          {longestStreak > 1 && ` · Rekord ${longestStreak} in Folge`}
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[["eintrag", "Eintrag"], ["ziele", "Ziele"], ["verlauf", "Verlauf"], ["ruhe", "Ruhe"]].map(([id, label]) => {
            const active = tab === id;
            const grad = { eintrag: G.coral, ziele: G.sage, verlauf: G.gold, ruhe: G.lavender }[id];
            return (
              <button key={id} onClick={() => setTab(id)}
                style={{ fontFamily: MONO, fontSize: 11, padding: "7px 14px", borderRadius: 999, background: active ? grad : "white", color: active ? "white" : C.inkSoft, border: `1px solid ${active ? "transparent" : C.line}`, boxShadow: active ? "0 4px 10px -5px rgba(0,0,0,0.3)" : "none" }}
                className="font-medium tracking-wide">
                {label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* EINTRAG */}
        {tab === "eintrag" && (
          <div className="space-y-6">
            <div className="rounded-2xl py-5 px-4 flex justify-center" style={{ background: dayPart === "morgen" ? G.morning : G.evening, transition: "background 0.5s ease" }}>
              <div className="flex rounded-full overflow-hidden bg-white/70 backdrop-blur-sm" style={{ border: `1px solid rgba(255,255,255,0.6)` }}>
                <button onClick={() => setDayPart("morgen")} style={{ fontFamily: MONO, fontSize: 11, padding: "7px 18px", background: dayPart === "morgen" ? G.gold : "transparent", color: dayPart === "morgen" ? "white" : C.inkSoft }}>🌅 MORGEN</button>
                <button onClick={() => setDayPart("abend")} style={{ fontFamily: MONO, fontSize: 11, padding: "7px 18px", background: dayPart === "abend" ? G.lavender : "transparent", color: dayPart === "abend" ? "white" : C.inkSoft }}>🌙 ABEND</button>
              </div>
            </div>

            {dayPart === "morgen" && (
              <div className="space-y-6">
                <p style={{ fontSize: 12, color: C.inkSoft }}>Ein kurzer Vorsatz für den Tag — bevor er dich einholt.</p>
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center">Was nehme ich mir heute vor?<MicButton active={activeMic === "intention"} onClick={() => toggleMic("intention")} color={C.gold} /></label>
                  <textarea value={intention} onChange={(e) => setIntention(e.target.value)} rows={2}
                    placeholder="Eine Absicht, kein Pflichtenheft."
                    className="w-full p-3 text-sm bg-white rounded-xl border resize-none" style={{ borderColor: C.line }} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center">Wofür bin ich heute Morgen dankbar?<MicButton active={activeMic === "gratitudeFor"} onClick={() => toggleMic("gratitudeFor")} color={C.gold} /></label>
                  <textarea value={gratitudeFor} onChange={(e) => setGratitudeFor(e.target.value)} rows={2}
                    placeholder="Auch etwas Kleines zählt."
                    className="w-full p-3 text-sm bg-white rounded-xl border resize-none" style={{ borderColor: C.line }} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center">Eine Bestätigung für heute<MicButton active={activeMic === "affirmation"} onClick={() => toggleMic("affirmation")} color={C.gold} /></label>
                  <input value={affirmation} onChange={(e) => setAffirmation(e.target.value)}
                    placeholder="z. B. Ich gehe heute einen Schritt nach dem anderen."
                    className="w-full p-3 text-sm bg-white rounded-xl border" style={{ borderColor: C.line }} />
                </div>
                <button onClick={handleSaveMorning} className="w-full py-3.5 rounded-full tracking-wide"
                  style={{ background: savedMorning ? G.sage : G.gold, color: "white", fontFamily: MONO, fontSize: 13, boxShadow: "0 6px 16px -6px rgba(224,165,46,0.5)" }}>
                  {savedMorning ? "GESPEICHERT" : "VORSATZ SPEICHERN"}
                </button>
              </div>
            )}

            {dayPart === "abend" && (
              <div className="space-y-6">
                {lookbackText && (
                  <Card tint={C.goldSoft} className="!border-0">
                    <p style={{ fontFamily: MONO, fontSize: 10, color: C.gold }} className="mb-1">VOR 4 WOCHEN, AM {fmt(lookbackKey)}</p>
                    <p className="text-sm" style={{ color: C.ink }}>{lookbackText}</p>
                  </Card>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Wie fühlt sich heute an?</label>
                  <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
                    <button onClick={() => setQuickMode(true)} style={{ fontFamily: MONO, fontSize: 10, padding: "5px 12px", backgroundColor: quickMode ? C.coral : "white", color: quickMode ? "white" : C.inkSoft }}>SCHNELL</button>
                    <button onClick={() => setQuickMode(false)} style={{ fontFamily: MONO, fontSize: 10, padding: "5px 12px", backgroundColor: !quickMode ? C.coral : "white", color: !quickMode ? "white" : C.inkSoft }}>AUSFÜHRLICH</button>
                  </div>
                </div>

            <div className="flex justify-between gap-1">
              {MOODS.map((m) => {
                const moodGrad = [G.steel, G.lavender, G.gold, G.sage, G.coral][m.v - 1];
                return (
                  <button key={m.v} onClick={() => setMood(m.v)} className="flex flex-col items-center gap-1.5 flex-1">
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${mood === m.v ? "transparent" : C.line}`, background: mood === m.v ? moodGrad : "white", boxShadow: mood === m.v ? "0 4px 10px -4px rgba(0,0,0,0.25)" : "none" }} />
                    <span style={{ fontSize: 10, color: mood === m.v ? C.ink : C.inkSoft, fontFamily: MONO }}>{m.label}</span>
                  </button>
                );
              })}
            </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Was hat heute dazugehört?</label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((t) => (
                      <button key={t} onClick={() => toggleTag(t)} className="rounded-full"
                        style={{ fontSize: 12, padding: "6px 14px", border: `1px solid ${tags.includes(t) ? C.sage : C.line}`, backgroundColor: tags.includes(t) ? C.sage : "white", color: tags.includes(t) ? "white" : C.inkSoft }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {goals.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Mit Ziel verknüpfen?</label>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setLinkedGoalId(null)} className="rounded-full"
                        style={{ fontSize: 12, padding: "6px 14px", border: `1px solid ${!linkedGoalId ? C.ink : C.line}`, backgroundColor: !linkedGoalId ? C.ink : "white", color: !linkedGoalId ? "white" : C.inkSoft }}>
                        Kein Ziel
                      </button>
                      {goals.map((g) => (
                        <button key={g.id} onClick={() => setLinkedGoalId(g.id)} className="rounded-full"
                          style={{ fontSize: 12, padding: "6px 14px", border: `1px solid ${linkedGoalId === g.id ? C.sage : C.line}`, backgroundColor: linkedGoalId === g.id ? C.sage : "white", color: linkedGoalId === g.id ? "white" : C.inkSoft }}>
                          {truncate(g.text, 18)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(!quickMode || showDetails) && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center">Wo stehe ich heute?<MicButton active={activeMic === "woStehe"} onClick={() => toggleMic("woStehe")} color={C.coral} /></label>
                      <textarea value={woStehe} onChange={(e) => setWoStehe(e.target.value)} rows={3}
                        placeholder="Kurz, ehrlich, ohne zu werten."
                        className="w-full p-3 text-sm bg-white rounded-xl border resize-none" style={{ borderColor: C.line }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center">{promptText}<MicButton active={activeMic === "reflectionAnswer"} onClick={() => toggleMic("reflectionAnswer")} color={C.coral} /></label>
                      <textarea value={reflectionAnswer} onChange={(e) => setReflectionAnswer(e.target.value)} rows={3}
                        placeholder="Ein Gespräch, eine Entscheidung, ein Schritt."
                        className="w-full p-3 text-sm bg-white rounded-xl border resize-none" style={{ borderColor: C.line }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center">Eine Sache, die heute gut war<MicButton active={activeMic === "dankbarkeit"} onClick={() => toggleMic("dankbarkeit")} color={C.coral} /></label>
                      <input value={dankbarkeit} onChange={(e) => setDankbarkeit(e.target.value)}
                        className="w-full p-3 text-sm bg-white rounded-xl border" style={{ borderColor: C.line }} />
                    </div>
                  </>
                )}

                {quickMode && !showDetails && (
                  <button onClick={() => setShowDetails(true)} style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft }}>+ NOTIZ HINZUFÜGEN</button>
                )}

                <button onClick={handleSaveEntry} className="w-full py-3.5 rounded-full tracking-wide"
                  style={{ background: saved ? G.sage : G.coral, color: "white", fontFamily: MONO, fontSize: 13, boxShadow: "0 6px 16px -6px rgba(240,86,58,0.5)" }}>
                  {saved ? "GESPEICHERT" : "EINTRAG SPEICHERN"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ZIELE */}
        {tab === "ziele" && (
          <div className="space-y-6">
            <Card tint={C.sageSoft} className="!border-0 space-y-3">
              <input value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Neues Ziel formulieren…"
                className="w-full p-2.5 text-sm bg-white rounded-xl border" style={{ borderColor: C.line }} />
              <div className="flex gap-2">
                <select value={newGoalArea} onChange={(e) => setNewGoalArea(e.target.value)}
                  className="flex-1 p-2.5 text-sm bg-white rounded-xl border" style={{ borderColor: C.line, fontFamily: SANS }}>
                  {AREAS.map((a) => <option key={a}>{a}</option>)}
                </select>
                <button onClick={addGoal} style={{ backgroundColor: C.sage, color: "white" }} className="px-4 rounded-xl flex items-center justify-center">
                  <Plus size={18} />
                </button>
              </div>
            </Card>

            {goals.length === 0 && <p style={{ color: C.inkSoft, fontSize: 13 }}>Noch keine Ziele. Trag dein erstes ein.</p>}

            <div className="space-y-4">
              {goals.map((g) => {
                const linked = sortedKeys.filter((k) => entries[k].goalId === g.id);
                const lastNote = linked.length ? (answerOf(entries[linked[linked.length - 1]]) || entries[linked[linked.length - 1]].woStehe) : null;
                return (
                  <Card key={g.id}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p style={{ fontFamily: MONO, fontSize: 10, color: C.sage }}>{g.area.toUpperCase()}</p>
                        <p className="text-sm font-medium">{g.text}</p>
                      </div>
                      <button onClick={() => deleteGoal(g.id)} style={{ color: C.inkSoft }}><Trash2 size={15} /></button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <input type="range" min={0} max={100} value={g.progress}
                        onChange={(e) => updateGoalProgress(g.id, Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #2E9B73 ${g.progress}%, ${C.line} ${g.progress}%)` }} />
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.sage, minWidth: 36, textAlign: "right" }}>{g.progress}%</span>
                    </div>
                    {linked.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                        <p style={{ fontFamily: MONO, fontSize: 10, color: C.inkSoft }} className="mb-1">{linked.length} VERKNÜPFTE{linked.length === 1 ? "R" : ""} EINTRAG{linked.length === 1 ? "" : "E"}</p>
                        {lastNote && <p className="text-xs truncate" style={{ color: C.inkSoft }}>Zuletzt: {lastNote}</p>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* VERLAUF */}
        {tab === "verlauf" && (
          <div className="space-y-6">
            {sortedKeys.length === 0 && <p style={{ color: C.inkSoft, fontSize: 13 }}>Noch keine Einträge. Beginne heute unter Eintrag.</p>}

            {sortedKeys.length > 0 && (
              <Card tint={C.goldSoft} className="!border-0">
                <p style={{ fontFamily: MONO, fontSize: 11, color: C.gold }} className="flex items-center gap-1.5 mb-3">
                  KI-ANALYSE
                  <span style={{ backgroundColor: C.gold, color: "white", fontSize: 9, padding: "1px 7px", borderRadius: 999 }}>PRO</span>
                </p>
                {proStatus !== "active" ? (
                  <div>
                    <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6 }} className="mb-3">
                      Claude erkennt Muster in deinen Einträgen — Zusammenhänge zwischen Stimmung, Aktivitäten und Fortschritt.
                    </p>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: C.gold }} className="mb-4">CHF 4.90 / MONAT · JEDERZEIT KÜNDBAR</p>
                    {proStatus === "checking" ? (
                      <div className="flex items-center gap-2" style={{ color: C.inkSoft, fontSize: 13 }}>
                        <Loader2 size={14} className="animate-spin" /> Wird überprüft…
                      </div>
                    ) : (
                      <>
                        <input value={proEmailInput} onChange={(e) => setProEmailInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && proEmailInput.trim() && checkSubscription(proEmailInput)}
                          placeholder="Deine E-Mail-Adresse" type="email"
                          className="w-full p-3 text-sm bg-white rounded-xl border mb-2" style={{ borderColor: C.line }} />
                        <button onClick={() => proEmailInput.trim() && checkSubscription(proEmailInput)}
                          disabled={!proEmailInput.trim()}
                          style={{ background: G.gold, color: "white", fontSize: 13, boxShadow: "0 6px 14px -6px rgba(224,165,46,0.55)", opacity: proEmailInput.trim() ? 1 : 0.5 }}
                          className="w-full py-3 rounded-full flex items-center justify-center gap-2">
                          <Sparkles size={14} />
                          {proStatus === "inactive" && proEmail ? "Erneut prüfen" : "Pro freischalten"}
                        </button>
                        {proStatus === "error" && <p style={{ fontSize: 12, color: C.coral }} className="mt-2">Verbindung fehlgeschlagen — bitte nochmal versuchen.</p>}
                        {proStatus === "inactive" && proEmail && <p style={{ fontSize: 12, color: C.inkSoft }} className="mt-2">Kein aktives Abo für {proEmail} gefunden.</p>}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.sage }}>✓ AKTIV · {proEmail}</span>
                      <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${C.gold}` }}>
                        <button onClick={() => setAiRange(14)} style={{ fontFamily: MONO, fontSize: 10, padding: "3px 9px", backgroundColor: aiRange === 14 ? C.gold : "white", color: aiRange === 14 ? "white" : C.gold }}>14 TAGE</button>
                        <button onClick={() => setAiRange(30)} style={{ fontFamily: MONO, fontSize: 10, padding: "3px 9px", backgroundColor: aiRange === 30 ? C.gold : "white", color: aiRange === 30 ? "white" : C.gold }}>30 TAGE</button>
                      </div>
                    </div>
                    <button onClick={runAIAnalysis} disabled={aiLoading}
                      style={{ background: G.gold, color: "white", fontSize: 12, boxShadow: "0 6px 14px -6px rgba(224,165,46,0.55)" }}
                      className="px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-3">
                      {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      {aiLoading ? "Denkt nach…" : "Muster zeigen"}
                    </button>
                    {aiError && <p style={{ color: C.inkSoft, fontSize: 12 }}>{aiError}</p>}
                    {aiResult && <p style={{ fontSize: 13, lineHeight: 1.6 }}>{aiResult}</p>}
                    {!aiResult && !aiError && !aiLoading && <p style={{ color: C.inkSoft, fontSize: 12 }}>Lässt Claude Muster in deinen Einträgen finden.</p>}
                  </>
                )}
              </Card>
            )}

            <MoodCalendar entries={entries} />

            {sortedKeys.length > 1 && (
              <Card>
                <p style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft }} className="mb-3">STIMMUNG, LETZTE 14 EINTRÄGE</p>
                <div style={{ width: "100%", height: 140 }}>
                  <ResponsiveContainer>
                    <LineChart data={last14}>
                      <CartesianGrid stroke={C.line} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: MONO, fill: C.inkSoft }} axisLine={{ stroke: C.line }} tickLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fontFamily: MONO, fill: C.inkSoft }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip contentStyle={{ fontFamily: MONO, fontSize: 11, border: `1px solid ${C.line}`, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="mood" stroke={C.coral} strokeWidth={2.5} dot={{ r: 3, fill: C.coral }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {tagStats.length > 0 && (
              <Card>
                <p style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft }} className="mb-3">STIMMUNG NACH TAG</p>
                <div className="space-y-2">
                  {tagStats.map((s) => (
                    <div key={s.tag} className="flex items-center gap-3">
                      <span className="text-sm flex-1">{s.tag}</span>
                      <div style={{ width: 100, height: 7, borderRadius: 4, backgroundColor: C.sageSoft }}>
                        <div style={{ width: `${(s.avg / 5) * 100}%`, height: 7, borderRadius: 4, background: G.sage }} />
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft, minWidth: 60, textAlign: "right" }}>Ø {s.avg.toFixed(1)} ({s.n}x)</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {sortedKeys.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: C.inkSoft }} />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Einträge durchsuchen…"
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-white rounded-full border" style={{ borderColor: C.line }} />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: 11, color: C.inkSoft }}><X size={14} /></button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterTag(null)} className="rounded-full"
                    style={{ fontSize: 11, padding: "4px 12px", border: `1px solid ${!filterTag ? C.ink : C.line}`, backgroundColor: !filterTag ? C.ink : "white", color: !filterTag ? "white" : C.inkSoft }}>Alle</button>
                  {TAGS.map((t) => (
                    <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} className="rounded-full"
                      style={{ fontSize: 11, padding: "4px 12px", border: `1px solid ${filterTag === t ? C.sage : C.line}`, backgroundColor: filterTag === t ? C.sage : "white", color: filterTag === t ? "white" : C.inkSoft }}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            {sortedKeys.length > 0 && filteredKeys.length === 0 && <p style={{ color: C.inkSoft, fontSize: 13 }}>Keine Treffer.</p>}

            <div className="space-y-3">
              {filteredKeys.map((k) => (
                <div key={k} className="p-3 rounded-xl flex gap-3 bg-white" style={{ border: `1px solid ${C.line}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft, minWidth: 60 }}>{fmt(k)}</span>
                  <div className="flex-1 min-w-0">
                    {entries[k].morning?.intention && <p className="text-xs truncate" style={{ color: C.gold }}>🌅 {entries[k].morning.intention}</p>}
                    {answerOf(entries[k]) && <p className="text-sm truncate" style={{ color: C.ink }}>{answerOf(entries[k])}</p>}
                    {!answerOf(entries[k]) && entries[k].woStehe && <p className="text-sm truncate" style={{ color: C.inkSoft }}>{entries[k].woStehe}</p>}
                    {!answerOf(entries[k]) && !entries[k].woStehe && entries[k].tags?.length > 0 && <p className="text-sm truncate" style={{ color: C.inkSoft }}>{entries[k].tags.join(", ")}</p>}
                  </div>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: MOOD_COLORS[(entries[k].mood || 1) - 1], marginTop: 4 }} />
                </div>
              ))}
            </div>

            {sortedKeys.length > 0 && (
              <button onClick={exportEntries} style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft, border: `1px solid ${C.line}` }}
                className="w-full py-2.5 rounded-full flex items-center justify-center gap-2 bg-white">
                <Download size={13} /> ALLE EINTRÄGE EXPORTIEREN
              </button>
            )}
          </div>
        )}

        {tab === "ruhe" && <RuheTab />}
      </div>
    </div>
  );
}

function MoodCalendar({ entries }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  const todayStr = todayKey();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function moodStyle(mood) {
    if (!mood) return { backgroundColor: "white", border: `1px solid ${C.line}` };
    return { backgroundColor: MOOD_COLORS[mood - 1] };
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ color: C.inkSoft }}><ChevronLeft size={16} /></button>
        <p style={{ fontFamily: MONO, fontSize: 11, color: C.inkSoft, textTransform: "uppercase" }}>{monthLabel}</p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ color: C.inkSoft }}><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
          <div key={i} style={{ fontSize: 9, color: C.inkSoft, fontFamily: MONO, textAlign: "center" }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = `${year}-${pad(month + 1)}-${pad(d)}`;
          const mood = entries[key]?.mood;
          return (
            <div key={i} title={key} style={{ aspectRatio: "1", borderRadius: 8, ...moodStyle(mood), outline: key === todayStr ? `1.5px solid ${C.ink}` : "none", outlineOffset: 1 }} className="flex items-center justify-center">
              <span style={{ fontSize: 9, fontFamily: MONO, color: mood ? "white" : C.inkSoft }}>{d}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PoseIcon({ d }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d={d} stroke={C.lavender} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AmbientPlayer() {
  const [mode, setMode] = useState(null);
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);

  function stopAll() {
    nodesRef.current.forEach((n) => { try { n.stop?.(); } catch {} });
    nodesRef.current = [];
    if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
  }

  function startMode(m) {
    stopAll();
    if (!m) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const nodes = [];

    if (m === "rain" || m === "waves") {
      const bufSize = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * w) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      nodes.push(src);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = m === "waves" ? 280 : 420;
      const gain = ctx.createGain();
      gain.gain.value = 0.65;
      src.connect(filter);
      filter.connect(gain);
      if (m === "waves") {
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.08;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.28;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        nodes.push(lfo);
      }
      gain.connect(ctx.destination);
      src.start();
    }

    if (m === "hum") {
      [80, 160, 240].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0.07 / (i + 1);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        nodes.push(osc);
      });
    }

    nodesRef.current = nodes;
  }

  function select(m) {
    const next = m === mode ? null : m;
    setMode(next);
    startMode(next);
  }

  useEffect(() => () => stopAll(), []);

  const SOUNDS = [
    { id: "rain", label: "Regen" },
    { id: "waves", label: "Wellen" },
    { id: "hum", label: "Summen" },
  ];

  return (
    <Card tint={C.lavenderSoft} className="!border-0">
      <p style={{ fontFamily: MONO, fontSize: 10, color: C.lavender }} className="mb-3">HINTERGRUNDKLANG</p>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => { setMode(null); stopAll(); }}
          style={{ fontFamily: MONO, fontSize: 11, padding: "5px 12px", borderRadius: 999, background: !mode ? C.lavender : "white", color: !mode ? "white" : C.inkSoft, border: `1px solid ${!mode ? "transparent" : C.line}` }}>
          AUS
        </button>
        {SOUNDS.map(({ id, label }) => (
          <button key={id} onClick={() => select(id)}
            style={{ fontFamily: MONO, fontSize: 11, padding: "5px 12px", borderRadius: 999, background: mode === id ? C.lavender : "white", color: mode === id ? "white" : C.inkSoft, border: `1px solid ${mode === id ? "transparent" : C.line}` }}>
            {label.toUpperCase()}
          </button>
        ))}
        {mode && <span style={{ fontFamily: MONO, fontSize: 10, color: C.lavender, marginLeft: "auto" }}>◉ AKTIV</span>}
      </div>
    </Card>
  );
}

function RuheTab() {
  const [sub, setSub] = useState("atem");
  const [speaking, setSpeaking] = useState(false);
  const question = todaysQuestion();

  function toggleQuestion() {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speak(question, { onEnd: () => setSpeaking(false) });
    }
  }

  return (
    <div className="space-y-6">
      <Card tint={C.lavenderSoft} className="!border-0">
        <div className="flex items-start justify-between mb-2">
          <p style={{ fontFamily: MONO, fontSize: 10, color: C.lavender }}>FRAGE ZUM VERWEILEN</p>
          {window.speechSynthesis && (
            <button onClick={toggleQuestion} style={{ color: speaking ? C.lavender : C.inkSoft, marginTop: -2, flexShrink: 0 }}>
              {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}
        </div>
        <p style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 19, lineHeight: 1.4, color: C.ink }}>{question}</p>
      </Card>

      <AmbientPlayer />

      <div className="flex rounded-full overflow-hidden w-fit" style={{ border: `1px solid ${C.line}` }}>
        {[["atem", "Atem"], ["meditation", "Meditation"], ["yoga", "Yoga"], ["musik", "Musik"]].map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)}
            style={{ fontFamily: MONO, fontSize: 11, padding: "6px 14px", backgroundColor: sub === id ? C.lavender : "white", color: sub === id ? "white" : C.inkSoft }}>
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {sub === "atem" && <AtemUebung />}
      {sub === "meditation" && <GefuehrteMeditation />}

      {sub === "yoga" && (
        <div className="space-y-4">
          <p style={{ fontSize: 12, color: C.inkSoft }}>Eine kurze, sanfte Sequenz zum Runterkommen — 4 Haltungen, insgesamt etwa 12 Minuten. Bei Schmerzen abbrechen, keine dieser Übungen ersetzt physiotherapeutischen Rat.</p>
          {YOGA.map((p) => (
            <Card key={p.name} tint={C.lavenderSoft} className="!border-0">
              <div className="flex gap-4">
                <div style={{ width: 32, height: 32, flexShrink: 0 }}><PoseIcon d={p.d} /></div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <p style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, color: C.ink }}>{p.name}</p>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.lavender }}>{p.dauer}</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.inkSoft, fontStyle: "italic" }} className="mb-2">{p.sanskrit} · {p.wofür}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>{p.text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {sub === "musik" && (
        <div>
          <p style={{ fontSize: 12, color: C.inkSoft }} className="mb-3">Ich kann keine Musik abspielen oder Songtexte zeigen — aber das hier kannst du direkt bei Spotify oder YouTube suchen:</p>
          <div className="space-y-2">
            {MUSIK.map((m) => (
              <div key={m.kat} className="flex justify-between p-3 rounded-xl text-sm bg-white" style={{ border: `1px solid ${C.line}` }}>
                <span style={{ color: C.lavender, fontFamily: MONO, fontSize: 11 }}>{m.kat.toUpperCase()}</span>
                <span className="text-right">{m.beispiel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function speak(text, { onEnd } = {}) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "de-DE";
  utter.rate = 0.78;
  utter.pitch = 0.9;
  if (onEnd) utter.onend = onEnd;
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find((v) => v.lang.startsWith("de"));
    if (deVoice) utter.voice = deVoice;
    window.speechSynthesis.speak(utter);
  };
  // voices may load asynchronously (Firefox)
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = trySpeak;
  } else {
    trySpeak();
  }
}

function GefuehrteMeditation() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const intervalRef = useRef(null);
  const stepRef = useRef(0);
  const STEP_SECONDS = 18;

  function start() {
    stepRef.current = 0;
    setStep(0);
    setRunning(true);
    speak(MEDITATION_STEPS[0]);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setStep(0);
    stepRef.current = 0;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        const next = stepRef.current + 1;
        if (next >= MEDITATION_STEPS.length) {
          clearInterval(intervalRef.current);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setRunning(false);
          setStep(0);
          stepRef.current = 0;
          return;
        }
        stepRef.current = next;
        setStep(next);
        speak(MEDITATION_STEPS[next]);
      }, STEP_SECONDS * 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  return (
    <Card tint={C.lavenderSoft} className="!border-0 flex flex-col items-center py-8 text-center">
      <p style={{ fontFamily: MONO, fontSize: 11, color: C.lavender }} className="mb-6">GEFÜHRTE MEDITATION · ca. 2 Min</p>
      <p style={{ fontFamily: DISPLAY, fontSize: 18, lineHeight: 1.5, color: C.ink, minHeight: 80 }} className="mb-6 px-2">
        {running ? MEDITATION_STEPS[step] : "Eine kurze Reise zur Ruhe, Schritt für Schritt."}
      </p>
      <div className="flex gap-1.5 mb-6">
        {MEDITATION_STEPS.map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: running && i <= step ? C.lavender : C.line }} />
        ))}
      </div>
      <button onClick={running ? stop : start} style={{ backgroundColor: running ? C.ink : C.lavender, color: "white" }} className="px-6 py-2.5 rounded-full flex items-center gap-2 text-sm">
        {running ? <><Pause size={15} /> Stoppen</> : <><Play size={15} /> Starten</>}
      </button>
    </Card>
  );
}

const ATEM_PHASES = [
  { name: "Einatmen", secs: 4, expanded: true,  transition: "4s ease-in" },
  { name: "Halten",   secs: 7, expanded: true,  transition: "0.1s linear" },
  { name: "Ausatmen", secs: 8, expanded: false, transition: "8s ease-in-out" },
];

function AtemUebung() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(ATEM_PHASES[0].secs);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    let pi = 0, count = ATEM_PHASES[0].secs;
    setPhaseIdx(0);
    setCountdown(count);
    intervalRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        pi = (pi + 1) % ATEM_PHASES.length;
        count = ATEM_PHASES[pi].secs;
        setPhaseIdx(pi);
      }
      setCountdown(count);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function toggle() {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
      setPhaseIdx(0);
      setCountdown(ATEM_PHASES[0].secs);
    } else {
      setRunning(true);
    }
  }

  const phase = ATEM_PHASES[phaseIdx];
  const size = running && phase.expanded ? 126 : 70;

  return (
    <Card tint={C.lavenderSoft} className="!border-0 flex flex-col items-center py-8">
      <p style={{ fontFamily: MONO, fontSize: 11, color: C.lavender }} className="mb-6">ATEMÜBUNG · 4–7–8</p>
      <div className="flex items-center justify-center mb-4" style={{ width: 140, height: 140 }}>
        <div style={{
          width: size, height: size,
          borderRadius: "50%",
          backgroundColor: "white",
          border: `2px solid ${C.lavender}`,
          transition: running ? `width ${phase.transition}, height ${phase.transition}, box-shadow ${phase.transition}` : "width 0.4s ease, height 0.4s ease",
          boxShadow: running && phase.expanded ? "0 0 28px -4px rgba(120,88,214,0.35)" : "none",
        }} />
      </div>
      <p style={{ fontFamily: MONO, fontSize: 13, color: C.ink }} className="mb-1">
        {running ? phase.name : "Bereit"}
      </p>
      <p style={{ fontFamily: MONO, fontSize: 32, fontWeight: 600, color: C.lavender, lineHeight: 1, minHeight: 40 }} className="mb-5">
        {running ? countdown : ""}
      </p>
      <button onClick={toggle} style={{ backgroundColor: running ? C.ink : C.lavender, color: "white" }} className="px-6 py-2.5 rounded-full flex items-center gap-2 text-sm">
        {running ? <><Pause size={15} /> Stoppen</> : <><Play size={15} /> Starten</>}
      </button>
    </Card>
  );
}
