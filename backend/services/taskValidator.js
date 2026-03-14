/**
 * Task Validation Service for Zodo
 * 
 * This service enforces the core business rule: a task is only valid if it
 * contains both a meaningful action and a clear deadline.
 */

/**
 * Validates the processed NLP data.
 * 
 * @param {object} processedData - The output from nlpService.
 * @returns {{ valid: boolean, reason: string|null, message: string|null }}
 */
export function validateTask(processedData) {
  const { intent, task, deadline } = processedData;

  // Rule 1: Must have task intent
  if (intent !== 'create_task') {
    return {
      valid: false,
      reason: "no task intent",
      message: "This doesn't look like a task. Please say something like: 'Remind me to submit assignment tomorrow.'"
    };
  }

  // Rule 2: Must have a task description
  if (!task) {
    return {
      valid: false,
      reason: "missing task action",
      message: "I'm not sure what task you want to create."
    };
  }

  // Rule 3: Must have a deadline
  if (!deadline) {
    return {
      valid: false,
      reason: "missing deadline",
      message: "When should I schedule this task?"
    };
  }

  return {
    valid: true,
    reason: null,
    message: null
  };
}

