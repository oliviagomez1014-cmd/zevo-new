import pptxgen from "pptxgenjs";

const DARK_BG = "050508";
const RED = "FF1E3C";
const WHITE = "F0F4FF";
const GREY = "7A8499";
const CARD_BG = "0C0C18";

function addSlideBackground(slide) {
  slide.background = { color: DARK_BG };
}

function addRedAccentLine(slide) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: RED } });
}

function addFooter(slide) {
  slide.addText("ZEVO — Business Physics Engine  |  Employees work 9 to 5. ZEVO works 5 to 9.", {
    x: 0.5, y: 6.9, w: 9, h: 0.3,
    fontSize: 8, color: "3D4560", fontFace: "Arial",
  });
}

export async function generatePPTX(analysis, chartRefs = []) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "ZEVO", width: 10, height: 7.5 });
  pptx.layout = "ZEVO";

  const briefing = analysis?.ceo_briefing || {};
  const insights = analysis?.insights || [];
  const anomalies = analysis?.anomalies || [];
  const rows = analysis?.data_stats?.total_rows || 0;

  // ── SLIDE 1: TITLE ──────────────────────────────
  const s1 = pptx.addSlide();
  addSlideBackground(s1);
  addRedAccentLine(s1);

  s1.addText("ZEVO", {
    x: 0.6, y: 1.0, w: 8.8, h: 1.4,
    fontSize: 80, bold: true, color: RED, fontFace: "Arial",
  });
  s1.addText("STRATEGIC BRIEF", {
    x: 0.6, y: 2.2, w: 8.8, h: 0.7,
    fontSize: 28, bold: true, color: WHITE, fontFace: "Arial", charSpacing: 8,
  });
  s1.addText(new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), {
    x: 0.6, y: 3.0, w: 8.8, h: 0.4,
    fontSize: 14, color: GREY, fontFace: "Arial",
  });
  s1.addText(`${rows.toLocaleString()} rows analysed`, {
    x: 0.6, y: 3.5, w: 4, h: 0.35,
    fontSize: 13, color: RED, fontFace: "Arial",
  });
  addFooter(s1);

  // ── SLIDE 2: CEO BRIEF ──────────────────────────
  const s2 = pptx.addSlide();
  addSlideBackground(s2);
  addRedAccentLine(s2);

  s2.addText("MORNING BRIEF", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.5,
    fontSize: 11, bold: true, color: RED, fontFace: "Arial", charSpacing: 4,
  });
  s2.addText(briefing.greeting || "Good morning.", {
    x: 0.6, y: 0.9, w: 8.8, h: 0.4,
    fontSize: 15, color: GREY, fontFace: "Arial", italic: true,
  });

  let yPos = 1.5;
  const allItems = [
    ...(briefing.urgent || []).map(i => ({ ...i, tag: "URGENT", color: RED })),
    ...(briefing.watch || []).map(i => ({ ...i, tag: "WATCH", color: "FFB800" })),
    ...(briefing.healthy || []).map(i => ({ ...i, tag: "HEALTHY", color: "00FF88" })),
  ].slice(0, 5);

  allItems.forEach((item) => {
    s2.addText(item.tag, {
      x: 0.6, y: yPos, w: 1.2, h: 0.28,
      fontSize: 8, bold: true, color: item.color, fontFace: "Arial", charSpacing: 2,
    });
    s2.addText(item.title || "", {
      x: 1.9, y: yPos, w: 7.5, h: 0.28,
      fontSize: 12, bold: true, color: WHITE, fontFace: "Arial",
    });
    s2.addText(item.detail || "", {
      x: 1.9, y: yPos + 0.28, w: 7.5, h: 0.3,
      fontSize: 11, color: GREY, fontFace: "Arial",
    });
    yPos += 0.75;
  });

  if (briefing.top_action) {
    s2.addShape("rect", { x: 0.6, y: yPos, w: 8.8, h: 0.85, fill: { color: "1A0A10" }, line: { color: RED, width: 1 } });
    s2.addText("TODAY'S TOP ACTION", {
      x: 0.8, y: yPos + 0.08, w: 4, h: 0.25,
      fontSize: 8, bold: true, color: RED, fontFace: "Arial", charSpacing: 2,
    });
    s2.addText(briefing.top_action.action || "", {
      x: 0.8, y: yPos + 0.32, w: 8.2, h: 0.35,
      fontSize: 12, color: WHITE, fontFace: "Arial",
    });
  }
  addFooter(s2);

  // ── SLIDE 3: KEY INSIGHTS ───────────────────────
  const s3 = pptx.addSlide();
  addSlideBackground(s3);
  addRedAccentLine(s3);

  s3.addText("KEY INSIGHTS", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.5,
    fontSize: 11, bold: true, color: RED, fontFace: "Arial", charSpacing: 4,
  });

  let iy = 1.0;
  insights.slice(0, 5).forEach((ins, idx) => {
    s3.addShape("rect", { x: 0.6, y: iy, w: 8.8, h: 0.9, fill: { color: CARD_BG }, line: { color: "1A1A2E", width: 1 } });
    s3.addText(`${String(idx + 1).padStart(2, "0")}`, {
      x: 0.7, y: iy + 0.08, w: 0.5, h: 0.3,
      fontSize: 10, bold: true, color: RED, fontFace: "Arial",
    });
    s3.addText(ins.title || "", {
      x: 1.3, y: iy + 0.08, w: 7.8, h: 0.3,
      fontSize: 12, bold: true, color: WHITE, fontFace: "Arial",
    });
    s3.addText(ins.detail || "", {
      x: 1.3, y: iy + 0.42, w: 7.8, h: 0.35,
      fontSize: 10, color: GREY, fontFace: "Arial",
    });
    iy += 1.05;
  });
  addFooter(s3);

  // ── SLIDE 4: ANOMALIES ──────────────────────────
  if (anomalies.length > 0) {
    const s4 = pptx.addSlide();
    addSlideBackground(s4);
    addRedAccentLine(s4);

    s4.addText("ANOMALIES DETECTED", {
      x: 0.6, y: 0.3, w: 8.8, h: 0.5,
      fontSize: 11, bold: true, color: RED, fontFace: "Arial", charSpacing: 4,
    });

    let ay = 1.0;
    anomalies.slice(0, 4).forEach((a) => {
      const aColor = a.severity === "critical" ? RED : "FFB800";
      s4.addShape("rect", { x: 0.6, y: ay, w: 8.8, h: 1.0, fill: { color: CARD_BG }, line: { color: aColor, width: 1 } });
      s4.addShape("rect", { x: 0.6, y: ay, w: 0.06, h: 1.0, fill: { color: aColor } });
      s4.addText(a.severity?.toUpperCase() || "", {
        x: 0.8, y: ay + 0.08, w: 2, h: 0.25,
        fontSize: 8, bold: true, color: aColor, fontFace: "Arial", charSpacing: 2,
      });
      s4.addText(a.title || "", {
        x: 0.8, y: ay + 0.32, w: 8.2, h: 0.3,
        fontSize: 12, bold: true, color: WHITE, fontFace: "Arial",
      });
      s4.addText(a.detail || "", {
        x: 0.8, y: ay + 0.62, w: 8.2, h: 0.28,
        fontSize: 10, color: GREY, fontFace: "Arial",
      });
      ay += 1.15;
    });
    addFooter(s4);
  }

  // ── SLIDE 5: DATA STORY ─────────────────────────
  const s5 = pptx.addSlide();
  addSlideBackground(s5);
  addRedAccentLine(s5);

  s5.addText("STRATEGIC ANALYSIS", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.5,
    fontSize: 11, bold: true, color: RED, fontFace: "Arial", charSpacing: 4,
  });
  s5.addShape("rect", { x: 0.6, y: 1.0, w: 8.8, h: 4.5, fill: { color: CARD_BG }, line: { color: "1A1A2E", width: 1 } });
  s5.addText(analysis?.data_story || "No strategic analysis generated.", {
    x: 0.9, y: 1.3, w: 8.2, h: 4.0,
    fontSize: 14, color: WHITE, fontFace: "Arial", valign: "top",
    breakLine: true, lineSpacingMultiple: 1.6,
  });
  addFooter(s5);

  // ── SLIDE 6: KPI SUMMARY ────────────────────────
  const kpis = analysis?.kpi_cards || [];
  if (kpis.length > 0) {
    const s6 = pptx.addSlide();
    addSlideBackground(s6);
    addRedAccentLine(s6);

    s6.addText("KPI SUMMARY", {
      x: 0.6, y: 0.3, w: 8.8, h: 0.5,
      fontSize: 11, bold: true, color: RED, fontFace: "Arial", charSpacing: 4,
    });

    const cols = 3;
    const cardW = 2.8;
    const cardH = 1.4;
    const startX = 0.55;
    const startY = 1.0;
    const gap = 0.15;

    kpis.slice(0, 6).forEach((kpi, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);
      const borderColor = kpi.status === "critical" ? RED : kpi.status === "warning" ? "FFB800" : "00FF88";

      s6.addShape("rect", { x, y, w: cardW, h: cardH, fill: { color: CARD_BG }, line: { color: "1A1A2E", width: 1 } });
      s6.addShape("rect", { x, y, w: cardW, h: 0.04, fill: { color: borderColor } });
      s6.addText((kpi.label || "").toUpperCase(), {
        x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.25,
        fontSize: 8, color: GREY, fontFace: "Arial", charSpacing: 1,
      });
      s6.addText(kpi.value || "", {
        x: x + 0.15, y: y + 0.42, w: cardW - 0.3, h: 0.5,
        fontSize: 22, bold: true, color: WHITE, fontFace: "Arial",
      });
      s6.addText(kpi.context || "", {
        x: x + 0.15, y: y + 0.95, w: cardW - 0.3, h: 0.3,
        fontSize: 9, color: GREY, fontFace: "Arial",
      });
    });
    addFooter(s6);
  }

  // ── SLIDE 7: CLOSING ────────────────────────────
  const s7 = pptx.addSlide();
  addSlideBackground(s7);
  addRedAccentLine(s7);

  s7.addText("ZEVO", {
    x: 0.6, y: 1.8, w: 8.8, h: 1.2,
    fontSize: 72, bold: true, color: RED, fontFace: "Arial",
  });
  s7.addText("Employees work 9 to 5.\nZEVO works 5 to 9.", {
    x: 0.6, y: 3.2, w: 8.8, h: 1.0,
    fontSize: 20, color: WHITE, fontFace: "Arial", italic: true, breakLine: true,
  });
  s7.addText("Business Physics Engine", {
    x: 0.6, y: 4.4, w: 8.8, h: 0.4,
    fontSize: 12, color: GREY, fontFace: "Arial", charSpacing: 3,
  });
  addFooter(s7);

  await pptx.writeFile({ fileName: `ZEVO-Brief-${Date.now()}.pptx` });
}