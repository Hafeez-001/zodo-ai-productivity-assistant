import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Summarize meeting transcript into Key Points, Decisions, and Action Items.
 */
export const summarizeMeeting = async (transcript) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI meeting assistant.
      Summarize the following meeting transcript.
      Return the result in strictly this JSON format:
      {
        "keyPoints": ["point 1", "point 2"],
        "decisions": ["decision 1"],
        "actionItems": ["task 1"]
      }

      Transcript:
      ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini response as JSON");
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Meeting Summarization Error:", error);
    throw error;
  }
};

/**
 * Extract structured tasks from meeting transcript.
 */
export const extractTasksFromMeeting = async (transcript) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI task specialist.
      Extract specific tasks from the following meeting transcript.
      For each task, identify:
      1. The action/title
      2. The deadline (if mentioned, otherwise "Soon")

      Return the result in strictly this JSON format:
      {
        "tasks": [
          {"task": "Finish UI", "deadline": "This week"},
          {"task": "Call client", "deadline": "Tomorrow"}
        ]
      }

      Transcript:
      ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini task extraction as JSON");
    const data = JSON.parse(jsonMatch[0]);
    return data.tasks;
  } catch (error) {
    console.error("Gemini Task Extraction Error:", error);
    throw error;
  }
};

/**
 * Generate AI plan cleanup suggestions for an overloaded task list.
 * @param {Array} tasks - Serialized task summaries
 * @param {Object} workload - Workload metrics
 * @returns {Array<{action, taskTitle, taskId, reason}>}
 */
export const generatePlanCleanup = async (tasks, workload) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI productivity coach for a task management app called Zodo.
      The user's schedule is ${workload.overloadFlag ? "overloaded" : "approaching capacity"} 
      at ${workload.capacityPercentage}% capacity.

      Here are the user's pending tasks:
      ${JSON.stringify(tasks, null, 2)}

      Your job: analyze the tasks and suggest 3-5 specific actions to reduce cognitive load.
      For each suggestion, choose ONE of these actions:
      - "postpone": Move a low-priority or far-deadline task to later
      - "split": Break a large/high-effort task into smaller sub-tasks
      - "keep": Explicitly keep a critical task as is

      Return ONLY a JSON array in this exact format:
      [
        {
          "action": "postpone",
          "taskTitle": "exact task title here",
          "taskId": "exact task id here",
          "reason": "clear 1-sentence reason for this suggestion"
        }
      ]
      
      Be specific and actionable. Prioritize postponing low-priority tasks and splitting 
      tasks that have been postponed multiple times.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse plan cleanup response");
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Plan Cleanup Error:", error);
    throw error;
  }
};

/**
 * Generate a personalized weekly productivity report narrative.
 * @param {Object} stats - { completionRate, totalCompleted, totalCreated, mostProductiveDay, currentStreak }
 * @returns {String} AI-written narrative paragraph
 */
export const generateWeeklyReport = async (stats) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a supportive AI productivity coach writing a brief weekly report for a user.
      
      User's week stats:
      - Tasks completed: ${stats.totalCompleted} out of ${stats.totalCreated} created
      - Completion rate: ${Math.round(stats.completionRate * 100)}%
      - Most productive day: ${stats.mostProductiveDay || "Not enough data"}
      - Current streak: ${stats.currentStreak} days
      - High-priority completion rate: ${Math.round((stats.highPriorityRate || 0) * 100)}%

      Write a brief, personal, motivating 2-3 sentence weekly summary. 
      Be specific with the stats. Keep a calm, encouraging tone.
      Do NOT use markdown, asterisks, or bullet points. Plain text only.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini Weekly Report Error:", error);
    return `You completed ${stats.totalCompleted} tasks this week with a ${Math.round(stats.completionRate * 100)}% completion rate. Keep up the great work!`;
  }
};

/**
 * Generate comprehensive meeting insights (Summary + Action Items) using Gemini 2.5 Flash
 */
export async function generateMeetingInsights(transcript) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI meeting assistant.

Analyze the following meeting transcript.

Return ONLY valid JSON in this format:

{
"summary": {
"keyPoints": [],
"decisions": []
},
"tasks": [
{
"title": "",
"deadline": "",
"priority": ""
}
]
}

Rules:

* Extract only important discussion points
* Tasks must be actionable
* If deadline is mentioned, extract it
* If not, leave deadline empty
* Do NOT return text outside JSON

Transcript:
${transcript}
`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini response as JSON");
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini 2.5 Flash Meeting Insights Error:", error);
    throw error;
  }
}
