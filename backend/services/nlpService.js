import nlp from 'compromise';
import * as chrono from 'chrono-node';

/**
 * NLP Service for Zodo
 * 
 * This service uses 'compromise' for rule-based natural language understanding
 * and 'chrono-node' for robust date/time extraction. It identifies the core
 * task action and deadline from a user's raw text input.
 */

/**
 * Detects the intent of the user's input.
 * 
 * @param {string} text - The raw user input.
 * @returns {string} The detected intent ('create_task' or 'unknown').
 */
function detectIntent(text) {
  const doc = nlp(text);
  
  // Keywords indicating task creation intent
  const taskKeywords = [
    'remind', 'create', 'task', 'todo', 'set', 'schedule', 'finish', 
    'call', 'email', 'submit', 'complete', 'do', 'meeting', 'appointment'
  ];
  
  const hasTaskKeyword = taskKeywords.some(word => text.toLowerCase().includes(word));
  const hasVerb = doc.verbs().length > 0;
  
  // Heuristic: If it has zero verbs and no task keywords, it's probably not a task
  if (!hasVerb && !hasTaskKeyword) {
    return 'unknown';
  }
  
  // More specific check for gibberish or single words
  if (text.trim().split(/\s+/).length < 2 && !hasTaskKeyword) {
    return 'unknown';
  }

  return 'create_task';
}

/**
 * Extracts the primary task action from a sentence.
 */
function extractTask(text, dateResult) {
  let doc = nlp(text);

  // 1. Remove command verbs / conversation fillers
  const commandVerbs = [
    'complete', 'finish', 'remind', 'create', 'do', 'remember', 'set', 
    'please', 'remind me to', 'create a task to', 'set a reminder to', 
    'i need to', 'can you', 'could you', 'just', 'to'
  ];
  
  const lower = doc.text().toLowerCase();
  commandVerbs.forEach(v => {
    if (lower.startsWith(v)) {
      doc.remove(v);
    }
  });

  // 2. Remove date/time parts
  if (dateResult && dateResult.text) {
    doc.remove(dateResult.text);
  }
  doc.match('#Date').remove();
  doc.match('#Time').remove();
  doc.match('#Duration').remove();

  // 3. Remove deadline-trigger words
  const deadlineWords = ['by', 'at', 'before', 'in', 'on', 'next', 'the'];
  deadlineWords.forEach(word => {
    doc.remove(`\\b${word}\\b`);
  });

  // 4. Extract core noun phrase or remaining text
  let task = doc.nouns().text().trim() || doc.text().trim();
  
  // Clean up
  task = task.replace(/\s+/g, ' ').replace(/^the\s+/i, '').trim();

  if (task.length < 2) {
    return null;
  }

  return task;
}

/**
 * Extracts a deadline from the text using chrono-node.
 */
function extractDeadline(text) {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  return results.length > 0 ? results[0] : null;
}

/**
 * Classifies a task as FIXED (time-bound event) or FLEXIBLE (deadline-based).
 *
 * FIXED if:
 *   1. Contains event keywords: meeting, exam, interview, call, session
 *      → ALWAYS FIXED, even if no time is specified (keyword takes priority)
 *   2. OR matches "at <clock-time>" pattern (digit required immediately after "at")
 *      → e.g. "at 10pm", "at 5:30", "at 9:00 AM"
 *      → phrases like "at home", "at work" do NOT match
 *
 * FLEXIBLE otherwise.
 *
 * @param {string} text - The raw user input.
 * @returns {'FIXED'|'FLEXIBLE'}
 */
export function classifyTaskType(text) {
  if (!text) return 'FLEXIBLE';
  const lower = text.toLowerCase();

  // Rule 1: keyword-based FIXED — always wins, no time needed
  const fixedKeywords = ['meeting', 'exam', 'interview', 'call', 'session'];
  if (fixedKeywords.some(kw => lower.includes(kw))) return 'FIXED';

  // Rule 2: "at <clock-time>" — must be followed by a digit (not words like "home")
  // Matches: "at 10pm", "at 5:30", "at 9:00 AM", "at 11"
  // Does NOT match: "at home", "at work", "at the office"
  const atTimePattern = /\bat\s+\d{1,2}(:\d{2})?\s?(am|pm)?\b/i;
  if (atTimePattern.test(text)) return 'FIXED';

  return 'FLEXIBLE';
}


/**
 * Processes the raw text to extract structured task information.
 * 
 * @param {string} rawInput - The full sentence from the user.
 * @returns {object} Structured NLP result.
 */
export function processText(rawInput) {
  if (!rawInput || rawInput.trim().length < 2) {
    return { intent: 'unknown', task: null, deadline: null, valid: false };
  }

  const intent = detectIntent(rawInput);
  const deadlineResult = extractDeadline(rawInput);
  const task = extractTask(rawInput, deadlineResult);
  const taskType = classifyTaskType(rawInput);
  
  const deadline = deadlineResult ? deadlineResult.start.date() : null;
  const deadlineText = deadlineResult ? deadlineResult.text : null;

  return {
    intent,
    task: task,
    deadline: deadline,
    deadlineText: deadlineText,
    taskType,
    valid: intent === 'create_task' && !!task && !!deadline,
    original: rawInput
  };
}

