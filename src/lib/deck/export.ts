import { DECK_SIZE, type Deck } from "@/lib/deck/schema";
import { slideToOps, type DrawOp } from "@/lib/deck/layout";
import { getDeckStyle } from "@/lib/deck/styles";

const PX_PER_IN = 96;
const px = (v: number) => v / PX_PER_IN;

function fileBase(deck: Deck) {
  return (deck.title || "pitch-deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function label(op: Extract<DrawOp, { kind: "text" }>) {
  return op.caps ? op.text.toUpperCase() : op.text;
}

export async function exportPptx(deck: Deck) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const style = getDeckStyle(deck.style);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PF", width: px(DECK_SIZE.width), height: px(DECK_SIZE.height) });
  pptx.layout = "PF";
  pptx.title = deck.title;

  for (const slide of deck.slides) {
    const s = pptx.addSlide();
    for (const op of slideToOps(slide, deck.style)) {
      if (op.kind === "rect") {
        s.addShape(op.radius ? "roundRect" : "rect", {
          x: px(op.x),
          y: px(op.y),
          w: px(op.w),
          h: px(op.h),
          fill: { color: op.color },
          line: op.borderColor
            ? { color: op.borderColor, width: op.borderWidth ?? 1 }
            : { color: op.color, width: 0 },
          ...(op.radius ? { rectRadius: Math.min(0.2, px(op.radius)) } : {}),
        });
      } else {
        s.addText(label(op), {
          x: px(op.x),
          y: px(op.y),
          w: px(op.w),
          h: px(
            op.size *
              1.35 *
              Math.max(1, Math.ceil(op.text.length / Math.max(1, op.w / (op.size * 0.5)))),
          ),
          fontSize: op.size * 0.75,
          color: op.color,
          bold: op.bold ?? false,
          italic: op.italic ?? false,
          fontFace: style.fonts[op.font].pptx,
          align: op.align ?? "left",
          valign: "top",
          margin: 0,
          charSpacing: op.caps ? 1 : 0,
        });
      }
    }
  }

  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  download(blob, `${fileBase(deck)}.pptx`);
}

export async function exportPdf(deck: Deck) {
  const { jsPDF } = await import("jspdf");
  const style = getDeckStyle(deck.style);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [DECK_SIZE.width, DECK_SIZE.height],
    compress: true,
  });

  deck.slides.forEach((slide, index) => {
    if (index > 0) doc.addPage([DECK_SIZE.width, DECK_SIZE.height], "landscape");
    for (const op of slideToOps(slide, deck.style)) {
      if (op.kind === "rect") {
        doc.setFillColor(`#${op.color}`);
        if (op.borderColor) {
          doc.setDrawColor(`#${op.borderColor}`);
          doc.setLineWidth(op.borderWidth ?? 1);
        }
        const mode = op.borderColor ? "FD" : "F";
        if (op.radius) doc.roundedRect(op.x, op.y, op.w, op.h, op.radius, op.radius, mode);
        else doc.rect(op.x, op.y, op.w, op.h, mode);
      } else {
        doc.setTextColor(`#${op.color}`);
        doc.setFont(
          style.fonts[op.font].pdf,
          op.italic ? "italic" : op.bold ? "bold" : "normal",
        );
        doc.setFontSize(op.size);
        const lines = doc.splitTextToSize(label(op), op.w) as string[];
        const align = op.align ?? "left";
        const x = align === "center" ? op.x + op.w / 2 : align === "right" ? op.x + op.w : op.x;
        doc.text(lines, x, op.y + op.size, {
          lineHeightFactor: 1.35,
          baseline: "alphabetic",
          align,
        });
      }
    }
  });

  download(doc.output("blob"), `${fileBase(deck)}.pdf`);
}
