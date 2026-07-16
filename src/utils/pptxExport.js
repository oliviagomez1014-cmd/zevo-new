// pptxExport.js
// Pure browser PPTX generation — no Node.js dependencies, works on Vercel.
// Generates a real .pptx file using raw XML/ZIP (Office Open XML format).

async function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (window.JSZip) { resolve(window.JSZip); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => resolve(window.JSZip);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function emu(inches) {
  return Math.round(inches * 914400);
}

function makeSlide(titleText, bodyLines = [], accentColor = "FF1E3C") {
  const titleXml = `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="2" name="Title"/>
        <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
        <p:nvPr><p:ph type="title"/></p:nvPr>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${emu(0.4)}" y="${emu(0.2)}"/><a:ext cx="${emu(9.2)}" cy="${emu(0.8)}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="050508"/></a:solidFill>
      </p:spPr>
      <p:txBody>
        <a:bodyPr/>
        <a:lstStyle/>
        <a:p><a:r>
          <a:rPr lang="en-US" sz="2400" b="1" dirty="0">
            <a:solidFill><a:srgbClr val="${accentColor}"/></a:solidFill>
            <a:latin typeface="Arial"/>
          </a:rPr>
          <a:t>${escapeXml(titleText)}</a:t>
        </a:r></a:p>
      </p:txBody>
    </p:sp>`;

  const bodyXml = bodyLines.length > 0 ? `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="3" name="Body"/>
        <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
        <p:nvPr><p:ph idx="1"/></p:nvPr>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${emu(0.4)}" y="${emu(1.2)}"/><a:ext cx="${emu(9.2)}" cy="${emu(5.5)}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="050508"/></a:solidFill>
      </p:spPr>
      <p:txBody>
        <a:bodyPr/>
        <a:lstStyle/>
        ${bodyLines.map((line) => {
          const isHeading = line.startsWith("##");
          const isRed = line.startsWith("!!");
          const text = line.replace(/^##/, "").replace(/^!!/, "").trim();
          const color = isHeading ? accentColor : isRed ? "FF4444" : "C8D0E0";
          const size = isHeading ? "1600" : "1200";
          const bold = isHeading ? "1" : "0";
          return `<a:p><a:r>
            <a:rPr lang="en-US" sz="${size}" b="${bold}" dirty="0">
              <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
              <a:latin typeface="Arial"/>
            </a:rPr>
            <a:t>${escapeXml(text)}</a:t>
          </a:r></a:p>`;
        }).join("\n")}
      </p:txBody>
    </p:sp>` : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="050508"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
        <a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>
      </p:grpSpPr>
      ${titleXml}
      ${bodyXml}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

export async function generatePPTX(analysis) {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  const briefing = analysis?.ceo_briefing || {};
  const insights = analysis?.insights || [];
  const anomalies = analysis?.anomalies || [];
  const kpis = analysis?.kpi_cards || [];

  const slides = [];

  // Slide 1 — Title
  slides.push(makeSlide(
    "ZEVO — STRATEGIC BRIEF",
    [
      `##${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      `##${(analysis?.data_stats?.total_rows || 0).toLocaleString()} rows analysed`,
      "",
      "Employees work 9 to 5. ZEVO works 5 to 9.",
      "Business Physics Engine",
    ]
  ));

  // Slide 2 — Morning Brief
  const briefLines = [
    "##MORNING BRIEF",
    briefing.greeting || "",
    "",
    ...((briefing.urgent || []).flatMap(i => [`!!URGENT: ${i.title}`, i.detail || "", ""])),
    ...((briefing.watch || []).flatMap(i => [`##WATCH: ${i.title}`, i.detail || "", ""])),
    ...((briefing.healthy || []).flatMap(i => [`${i.title}`, i.detail || "", ""])),
  ];
  if (briefing.top_action) {
    briefLines.push("", "##TODAY'S TOP ACTION", briefing.top_action.action || "");
  }
  slides.push(makeSlide("MORNING BRIEF", briefLines));

  // Slide 3 — KPIs
  if (kpis.length > 0) {
    const kpiLines = ["##KEY PERFORMANCE INDICATORS", ""];
    kpis.slice(0, 6).forEach(k => {
      kpiLines.push(`##${k.label}`);
      kpiLines.push(`${k.value}  (${k.trend === "up" ? "↑" : k.trend === "down" ? "↓" : "→"} ${k.trend_pct || ""})`);
      kpiLines.push(k.context || "");
      kpiLines.push("");
    });
    slides.push(makeSlide("KPI SUMMARY", kpiLines));
  }

  // Slide 4 — Insights
  if (insights.length > 0) {
    const insLines = ["##KEY INSIGHTS & RECOMMENDATIONS", ""];
    insights.slice(0, 5).forEach((ins, i) => {
      insLines.push(`##0${i + 1}  ${ins.title}`);
      insLines.push(ins.detail || "");
      insLines.push(`Confidence: ${ins.confidence || ""}  |  Source: ${ins.source || ""}`);
      insLines.push("");
    });
    slides.push(makeSlide("INSIGHTS", insLines));
  }

  // Slide 5 — Anomalies
  if (anomalies.length > 0) {
    const anomLines = ["##ANOMALIES DETECTED", ""];
    anomalies.slice(0, 4).forEach(a => {
      const prefix = a.severity === "critical" ? "!!" : "##";
      anomLines.push(`${prefix}${(a.severity || "").toUpperCase()}: ${a.title}`);
      anomLines.push(a.detail || "");
      anomLines.push("");
    });
    slides.push(makeSlide("ANOMALIES", anomLines));
  }

  // Slide 6 — Strategic Analysis
  slides.push(makeSlide(
    "STRATEGIC ANALYSIS",
    ["##ZEVO ANALYSIS", "", ...(analysis?.data_story || "").split(". ").map(s => s.trim()).filter(Boolean)]
  ));

  // Slide 7 — Closing
  slides.push(makeSlide(
    "ZEVO",
    [
      "##Employees work 9 to 5.",
      "##ZEVO works 5 to 9.",
      "",
      "Business Physics Engine",
      "Generated automatically by ZEVO.",
    ]
  ));

  // Build PPTX package
  const slideCount = slides.length;

  // _rels/.rels
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

  // ppt/presentation.xml
  const slideRefs = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join("\n");
  zip.file("ppt/presentation.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId${slideCount + 1}"/></p:sldMasterIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:sldIdLst>${slideRefs}</p:sldIdLst>
</p:presentation>`);

  // ppt/_rels/presentation.xml.rels
  const slideRelEntries = slides.map((_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join("\n");
  zip.file("ppt/_rels/presentation.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${slideRelEntries}
  <Relationship Id="rId${slideCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
</Relationships>`);

  // Slides
  slides.forEach((slideXml, i) => {
    zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml);
    zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);
  });

  // Minimal slide master
  zip.file("ppt/slideMasters/slideMaster1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="050508"/></a:solidFill></p:bgPr></p:bg>
  <p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr/></a:lvl1pPr></p:titleStyle>
  <p:bodyStyle><a:lvl1pPr><a:defRPr/></a:lvl1pPr></p:bodyStyle>
  <p:otherStyle><a:lvl1pPr><a:defRPr/></a:lvl1pPr></p:otherStyle></p:txStyles>
</p:sldMaster>`);

  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

  // [Content_Types].xml
  const slideContentTypes = slides.map((_, i) =>
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join("\n");
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  ${slideContentTypes}
</Types>`);

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ZEVO-Brief-${Date.now()}.pptx`;
  link.click();
  URL.revokeObjectURL(url);
}