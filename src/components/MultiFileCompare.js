import { useState } from "react";
import { readFile, cleanData, computeSummary } from "../utils/dataEngine";
import { getAnalysis } from "../utils/claudeApi";

export default function MultiFileCompare({ onClose }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (file, setter, nameSetter) => {
    setter(file);
    nameSetter(file.name);
  };

  const runComparison = async () => {
    if (!fileA || !fileB) return;
    setLoading(true);
    try {
      const rowsA = await readFile(fileA);
      const rowsB = await readFile(fileB);
      const { rows: cleanA } = cleanData(rowsA);
      const { rows: cleanB } = cleanData(rowsB);
      const summaryA = computeSummary(cleanA);
      const summaryB = computeSummary(cleanB);

      const comparison = buildComparison(summaryA, summaryB, nameA, nameB);
      setResult(comparison);
    } catch (e) {
      alert("Could not compare these files. Make sure both are valid Excel or CSV files.");
    }
    setLoading(false);
  };

  const buildComparison = (a, b, nameA, nameB) => {
    const commonNumeric = Object.keys(a.numeric_summary || {}).filter(
      (col) => b.numeric_summary && b.numeric_summary[col]
    );
    const rows = commonNumeric.map((col) => {
      const aVal = a.numeric_summary[col].sum;
      const bVal = b.numeric_summary[col].sum;
      const change = aVal !== 0 ? (((bVal - aVal) / aVal) * 100).toFixed(1) : "N/A";
      return { column: col, a: aVal, b: bVal, change };
    });
    return { rows, totalRowsA: a.total_rows, totalRowsB: b.total_rows };
  };

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <div className="export-title">Multi-File Comparison</div>
          <button className="btn-text" onClick={onClose}>Close</button>
        </div>
        <div className="compare-upload-row">
          <div className="compare-upload-slot">
            <div className="compare-label">File A</div>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFile(e.target.files[0], setFileA, setNameA)} />
            {nameA && <div className="compare-filename">{nameA}</div>}
          </div>
          <div className="compare-vs">VS</div>
          <div className="compare-upload-slot">
            <div className="compare-label">File B</div>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFile(e.target.files[0], setFileB, setNameB)} />
            {nameB && <div className="compare-filename">{nameB}</div>}
          </div>
        </div>
        <button className="btn-primary" onClick={runComparison} disabled={!fileA || !fileB || loading} style={{ marginTop: "16px" }}>
          {loading ? "Comparing..." : "Compare Files →"}
        </button>

        {result && (
          <div className="compare-results">
            <div className="compare-summary">{result.totalRowsA} rows in {nameA} vs {result.totalRowsB} rows in {nameB}</div>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>{nameA}</th>
                  <th>{nameB}</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.column}</td>
                    <td>{r.a.toLocaleString()}</td>
                    <td>{r.b.toLocaleString()}</td>
                    <td className={parseFloat(r.change) >= 0 ? "compare-positive" : "compare-negative"}>
                      {r.change !== "N/A" ? `${r.change > 0 ? "+" : ""}${r.change}%` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}