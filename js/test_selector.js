// test_selector.js
// Node.jsで実行するテストコード

import fs from "fs";
import path from "path";
import { selectRabbitAction } from "./rabbitActionSelector.js"; // ← 修正ポイント

const testPath = path.resolve("../data/test_diaries.json");
const tests = JSON.parse(fs.readFileSync(testPath, "utf-8"));

let passed = 0;
let failed = 0;

console.log("=== Rabbit Action Selector Test (20 cases) ===\n");

tests.forEach(test => {
  const result = selectRabbitAction({
    emotions: test.emotions,
    needs: test.needs
  });

  const actionId = result.actionId;
  const expected = test.expected_actions;

  const ok = expected.includes(actionId);

  if (ok) {
    passed++;
    console.log(`✔ ${test.id}  OK  → ${actionId}`);
  } else {
    failed++;
    console.log(`✘ ${test.id}  NG  → got ${actionId}, expected ${expected.join(", ")}`);
  }
});

console.log("\n=== Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
