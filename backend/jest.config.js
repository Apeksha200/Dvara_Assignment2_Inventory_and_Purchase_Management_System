module.exports = {
  testEnvironment: "node",
  testTimeout: 15000,
  verbose: true,
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Setup files
  setupFiles: ["<rootDir>/tests/setup.js"],
};
