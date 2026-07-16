import { useState } from "react";
import { exportToCSV, exportToExcel, exportChartAsPNG, exportSummaryAsPPTText } from "../utils/exportUtils";

export default function ExportCenter({ analysis, rawRows, onClose, onExportPDF }) {
  const [exporting, setExporting] = useState(null);

  const run = async (key, fn) => {
    setExporting(key);
    await new Promise((r) => setTimeout(r, 400));
    fn();
    setExporting(null);
  };

  const options = [
    { key: "pdf", label: "PDF Report", desc: "Full CEO Brief with insights and strategic analysis", action: () => onExportPDF() },
    { key: "csv", label: "CSV Data", desc: "Raw cleaned dataset in comma-separated format", action: () => exportToCSV(rawRows, "zevo-data.csv") },
    { key: "excel", label: "Excel Workbook", desc: "Raw cleaned dataset as .xlsx spreadsheet", action: () => exportToExcel(rawRows, "zevo-data.xlsx") },
    { key: "png", label: "Chart as PNG", desc: "Export the currently viewed chart as an image", action: () => exportChartAsPNG("active-chart", "zevo-chart.png") },
    { key: "summary", label: "Executive Summary", desc: "Plain-text summary ready to paste into slides", action: () => exportSummaryAsPPTText(analysis, "zevo-summary.txt") },
  ];

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <div className="export-title">Export Center</div>
          <button className="btn-text" onClick={onClose}>Close</button>
        </div>
        <div className="export-grid">
          {options.map((opt) => (
            <div key={opt.key} className="export-card" onClick={() => run(opt.key, opt.action)}>
              <div className="export-card-title">{opt.label}</div>
              <div className="export-card-desc">{opt.desc}</div>
              <div className="export-card-action">
                {exporting === opt.key ? "Exporting..." : "Export →"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}