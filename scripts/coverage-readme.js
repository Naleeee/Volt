const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const { total } = JSON.parse(
  fs.readFileSync(path.join(root, "coverage", "coverage-summary.json"), "utf8"),
);

const color = (pct) =>
  pct >= 90 ? "brightgreen" : pct >= 80 ? "green" : pct >= 70 ? "yellow" : "red";

const badge = `![Coverage](https://img.shields.io/badge/coverage-${total.lines.pct}%25-${color(total.lines.pct)})`;

const row = (label, key) =>
  `| ${label} | ${total[key].pct}% | ${total[key].covered} / ${total[key].total} |`;
const table = [
  "| Metric | Coverage | Covered |",
  "| --- | --- | --- |",
  row("Statements", "statements"),
  row("Branches", "branches"),
  row("Functions", "functions"),
  row("Lines", "lines"),
].join("\n");

function replaceBlock(text, name, content) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(text))
    throw new Error(`README.md is missing the ${start} / ${end} markers`);
  return text.replace(pattern, `${start}\n${content}\n${end}`);
}

const readmePath = path.join(root, "README.md");
let readme = fs.readFileSync(readmePath, "utf8");
readme = replaceBlock(readme, "coverage-badge", badge);
readme = replaceBlock(readme, "coverage-table", table);
fs.writeFileSync(readmePath, readme);
console.log(`README.md coverage updated: ${total.lines.pct}% lines`);
