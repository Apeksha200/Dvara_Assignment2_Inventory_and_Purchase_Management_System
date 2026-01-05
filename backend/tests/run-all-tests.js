#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all test suites with proper setup
 * Usage: node tests/run-all-tests.js
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("🧪 Starting test suite...\n");

const testFiles = [
  "tests/orderWorkflow.test.js",
  "tests/rbac.test.js",
];

const jestProcess = spawn("npx", ["jest", ...testFiles, "--testTimeout=15000", "--verbose"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  shell: true,
});

jestProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  }
});

jestProcess.on("error", (error) => {
  console.error("Error running tests:", error);
  process.exit(1);
});
