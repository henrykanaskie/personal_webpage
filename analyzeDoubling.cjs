// Analyze paths.ts for doubled-up (overlapping) segments
// Usage: node analyzeDoubling.js

const fs = require("fs");
const pathData = require("./svgs/rocket/paths.ts");

function parseNumbers(str) {
  return str
    .split(/[^-\d.]+/)
    .filter(Boolean)
    .map(Number);
}

function distance(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function analyzePath(pathStr) {
  // Only handle M/L/C/Q/Z for simplicity
  const cmdRegex = /([MLCQZmlcqz])([^MLCQZmlcqz]*)/g;
  let match;
  let last = null;
  let doubled = false;
  let points = [];
  while ((match = cmdRegex.exec(pathStr))) {
    const cmd = match[1];
    const nums = parseNumbers(match[2]);
    if (cmd === "M" || cmd === "L") {
      for (let i = 0; i < nums.length; i += 2) {
        const pt = [nums[i], nums[i + 1]];
        if (last && distance(pt, last) < 0.5) {
          doubled = true;
        }
        points.push(pt);
        last = pt;
      }
    } else if (cmd === "Z" || cmd === "z") {
      if (points.length > 1 && distance(points[0], last) < 0.5) {
        doubled = true;
      }
    }
    // (C/Q not handled for overlap, but could be added)
  }
  return doubled;
}

const doubledPaths = [];
pathData.paths.forEach((p, i) => {
  if (analyzePath(p)) doubledPaths.push(i);
});

console.log(`Paths that double up: ${doubledPaths.length}`);
if (doubledPaths.length) {
  console.log("Indices:", doubledPaths);
}
