import { DECK_SIZE, type DeckSlide } from "@/lib/deck/schema";
import { getDeckStyle, type DeckStyle, type FontRole } from "@/lib/deck/styles";

export type DrawOp =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      radius?: number;
      borderColor?: string;
      borderWidth?: number;
    }
  | {
      kind: "text";
      x: number;
      y: number;
      w: number;
      text: string;
      size: number;
      color: string;
      font: FontRole;
      bold?: boolean;
      italic?: boolean;
      caps?: boolean;
      align?: "left" | "center" | "right";
      lineHeight?: number;
    };

const W = DECK_SIZE.width;
const H = DECK_SIZE.height;

/** Rough wrapped-line count so stacked blocks never collide. */
export function estimateLines(text: string, width: number, size: number) {
  const perLine = Math.max(1, Math.floor(width / (size * 0.5)));
  return Math.max(1, Math.ceil(text.length / perLine));
}

function blockHeight(text: string, width: number, size: number, lh = 1.32) {
  return estimateLines(text, width, size) * size * lh;
}

function luminance(hex: string) {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Inverted panel colours for full-bleed slides, safe on light and dark styles. */
function inverse(p: Painter) {
  const dark = luminance(p.pal.bg) < 0.5;
  return dark
    ? { bg: p.pal.panelAlt, fg: p.pal.ink, sub: p.pal.muted }
    : { bg: p.pal.ink, fg: p.pal.bg, sub: p.pal.muted };
}

function clamp(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/* ------------------------------------------------------------------ painter */

class Painter {
  ops: DrawOp[] = [];
  readonly style: DeckStyle;
  readonly m: number;
  readonly content: number;

  constructor(style: DeckStyle) {
    this.style = style;
    this.m = style.margin;
    this.content = W - style.margin * 2;
  }

  get pal() {
    return this.style.palette;
  }

  /** Scales a base type size by the style's type scale. */
  t(size: number) {
    return Math.round(size * this.style.scale);
  }

  rect(op: Omit<Extract<DrawOp, { kind: "rect" }>, "kind">) {
    this.ops.push({ kind: "rect", ...op });
    return this;
  }

  text(op: Omit<Extract<DrawOp, { kind: "text" }>, "kind">) {
    if (!op.text) return this;
    this.ops.push({ kind: "text", ...op });
    return this;
  }

  /** Card background honouring the style's card treatment. */
  card(x: number, y: number, w: number, h: number, accent = false) {
    const { card, radius } = this.style;
    if (card === "filled") {
      this.rect({ x, y, w, h, color: accent ? this.pal.panelAlt : this.pal.panel, radius });
    } else if (card === "outline") {
      this.rect({
        x,
        y,
        w,
        h,
        color: accent ? this.pal.panelAlt : this.pal.bg,
        radius,
        borderColor: this.pal.rule,
        borderWidth: 1,
      });
    } else {
      this.rect({ x, y: y + h - 2, w, h: 2, color: accent ? this.pal.accent : this.pal.rule });
    }
    return this;
  }

  eyebrow(text: string, x: number, y: number, w: number, align: "left" | "center" = "left") {
    return this.text({
      x,
      y,
      w,
      text,
      size: this.t(14),
      color: this.pal.accent,
      font: "mono",
      bold: true,
      caps: this.style.capsEyebrow,
      align,
    });
  }
}

/* ------------------------------------------------------------ chrome parts */

function header(p: Painter, slide: DeckSlide): number {
  const { m, content, pal, style } = p;

  if (style.header === "bar") {
    p.rect({ x: 0, y: 0, w: W, h: 108, color: pal.panel });
    p.rect({ x: 0, y: 108, w: W, h: 2, color: pal.accent });
    p.eyebrow(slide.eyebrow, m, 26, content);
    p.text({
      x: m,
      y: 52,
      w: content,
      text: clamp(slide.title, 64),
      size: p.t(40),
      color: pal.ink,
      font: "display",
      bold: true,
    });
    return 156;
  }

  if (style.header === "stack") {
    p.eyebrow(slide.eyebrow, m, 54, content);
    p.text({
      x: m,
      y: 84,
      w: content,
      text: clamp(slide.title, 64),
      size: p.t(46),
      color: pal.ink,
      font: "display",
      bold: true,
    });
    return 168;
  }

  if (style.header === "side") {
    p.rect({ x: m, y: 58, w: 4, h: 74, color: pal.accent });
    p.eyebrow(slide.eyebrow, m + 22, 58, content - 22);
    p.text({
      x: m + 22,
      y: 84,
      w: content - 22,
      text: clamp(slide.title, 64),
      size: p.t(46),
      color: pal.ink,
      font: "display",
    });
    return 176;
  }

  p.eyebrow(slide.eyebrow, m, 56, content);
  p.rect({ x: m, y: 90, w: content, h: 1, color: pal.rule });
  p.text({
    x: m,
    y: 114,
    w: content,
    text: clamp(slide.title, 64),
    size: p.t(46),
    color: pal.ink,
    font: "display",
    bold: style.fonts.display.pdf !== "times",
  });
  return 196;
}

function footer(p: Painter, slide: DeckSlide) {
  const { m, content, pal } = p;
  p.rect({ x: m, y: H - 58, w: content, h: 1, color: pal.rule });
  p.text({
    x: m,
    y: H - 44,
    w: content - 80,
    text: "Generated from your project documentation",
    size: 12,
    color: pal.muted,
    font: "mono",
  });
  p.text({
    x: W - m - 80,
    y: H - 44,
    w: 80,
    text: String(slide.number).padStart(2, "0"),
    size: 12,
    color: pal.muted,
    font: "mono",
    bold: true,
    align: "right",
  });
}

function note(p: Painter, slide: DeckSlide) {
  if (!slide.note) return;
  const { m, content, pal } = p;
  const y = H - 116;
  p.rect({ x: m, y, w: 3, h: 38, color: pal.accent });
  p.text({
    x: m + 16,
    y: y + 6,
    w: content - 24,
    text: slide.note,
    size: p.t(14),
    color: pal.muted,
    font: "body",
    italic: true,
  });
}

/* -------------------------------------------------------------- primitives */

function bulletList(p: Painter, slide: DeckSlide, x: number, y: number, w: number, cols = 1) {
  const items = slide.bullets.slice(0, p.style.density);
  if (!items.length) return y;
  const hasDetail = items.some((b) => b.detail);
  const gap = 26;
  const colW = cols > 1 ? (w - gap * (cols - 1)) / cols : w;
  const rowH = hasDetail ? 74 : 48;

  items.forEach((bullet, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = x + col * (colW + gap);
    const by = y + row * rowH;
    p.rect({ x: bx, y: by + 10, w: 7, h: 7, color: p.pal.accent, radius: 4 });
    p.text({
      x: bx + 22,
      y: by,
      w: colW - 22,
      text: clamp(bullet.label, 90),
      size: p.t(20),
      color: p.pal.ink,
      font: "body",
      bold: true,
    });
    if (bullet.detail) {
      p.text({
        x: bx + 22,
        y: by + 30,
        w: colW - 22,
        text: clamp(bullet.detail, 130),
        size: p.t(15),
        color: p.pal.muted,
        font: "body",
      });
    }
  });

  return y + Math.ceil(items.length / cols) * rowH + 8;
}

function tagCloud(p: Painter, tags: string[], x: number, y: number, w: number) {
  let tx = x;
  let ty = y;
  for (const tag of tags.slice(0, 12)) {
    const tw = Math.max(86, tag.length * 9 + 34);
    if (tx + tw > x + w) {
      tx = x;
      ty += 50;
    }
    p.rect({
      x: tx,
      y: ty,
      w: tw,
      h: 40,
      color: p.style.card === "bare" ? p.pal.panelAlt : p.pal.panel,
      radius: 20,
      borderColor: p.pal.rule,
      borderWidth: 1,
    });
    p.text({
      x: tx + 17,
      y: ty + 12,
      w: tw - 34,
      text: clamp(tag, 22),
      size: p.t(14),
      color: p.pal.ink,
      font: "mono",
    });
    tx += tw + 12;
  }
  return ty + 62;
}

/* ------------------------------------------------------------ slide bodies */

function drawCover(p: Painter, slide: DeckSlide) {
  const { m, content, pal, style } = p;

  if (style.cover === "full" || style.cover === "block") {
    p.rect({ x: 0, y: 0, w: W, h: H, color: pal.bg });
    p.rect({ x: 0, y: 0, w: 220, h: 8, color: pal.accent });
  } else if (style.cover === "band") {
    p.rect({ x: 0, y: 0, w: W, h: 300, color: pal.panelAlt });
    p.rect({ x: 0, y: 300, w: W, h: 3, color: pal.accent });
  } else if (style.cover === "split") {
    p.rect({ x: W - 380, y: 0, w: 380, h: H, color: pal.panelAlt });
    p.rect({ x: W - 380, y: 0, w: 4, h: H, color: pal.accent });
  } else {
    p.rect({ x: 0, y: 0, w: 10, h: H, color: pal.accent });
  }

  const titleW = style.cover === "split" ? content - 340 : content - 120;
  p.eyebrow(slide.eyebrow, m, 148, titleW);
  p.text({
    x: m,
    y: 190,
    w: titleW,
    text: clamp(slide.title, 44),
    size: p.t(style.cover === "full" ? 94 : 82),
    color: pal.ink,
    font: "display",
    bold: style.fonts.display.pdf !== "times",
  });
  if (slide.subtitle) {
    p.text({
      x: m,
      y: 340,
      w: titleW,
      text: clamp(slide.subtitle, 120),
      size: p.t(30),
      color: pal.accent,
      font: "display",
      italic: style.fonts.display.pdf === "times",
    });
  }
  if (slide.body) {
    p.text({
      x: m,
      y: 452,
      w: Math.min(titleW, 640),
      text: clamp(slide.body, 220),
      size: p.t(18),
      color: pal.muted,
      font: "body",
    });
  }
  if (slide.tags.length) tagCloud(p, slide.tags, m, 540, content - 120);
}

function drawDivider(p: Painter, slide: DeckSlide) {
  const { pal } = p;
  const inv = inverse(p);
  p.rect({ x: 0, y: 0, w: W, h: H, color: inv.bg });
  p.text({
    x: 0,
    y: 268,
    w: W,
    text: slide.eyebrow,
    size: p.t(15),
    color: pal.accent,
    font: "mono",
    bold: true,
    caps: true,
    align: "center",
  });
  p.text({
    x: 120,
    y: 312,
    w: W - 240,
    text: clamp(slide.title, 46),
    size: p.t(64),
    color: inv.fg,
    font: "display",
    bold: true,
    align: "center",
  });
  if (slide.subtitle) {
    p.text({
      x: 220,
      y: 420,
      w: W - 440,
      text: clamp(slide.subtitle, 150),
      size: p.t(19),
      color: inv.sub,
      font: "body",
      align: "center",
    });
  }
}

function drawStatement(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  let y = top;
  if (slide.subtitle) {
    p.eyebrow(slide.subtitle, m, y, content);
    y += 36;
  }
  if (slide.body) {
    const size = p.t(slide.body.length > 220 ? 26 : 32);
    p.text({
      x: m,
      y,
      w: content - 120,
      text: slide.body,
      size,
      color: pal.ink,
      font: "display",
    });
    y += blockHeight(slide.body, content - 120, size) + 30;
  }
  bulletList(p, slide, m, y, content, slide.bullets.length > 3 ? 2 : 1);
}

function drawSplit(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const leftW = Math.round(content * 0.46);
  const rightX = m + leftW + 44;
  const rightW = content - leftW - 44;
  let ly = top;

  if (slide.body) {
    const size = p.t(23);
    p.text({ x: m, y: ly, w: leftW, text: slide.body, size, color: pal.ink, font: "body" });
    ly += blockHeight(slide.body, leftW, size) + 28;
  }
  if (slide.subtitle) {
    p.eyebrow(slide.subtitle, m, Math.min(ly, H - 190), leftW);
  }

  const items = slide.bullets.slice(0, p.style.density);
  const hasDetail = items.some((b) => b.detail);
  const listH = items.length * (hasDetail ? 74 : 48);
  const panelTop = top - 18;
  const panelH = Math.min(
    H - panelTop - 130,
    Math.max(180, listH + 62, slide.tags.length && !items.length ? 190 : 0),
  );
  p.card(rightX, panelTop, rightW, panelH, true);
  bulletList(p, slide, rightX + 28, panelTop + 30, rightW - 56, 1);
  if (!items.length && slide.tags.length) {
    tagCloud(p, slide.tags, rightX + 28, panelTop + 30, rightW - 56);
  }
}

function drawFlow(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const steps = slide.steps.slice(0, 5);
  if (!steps.length) return;
  const gap = 18;
  const cardW = (content - gap * (steps.length - 1)) / steps.length;
  const cardH = 210;
  steps.forEach((step, i) => {
    const x = m + i * (cardW + gap);
    p.card(x, top, cardW, cardH, i === 0);
    p.rect({ x, y: top, w: cardW, h: 4, color: pal.accent, radius: 2 });
    p.text({
      x: x + 22,
      y: top + 26,
      w: cardW - 44,
      text: String(i + 1).padStart(2, "0"),
      size: p.t(15),
      color: pal.accent,
      font: "mono",
      bold: true,
    });
    p.text({
      x: x + 22,
      y: top + 62,
      w: cardW - 44,
      text: clamp(step, 110),
      size: p.t(17),
      color: pal.ink,
      font: "body",
    });
    if (i < steps.length - 1) {
      p.rect({ x: x + cardW + 4, y: top + cardH / 2, w: gap - 8, h: 2, color: pal.rule });
    }
  });
}

function drawProcess(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const steps = slide.steps.slice(0, 4);
  const rowH = 84;
  steps.forEach((step, i) => {
    const y = top + i * (rowH + 12);
    p.card(m, y, content, rowH);
    p.rect({ x: m, y, w: 5, h: rowH, color: pal.accent });
    p.text({
      x: m + 28,
      y: y + 28,
      w: 60,
      text: String(i + 1).padStart(2, "0"),
      size: p.t(22),
      color: pal.accent,
      font: "mono",
      bold: true,
    });
    p.text({
      x: m + 100,
      y: y + 28,
      w: content - 130,
      text: clamp(step, 140),
      size: p.t(19),
      color: pal.ink,
      font: "body",
    });
  });
}

function drawFeatures(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const items = slide.bullets.slice(0, 6);
  if (!items.length) return;
  const cols = items.length <= 2 ? items.length : items.length <= 4 ? 2 : 3;
  const rows = Math.ceil(items.length / cols);
  const gap = 20;
  const cardW = (content - gap * (cols - 1)) / cols;
  const hasDetail = items.some((i) => i.detail);
  const cardH = Math.min(
    hasDetail ? 172 : 118,
    (H - top - 130 - gap * (rows - 1)) / rows,
  );

  items.forEach((item, i) => {
    const x = m + (i % cols) * (cardW + gap);
    const y = top + Math.floor(i / cols) * (cardH + gap);
    p.card(x, y, cardW, cardH);
    p.rect({ x: x + 22, y: y + 22, w: 30, h: 4, color: pal.accent });
    p.text({
      x: x + 22,
      y: y + 42,
      w: cardW - 44,
      text: clamp(item.label, 60),
      size: p.t(19),
      color: pal.ink,
      font: "body",
      bold: true,
    });
    if (item.detail) {
      p.text({
        x: x + 22,
        y: y + 84,
        w: cardW - 44,
        text: clamp(item.detail, 120),
        size: p.t(14),
        color: pal.muted,
        font: "body",
      });
    }
  });
}

function drawMetrics(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const items = slide.metrics.slice(0, 3);
  if (!items.length) return;
  const gap = 22;
  const cardW = (content - gap * (items.length - 1)) / items.length;
  items.forEach((metric, i) => {
    const x = m + i * (cardW + gap);
    p.card(x, top, cardW, 210, i === 0);
    p.text({
      x: x + 26,
      y: top + 34,
      w: cardW - 52,
      text: clamp(metric.value, 22),
      size: p.t(46),
      color: pal.accent,
      font: "display",
      bold: true,
    });
    p.text({
      x: x + 26,
      y: top + 108,
      w: cardW - 52,
      text: clamp(metric.label, 44),
      size: p.t(17),
      color: pal.ink,
      font: "body",
      bold: true,
    });
    if (metric.detail) {
      p.text({
        x: x + 26,
        y: top + 140,
        w: cardW - 52,
        text: clamp(metric.detail, 90),
        size: p.t(13),
        color: pal.muted,
        font: "body",
      });
    }
  });
}

function drawMatrix(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const cols = slide.columns.slice(0, 3);
  if (!cols.length) return;
  const gap = 20;
  const colW = (content - gap * (cols.length - 1)) / cols.length;
  const rows = Math.max(...cols.map((c) => Math.min(5, c.items.length)), 1);
  const colH = Math.min(H - top - 130, 96 + rows * 52);

  cols.forEach((col, i) => {
    const x = m + i * (colW + gap);
    p.card(x, top, colW, colH, col.highlight);
    p.rect({ x, y: top, w: colW, h: 4, color: col.highlight ? pal.accent : pal.rule });
    p.text({
      x: x + 24,
      y: top + 26,
      w: colW - 48,
      text: clamp(col.title, 40),
      size: p.t(19),
      color: col.highlight ? pal.accent : pal.ink,
      font: "body",
      bold: true,
    });
    col.items.slice(0, 5).forEach((item, j) => {
      const iy = top + 76 + j * 52;
      p.rect({ x: x + 24, y: iy + 8, w: 6, h: 6, color: pal.accent, radius: 3 });
      p.text({
        x: x + 42,
        y: iy,
        w: colW - 66,
        text: clamp(item, 76),
        size: p.t(15),
        color: pal.muted,
        font: "body",
      });
    });
  });
}

function drawTimeline(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const phases = slide.phases.slice(0, 4);
  if (!phases.length) return drawFlow(p, { ...slide, steps: slide.steps }, top);
  const gap = 18;
  const colW = (content - gap * (phases.length - 1)) / phases.length;
  const lineY = top + 22;
  p.rect({ x: m, y: lineY, w: content, h: 2, color: pal.rule });

  phases.forEach((phase, i) => {
    const x = m + i * (colW + gap);
    p.rect({ x, y: lineY - 7, w: 16, h: 16, color: pal.accent, radius: 8 });
    p.text({
      x,
      y: lineY + 28,
      w: colW,
      text: clamp(phase.phase, 26),
      size: p.t(14),
      color: pal.accent,
      font: "mono",
      bold: true,
      caps: true,
    });
    p.text({
      x,
      y: lineY + 58,
      w: colW - 12,
      text: clamp(phase.label, 90),
      size: p.t(19),
      color: pal.ink,
      font: "body",
      bold: true,
    });
    if (phase.detail) {
      p.text({
        x,
        y: lineY + 116,
        w: colW - 12,
        text: clamp(phase.detail, 120),
        size: p.t(14),
        color: pal.muted,
        font: "body",
      });
    }
  });
}

function drawArchitecture(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const layers = slide.columns.length
    ? slide.columns.slice(0, 3)
    : [{ title: "Stack", items: slide.tags.slice(0, 9), highlight: false }];
  const rowH = 108;
  layers.forEach((layer, i) => {
    const y = top + i * (rowH + 16);
    p.card(m, y, content, rowH, i === 0);
    p.text({
      x: m + 24,
      y: y + 20,
      w: 200,
      text: clamp(layer.title, 26),
      size: p.t(15),
      color: pal.accent,
      font: "mono",
      bold: true,
      caps: true,
    });
    let tx = m + 24;
    layer.items.slice(0, 6).forEach((item) => {
      const tw = Math.max(96, item.length * 9 + 32);
      if (tx + tw > m + content - 24) return;
      p.rect({
        x: tx,
        y: y + 54,
        w: tw,
        h: 36,
        color: pal.bg,
        radius: 18,
        borderColor: pal.rule,
        borderWidth: 1,
      });
      p.text({
        x: tx + 16,
        y: y + 64,
        w: tw - 32,
        text: clamp(item, 22),
        size: p.t(13),
        color: pal.ink,
        font: "mono",
      });
      tx += tw + 12;
    });
  });
  if (slide.body) {
    p.text({
      x: m,
      y: H - 156,
      w: content - 60,
      text: clamp(slide.body, 180),
      size: p.t(16),
      color: pal.muted,
      font: "body",
    });
  }
}

function drawQuote(p: Painter, slide: DeckSlide) {
  const { pal } = p;
  p.rect({ x: 0, y: 0, w: W, h: H, color: pal.panelAlt });
  p.rect({ x: 0, y: 0, w: W, h: 6, color: pal.accent });
  p.text({
    x: 0,
    y: 190,
    w: W,
    text: slide.eyebrow,
    size: p.t(14),
    color: pal.accent,
    font: "mono",
    bold: true,
    caps: true,
    align: "center",
  });
  p.text({
    x: 140,
    y: 244,
    w: W - 280,
    text: clamp(slide.body || slide.title, 220),
    size: p.t(40),
    color: pal.ink,
    font: "display",
    italic: p.style.fonts.display.pdf === "times",
    align: "center",
  });
  if (slide.closing) {
    p.text({
      x: 200,
      y: 486,
      w: W - 400,
      text: clamp(slide.closing, 140),
      size: p.t(18),
      color: pal.muted,
      font: "body",
      align: "center",
    });
  }
}

function drawQuestions(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  const items = slide.steps.slice(0, 3);
  const gap = 20;
  const cardW = (content - gap * (items.length - 1)) / Math.max(1, items.length);
  items.forEach((question, i) => {
    const x = m + i * (cardW + gap);
    p.card(x, top, cardW, 196);
    p.text({
      x: x + 24,
      y: top + 24,
      w: cardW - 48,
      text: `Q${i + 1}`,
      size: p.t(15),
      color: pal.accent,
      font: "mono",
      bold: true,
    });
    p.text({
      x: x + 24,
      y: top + 62,
      w: cardW - 48,
      text: clamp(question, 180),
      size: p.t(18),
      color: pal.ink,
      font: "body",
    });
  });
  if (slide.body) {
    p.text({
      x: m,
      y: top + 226,
      w: content - 60,
      text: clamp(slide.body, 200),
      size: p.t(15),
      color: pal.muted,
      font: "body",
    });
  }
}

function drawGap(p: Painter, slide: DeckSlide, top: number) {
  const { m, content, pal } = p;
  p.card(m, top, content, 210, true);
  p.text({
    x: m + 32,
    y: top + 32,
    w: content - 64,
    text: "Evidence not present in the source documentation",
    size: p.t(15),
    color: pal.accent,
    font: "mono",
    bold: true,
    caps: true,
  });
  p.text({
    x: m + 32,
    y: top + 72,
    w: content - 64,
    text: slide.body || "This section is intentionally left unclaimed.",
    size: p.t(22),
    color: pal.ink,
    font: "body",
  });
  if (slide.subtitle) {
    p.text({
      x: m + 32,
      y: top + 150,
      w: content - 64,
      text: slide.subtitle,
      size: p.t(15),
      color: pal.muted,
      font: "body",
      italic: true,
    });
  }
  bulletList(p, slide, m, top + 250, content, 2);
}

function drawClosing(p: Painter, slide: DeckSlide) {
  const { m, content, pal } = p;
  const inv = inverse(p);
  p.rect({ x: 0, y: 0, w: W, h: H, color: inv.bg });
  p.rect({ x: 0, y: 0, w: 200, h: 8, color: pal.accent });
  p.text({
    x: m,
    y: 200,
    w: content,
    text: slide.eyebrow,
    size: p.t(14),
    color: pal.accent,
    font: "mono",
    bold: true,
    caps: true,
  });
  p.text({
    x: m,
    y: 244,
    w: content - 160,
    text: clamp(slide.title, 46),
    size: p.t(62),
    color: inv.fg,
    font: "display",
    bold: true,
  });
  if (slide.body) {
    p.text({
      x: m,
      y: 388,
      w: content - 300,
      text: clamp(slide.body, 200),
      size: p.t(21),
      color: inv.sub,
      font: "body",
    });
  }
  if (slide.closing) {
    p.rect({ x: m, y: 500, w: 6, h: 56, color: pal.accent });
    p.text({
      x: m + 24,
      y: 512,
      w: content - 100,
      text: clamp(slide.closing, 120),
      size: p.t(26),
      color: inv.fg,
      font: "display",
      bold: true,
    });
  }
}

/* ------------------------------------------------------------------ router */

const FULL_BLEED = new Set(["cover", "divider", "quote", "closing"]);

/**
 * Converts one slide into resolution-independent draw operations, themed by
 * the deck's chosen style. Preview, PPTX and PDF all consume this same output.
 *
 * @param slide - The slide to render.
 * @param styleId - Deck style identifier.
 * @returns Ordered draw operations in 1280×720 space.
 */
export function slideToOps(slide: DeckSlide, styleId?: string): DrawOp[] {
  const style = getDeckStyle(styleId);
  const p = new Painter(style);
  p.rect({ x: 0, y: 0, w: W, h: H, color: style.palette.bg });

  if (slide.layout === "cover") {
    drawCover(p, slide);
    footer(p, slide);
    return p.ops;
  }
  if (slide.layout === "divider") {
    drawDivider(p, slide);
    return p.ops;
  }
  if (slide.layout === "quote") {
    drawQuote(p, slide);
    footer(p, slide);
    return p.ops;
  }
  if (slide.layout === "closing") {
    drawClosing(p, slide);
    return p.ops;
  }

  const top = header(p, slide);

  switch (slide.layout) {
    case "split":
    case "market":
    case "model":
      drawSplit(p, slide, top);
      break;
    case "flow":
      drawFlow(p, slide, top);
      break;
    case "process":
      drawProcess(p, slide, top);
      break;
    case "features":
    case "advantage":
      drawFeatures(p, slide, top);
      break;
    case "metrics":
      drawMetrics(p, slide, top);
      break;
    case "matrix":
    case "comparison":
      drawMatrix(p, slide, top);
      break;
    case "architecture":
    case "technology":
      drawArchitecture(p, slide, top);
      break;
    case "timeline":
    case "roadmap":
      drawTimeline(p, slide, top);
      break;
    case "questions":
      drawQuestions(p, slide, top);
      break;
    case "gap":
      drawGap(p, slide, top);
      break;
    default:
      drawStatement(p, slide, top);
  }

  if (!FULL_BLEED.has(slide.layout)) {
    note(p, slide);
    footer(p, slide);
  }
  return p.ops;
}
