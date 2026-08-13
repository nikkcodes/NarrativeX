import { DECK_SIZE, type DeckSlide } from "@/lib/deck/schema";
import { slideToOps } from "@/lib/deck/layout";
import { getDeckStyle } from "@/lib/deck/styles";
import { cn } from "@/lib/utils";

/**
 * Renders one slide at native 1280×720 from the very same draw operations the
 * PPTX and PDF exporters consume, so the preview is a true proof of the file.
 */
export function SlideCanvas({
  slide,
  styleId,
  className,
}: {
  slide: DeckSlide;
  styleId?: string;
  className?: string;
}) {
  const style = getDeckStyle(styleId);
  const ops = slideToOps(slide, styleId);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        width: DECK_SIZE.width,
        height: DECK_SIZE.height,
        backgroundColor: `#${style.palette.bg}`,
      }}
      aria-label={`Slide ${slide.number}: ${slide.title}`}
    >
      {ops.map((op, i) =>
        op.kind === "rect" ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: op.x,
              top: op.y,
              width: op.w,
              height: op.h,
              backgroundColor: `#${op.color}`,
              borderRadius: op.radius ?? 0,
              border: op.borderColor
                ? `${op.borderWidth ?? 1}px solid #${op.borderColor}`
                : undefined,
              boxSizing: "border-box",
            }}
          />
        ) : (
          <div
            key={i}
            style={{
              position: "absolute",
              left: op.x,
              top: op.y,
              width: op.w,
              color: `#${op.color}`,
              fontFamily: style.fonts[op.font].css,
              fontSize: op.size,
              fontWeight: op.bold ? 700 : 400,
              fontStyle: op.italic ? "italic" : "normal",
              lineHeight: op.lineHeight ?? 1.32,
              letterSpacing: op.caps ? "0.12em" : "-0.01em",
              textTransform: op.caps ? "uppercase" : "none",
              textAlign: op.align ?? "left",
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            {op.text}
          </div>
        ),
      )}
    </div>
  );
}
