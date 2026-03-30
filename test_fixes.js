import { computeStateMetrics, nextState } from './backend/intelligence/behaviorModel.js';

const scenarios = [
  { name: "1. No tasks", tasks: [], overloadFlag: false },
  { 
    name: "2. 3-5 tasks (0 completed)", 
    tasks: [{status:"pending"}, {status:"pending"}, {status:"pending"}, {status:"pending"}], 
    overloadFlag: false 
  },
  { name: "3. Many urgent tasks", tasks: [{status:"pending"}], overloadFlag: true },
  { 
    name: "4. High completion", 
    tasks: [{status:"completed"}, {status:"completed"}, {status:"completed"}, {status:"completed"}, {status:"pending"}], 
    overloadFlag: false 
  }
];

console.log("--- FINAL TEST SCENARIOS ---");
scenarios.forEach(s => {
  const pendingCount = s.tasks.filter(t => t.status !== "completed").length;
  const metrics = computeStateMetrics(s.tasks);
  const state = nextState("Balanced", metrics, s.overloadFlag, pendingCount);
  console.log(`Scenario: ${s.name}`);
  console.log(`  State: ${state}`);
});
