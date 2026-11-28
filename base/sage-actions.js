/* Allowed actions by talking to Sage (animation control only).
   The visitor's message, or Sage's own reply, can ask for one of a short whitelist of moves; Sage does it and her words agree.
   Anything else she says honestly she can't do yet, and the ask is kept in a small local list (this browser only, never sent
   anywhere) so the builders learn what to add. Nothing here touches login, keys, the chat server or page content. */
(function () {
"use strict";
const LIST_KEY = "ckw-sage-wishes", LIST_MAX = 50;
/* request framing: the move must be asked for, not just mentioned ("your animation to get up" is not a request) */
const ASK_BEFORE = /(^|[.!?,;:]\s*|\b(please|pls|can you|could you|would you|will you|go ahead and|now|ok|okay|just|you to|you should|let'?s|and|then|sage|hey|try to|time to|why don'?t you|i want you to|i'd like you to)\s*)$/i;
const ACTIONS = [
  { id: "sit", re: /\b(sit(?:\s+(?:back\s+)?down)?|take a seat|have a seat|be seated)\b/i,
    say: "Of course. I'll sit back down.", already: "I'm already seated, so I'll stay right here." },
  { id: "stand", re: /\b(stand(?:\s+up)?|get up|rise)\b/i, say: "Standing up.", already: "I'm already on my feet." },
  { id: "page", re: /\b(turn (?:the |a )?page|next page|flip (?:the |a )?page)\b/i, say: "Turning the page." },
  { id: "note", re: /\b(write (?:a |it |that |this )?(?:note|down)|write that|take (?:a )?note|jot (?:it |that )?down|note (?:that|this|it) down|use (?:the |your )?quill)\b/i, say: "Let me note that down." },
  { id: "close", re: /\b(close (?:the |your )?book)\b/i, say: "Closing the book for a moment.", already: "It's already closed." },
  { id: "open", re: /\b(open (?:the |your )?book)\b/i, say: "Opening the book.", already: "It's open." },
  { id: "read", re: /\b(read|keep reading|go back to (?:your )?reading|back to (?:your )?(?:book|reading))\b/i, say: "Back to my reading." },
  { id: "look", re: /\b(look at me|look here|look over here|face me|eyes on me)\b/i, say: "I'm looking at you." },
  { id: "smile", re: /\b(smile)\b/i, say: "Like this?" },
  { id: "stretch", re: /\b(stretch)\b/i, say: "A good stretch, then back to it." }
];
/* moves people may ask for that are not built yet: said honestly, then noted locally */
const NOT_YET = /\b(walk(?:\s+around)?|dance|fly|jump|run|wave|spin|kneel|lie down|sleep|come (?:here|closer|over)|go to|turn around|bow|sing|clap|fight|hug|laugh|cry|wink|nod|point|leave|follow me|fly away|spread (?:your )?wings|sit on the table|cast (?:a )?spell|summon)\b/i;

function asked(text, re) {
  const g = new RegExp(re.source, "gi"); let m;
  while ((m = g.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 40), m.index).replace(/\s+$/, " ").trimEnd();
    if (ASK_BEFORE.test(before ? before + " " : "") || ASK_BEFORE.test(before)) return { at: m.index, word: m[0] };
  }
  return null;
}
function match(text) {
  const t = String(text || "").slice(0, 500);
  let best = null;
  for (const a of ACTIONS) { const h = asked(t, a.re); if (h && (!best || h.at < best.at)) best = { a, at: h.at, word: h.word }; }
  if (best) return { kind: "allowed", id: best.a.id, word: best.word };
  const n = asked(t, NOT_YET);
  if (n) return { kind: "notyet", word: n.word.toLowerCase() };
  return null;
}
function words(t) { return String(t || "").trim().split(/\s+/).filter(Boolean).length; }
function body() { return window.CKWSageBody && window.CKWSageBody.ready() ? window.CKWSageBody : null; }
function wishes() { try { const v = JSON.parse(localStorage.getItem(LIST_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; } }
function noteWish(word, text, why) {
  const e = { t: new Date().toISOString(), ask: word, why: why, text: String(text || "").slice(0, 120) };
  const all = wishes(); all.push(e); while (all.length > LIST_MAX) all.shift();
  try { localStorage.setItem(LIST_KEY, JSON.stringify(all)); } catch (_) {}
  try { console.info("[Sage] action not built yet, noted locally:", e); } catch (_) {}
}
/* Perform a whitelisted move. Returns the line Sage says, which always matches what her body does. */
function perform(m, text) {
  if (!m) return null;
  if (m.kind === "notyet") { noteWish(m.word, text, "not built"); return { line: "I can't " + m.word + " yet. That move isn't built for me, so I've noted the request for the builders.", did: null }; }
  const a = ACTIONS.find((x) => x.id === m.id); const b = body();
  if (!b) { noteWish(m.id, text, "3D not running"); return { line: "My 3D form isn't running on this screen, so I can't show that right now.", did: null }; }
  const r = b.do(m.id);
  if (!r || !r.ok) { noteWish(m.id, text, "busy or unavailable"); return { line: "I can't do that just this moment. I've noted it.", did: null }; }
  return { line: r.already && a.already ? a.already : a.say, did: m.id };
}
/* Sage's own reply may commit to a move ("I'll sit down"): then she does it, so her words and body agree. Also honours an
   optional [[act:name]] tag from the reply server (stripped from the text; whitelist only). */
const SELF_RE = /\b(?:i'll|i will|i'm going to|i am going to|let me)\s+(sit(?: back)? down|sit|stand up|stand|get up|turn the page|close the book|open the book|stretch|smile|note that down|write that down|look at you|go back to (?:my )?reading)\b/i;
const SELF_MAP = { sit: "sit", "sit down": "sit", "sit back down": "sit", stand: "stand", "stand up": "stand", "get up": "stand", "turn the page": "page", "close the book": "close",
  "open the book": "open", stretch: "stretch", smile: "smile", "note that down": "note", "write that down": "note", "look at you": "look", "go back to reading": "read", "go back to my reading": "read" };
function fromReply(reply, done) {
  let text = String(reply || ""), did = null;
  const tag = /\[\[act:([a-z]+)\]\]/gi; let m, tagged = [];
  while ((m = tag.exec(text))) tagged.push(m[1].toLowerCase());
  text = text.replace(tag, "").replace(/\s{2,}/g, " ").trim();
  if (done) {
    /* she just did a move: drop any sentence in the server reply that says she can't */
    const verb = { sit: "sit", stand: "stand|get up", page: "turn|page", note: "write|note", close: "close", open: "open", read: "read", look: "look", smile: "smile", stretch: "stretch" }[done];
    const deny = new RegExp("\\b(can't|cannot|can not|unable to|not able to|don't have a body|no body)\\b[^.!?]*\\b(" + verb + "|move|physically)", "i");
    text = text.split(/(?<=[.!?])\s+/).filter((s) => !deny.test(s)).join(" ").trim();
    return { text, did: null };
  }
  const b = body();
  for (const id of tagged) if (b && ACTIONS.some((a) => a.id === id)) { const r = b.do(id); if (r && r.ok) { did = id; break; } }
  if (!did) { const s = SELF_RE.exec(text); const id = s && SELF_MAP[s[1].toLowerCase()]; if (id && b) { const r = b.do(id); if (r && r.ok) did = id; } }
  return { text, did };
}
window.CKWSageActions = { match, perform, fromReply, words, wishes, clearWishes: () => { try { localStorage.removeItem(LIST_KEY); } catch (_) {} }, list: () => ACTIONS.map((a) => a.id) };
})();
