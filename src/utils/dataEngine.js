import * as XLSX from "xlsx";

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function cleanData(rows) {
  const changelog = [];
  if (!rows.length) return { rows, changelog };
  const columns = Object.keys(rows[0]);
  const seen = new Set();
  let deduped = [];
  let dupeCount = 0;
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (seen.has(key)) { dupeCount++; }
    else { seen.add(key); deduped.push(row); }
  }
  if (dupeCount > 0) changelog.push(`Removed ${dupeCount} duplicate rows`);
  columns.forEach((col) => {
    let numericCount = 0;
    deduped.forEach((row) => {
      const val = row[col];
      if (typeof val === "string") {
        const cleaned = val.replace(/[₹$,]/g, "").trim();
        if (cleaned !== "" && !isNaN(cleaned)) numericCount++;
      }
    });
    if (deduped.length > 0 && numericCount / deduped.length > 0.7) {
      deduped.forEach((row) => {
        if (typeof row[col] === "string") {
          const cleaned = row[col].replace(/[₹$,]/g, "").trim();
          row[col] = cleaned === "" ? null : Number(cleaned);
        }
      });
      changelog.push(`Converted '${col}' to numeric`);
    }
  });
  return { rows: deduped, changelog };
}

export function detectColumnTypes(rows) {
  if (!rows.length) return {};
  const columns = Object.keys(rows[0]);
  const types = {};
  columns.forEach((col) => {
    let numCount = 0, dateCount = 0, total = 0;
    rows.forEach((row) => {
      const val = row[col];
      if (val === null || val === undefined || val === "") return;
      total++;
      if (typeof val === "number") numCount++;
      else if (val instanceof Date) dateCount++;
      else if (!isNaN(val) && val !== "") numCount++;
    });
    if (total === 0) { types[col] = "empty"; return; }
    if (dateCount / total > 0.6) types[col] = "date";
    else if (numCount / total > 0.6) types[col] = "numeric";
    else types[col] = "categorical";
  });
  return types;
}

export function computeSummary(rows) {
  if (!rows.length) return { total_rows: 0, total_columns: 0, columns: [], column_types: {}, missing_values: {}, numeric_summary: {}, categorical_summary: {}, sample_data: [] };
  const columns = Object.keys(rows[0]);
  const types = detectColumnTypes(rows);
  const summary = {
    total_rows: rows.length,
    total_columns: columns.length,
    columns,
    column_types: types,
    missing_values: {},
    numeric_summary: {},
    categorical_summary: {},
  };
  columns.forEach((col) => {
    const missing = rows.filter((r) => r[col] === null || r[col] === undefined || r[col] === "").length;
    summary.missing_values[col] = missing;
    if (types[col] === "numeric") {
      const values = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v) && v !== null);
      if (values.length) {
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        summary.numeric_summary[col] = {
          sum: r2(sum), mean: r2(mean),
          min: r2(Math.min(...values)), max: r2(Math.max(...values)),
          median: r2(median), std: r2(Math.sqrt(variance)),
        };
      }
    }
    if (types[col] === "categorical") {
      const counts = {};
      rows.forEach((r) => {
        const val = r[col];
        if (val === null || val === undefined || val === "") return;
        counts[val] = (counts[val] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      summary.categorical_summary[col] = {
        unique_values: Object.keys(counts).length,
        top_10: Object.fromEntries(sorted),
      };
    }
  });
  summary.sample_data = rows.slice(0, 5);
  return summary;
}

export function computeConfidence(rows) {
  if (!rows.length) return { overall: 0, per_column: {}, clean_rows: 0, total_rows: 0 };
  const columns = Object.keys(rows[0]);
  const totalCells = rows.length * columns.length;
  let missingCells = 0;
  const perColumn = {};
  columns.forEach((col) => {
    const missing = rows.filter((r) => r[col] === null || r[col] === undefined || r[col] === "").length;
    missingCells += missing;
    perColumn[col] = Math.round((1 - missing / rows.length) * 5);
  });
  const cleanRows = rows.filter((row) =>
    columns.every((col) => row[col] !== null && row[col] !== undefined && row[col] !== "")
  ).length;
  return {
    overall: Math.round((1 - missingCells / totalCells) * 100),
    per_column: perColumn,
    clean_rows: cleanRows,
    total_rows: rows.length,
  };
}

export function groupAndSum(rows, groupCol, valueCol, limit = 15) {
  const grouped = {};
  rows.forEach((row) => {
    const key = row[groupCol];
    const val = Number(row[valueCol]);
    if (key === null || key === undefined || isNaN(val)) return;
    grouped[key] = (grouped[key] || 0) + val;
  });
  return Object.entries(grouped)
    .map(([k, v]) => ({ [groupCol]: k, [valueCol]: r2(v) }))
    .sort((a, b) => b[valueCol] - a[valueCol])
    .slice(0, limit);
}

function r2(num) {
  return Math.round(num * 100) / 100;
}