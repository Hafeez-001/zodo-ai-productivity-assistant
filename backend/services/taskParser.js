import nlp from "compromise";
import { getTimeContext } from "../utils/timeContext.js";

function parseRelativeDate(text) {
  const now = new Date();
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) {
    const d = new Date(now);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(now.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  const nextMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (nextMatch) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const target = days.indexOf(nextMatch[1]);
    const d = new Date(now);
    const delta = (7 - d.getDay() + target) % 7 || 7;
    d.setDate(d.getDate() + delta);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  return null;
}

function parseTime(text) {
  const lower = text.toLowerCase().replace(/\./g, "");
  const atTime = lower.match(/\b(?:by|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (atTime) {
    let h = parseInt(atTime[1], 10);
    const m = atTime[2] ? parseInt(atTime[2], 10) : 0;
    const ap = atTime[3];
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return { hour: h, minute: m };
  }
  const inHours = lower.match(/\bin\s+(\d+)\s+hours?\b/);
  if (inHours) {
    const add = parseInt(inHours[1], 10);
    const d = new Date();
    d.setHours(d.getHours() + add);
    return { absolute: d };
  }
  return null;
}

function detectEffort(text) {
  const lower = text.toLowerCase();
  const keys = [];
  if (/\bquick\b/.test(lower)) keys.push("quick");
  if (/\blong\b/.test(lower)) keys.push("long");
  if (/\bdetailed\b/.test(lower)) keys.push("detailed");
  let effortLevel = "medium";
  let estimated = 30;
  if (keys.includes("quick")) {
    effortLevel = "low";
    estimated = 15;
  }
  if (keys.includes("long")) {
    effortLevel = "high";
    estimated = 90;
  }
  if (keys.includes("detailed")) {
    effortLevel = "high";
    estimated = 120;
  }
  return { effortLevel, estimatedMinutes: estimated, keys };
}

export function parseTaskInput(raw) {
  const dateGuess = parseRelativeDate(raw);
  const timeGuess = parseTime(raw);
  let deadline = null;
  
  if (timeGuess && timeGuess.absolute) {
    deadline = timeGuess.absolute;
  } else if (dateGuess || timeGuess) {
    const base = dateGuess || new Date();
    const d = new Date(base);
    if (timeGuess && typeof timeGuess.hour === "number") {
      d.setHours(timeGuess.hour, timeGuess.minute || 0, 0, 0);
    }
    const now = new Date();
    if (/\btoday\b/i.test(raw) && d <= now && typeof timeGuess?.hour === "number") {
      d.setDate(d.getDate() + 1);
    }
    deadline = d;
  }

  const { effortLevel, estimatedMinutes, keys } = detectEffort(raw);
  
  // NLP Extraction Logic
  let doc = nlp(raw);
  
  // 1. Remove command verbs if they are at the beginning
  const commandVerbs = ['complete', 'finish', 'remind', 'create', 'do', 'remember', 'set', 'please', 'remind me to'];
  // Some verbs might be phrases like "remind me to"
  commandVerbs.forEach(v => {
    if (doc.text().toLowerCase().startsWith(v)) {
      doc.remove(v);
    }
  });

  // 2. Remove deadline/time related parts
  // Use compromise tags to find dates and times and remove them
  doc.match('#Date').remove();
  doc.match('#Time').remove();
  doc.match('#Duration').remove();
  
  // Aggressive removal of common time/date patterns that might be missed
  doc.remove('(\\d{1,2})?(:\\d{2})?\\s*(am|pm)');
  doc.remove('\\b(p.m.|a.m.)\\b');
  
  // Remove specific deadline words if they remain
  const deadlineWords = ['by', 'tomorrow', 'today', 'at', 'before', 'in', 'on', 'next', 'the'];
  deadlineWords.forEach(word => {
    doc.remove(`\\b${word}\\b`);
  });

  // 3. Extract core noun phrase or remaining text
  // We prefer nouns, but if none found (or extraction is too aggressive), take the whole text
  let title = doc.nouns().text().trim() || doc.text().trim();

  // Clean up any double spaces, leading/trailing junk, or "the" prefixes
  // Aggressively remove common trailing artifacts that NLP might miss
  title = title.replace(/\s+/g, ' ')
               .replace(/^the\s+/i, '')
               .replace(/\b(by|at|before|in|on|next|to|for)\s*$/i, '') // Trailing connectors
               .replace(/\b(p\.?m\.?|a\.?m\.?|pm|am)\b/gi, '')          // Time markers
               .replace(/[.,:;?!]+$/, '')                               // Trailing punctuation
               .trim();

  let confidence = 0.4;
  if (dateGuess) confidence += 0.3;
  if (timeGuess) confidence += 0.2;
  if (keys.length) confidence += 0.1;
  if (confidence > 1) confidence = 1;

  return {
    title: title || raw.trim(),
    deadline: deadline || null,
    effortLevel,
    estimatedMinutes,
    parsedMetadata: {
      extractedDate: deadline || null,
      extractedTime: timeGuess && typeof timeGuess.hour === 'number' ? `${timeGuess.hour}:${String(timeGuess.minute || 0).padStart(2, '0')}` : null,
      effortKeywords: keys,
      confidenceScore: confidence
    }
  };
}
