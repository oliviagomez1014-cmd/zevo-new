import * as XLSX from "xlsx";

export function exportToCSV(rows, filename = "zevo-data.csv") {
  if (!rows || !rows.length) return;
  const columns = Object.keys(rows[0]);
  const csvRows = [columns.join(",")];
  rows.forEach((row) => {
    csvRows.push(columns.map((c) => `"${String(row[c] ?? "").replace(/"/g, '""')}"`).join(","));
  });
  downloadBlob(csvRows.join("\n"), filename, "text/csv");
}

export function exportToExcel(rows, filename = "zevo-data.xlsx") {
  if (!rows || !rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ZEVO Data");
  XLSX.writeFile(wb, filename);
}

export function exportChartAsPNG(chartElementId, filename = "zevo-chart.png") {
  const el = document.getElementById(chartElementId);
  if (!el) return;
  const svg = el.querySelector("svg");
  if (!svg) { alert("Chart not ready to export yet."); return; }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = svg.clientWidth * 2;
    canvas.height = svg.clientHeight * 2;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0C0C18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
    });
  };
  img.src = url;
}

export function exportSummaryAsPPTText(analysis, filename = "zevo-summary.txt") {
  const b = analysis?.ceo_briefing || {};
  const lines = [
    "ZEVO — EXECUTIVE SUMMARY",
    new Date().toLocaleDateString(),
    "",
    "URGENT:",
    ...(b.urgent || []).map((i) => `- ${i.title}: ${i.detail}`),
    "",
    "WATCH:",
    ...(b.watch || []).map((i) => `- ${i.title}: ${i.detail}`),
    "",
    "KEY INSIGHTS:",
    ...(analysis?.insights || []).map((i) => `- ${i.title}: ${i.detail}`),
    "",
    "SUMMARY:",
    analysis?.data_story || "",
  ];
  downloadBlob(lines.join("\n"), filename, "text/plain");
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}