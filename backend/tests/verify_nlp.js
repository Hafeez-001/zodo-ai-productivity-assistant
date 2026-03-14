import { processText } from '../services/nlpService.js';
import { validateTask } from '../services/taskValidator.js';

const testCases = [
  {
    name: "Valid Task",
    input: "Remind me to submit the assignment tomorrow",
    expectedValid: true
  },
  {
    name: "Task without Deadline",
    input: "Call mom",
    expectedValid: false,
    expectedReason: "missing deadline"
  },
  {
    name: "Deadline without Task",
    input: "Tomorrow evening",
    expectedValid: false,
    expectedReason: "missing task action"
  },
  {
    name: "Non-task sentence (Gibberish)",
    input: "A for Apple",
    expectedValid: false,
    expectedReason: "no task intent"
  },
  {
    name: "Random words",
    input: "testing testing",
    expectedValid: false,
    expectedReason: "no task intent"
  }
];

console.log("Starting NLP Pipeline Verification...\n");

testCases.forEach(tc => {
  const processed = processText(tc.input);
  const validation = validateTask(processed);
  
  const passed = validation.valid === tc.expectedValid && 
                 (!tc.expectedReason || validation.reason === tc.expectedReason);
  
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${tc.name}`);
  console.log(`  Input: "${tc.input}"`);
  console.log(`  Intent: ${processed.intent}`);
  console.log(`  Task: ${processed.task || 'null'}`);
  console.log(`  Deadline: ${processed.deadline || 'null'}`);
  console.log(`  Valid: ${validation.valid}`);
  if (!validation.valid) {
    console.log(`  Reason: ${validation.reason}`);
    console.log(`  Message: ${validation.message}`);
  }
  console.log("");
});
