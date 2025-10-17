// ---------- CONFIG ----------
const LEGEND_ITEMS = [
  { label: "Superarctic (Y)", color: "#000000" },
  { label: "Arctic (G)",      color: "#FF10F0" },
  { label: "Subarctic (F)",   color: "#0000FF" },
  { label: "Continental (E)", color: "#004400" },
  { label: "Temperate (D)",   color: "#008800" },
  { label: "Subtropical (C)", color: "#FFA500" },
  { label: "Tropical (B)",    color: "#FF0000" },
  { label: "Supertropical (A)", color: "#C71585" }
];

// ---------- STYLES ----------
const style = document.createElement('style');
style.textContent = `
  .legend {
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* 4 uniform columns */
    gap: 16px 28px; padding: 24px; background: #fff;
    border: 2px solid #ccc; border-radius: 16px;
    font-family: system-ui, Arial, sans-serif; color: #222;
    box-shadow: 0 8px 28px rgba(0,0,0,.08);
    max-width: min(96vw, 1600px);           /* responsive bound */
  }
  .legend-item {
    display: flex; align-items: center; gap: 20px;
    min-width: 0;                           /* allow label to shrink */
  }
  .legend-swatch {
    width: 72px; height: 36px; border: 2px solid #333; border-radius: 6px;
    box-sizing: border-box; opacity: 0.7;
    flex: 0 0 auto;
  }
  .legend-label {
    display: block;
    white-space: nowrap; overflow: hidden;   /* single line only */
    text-overflow: clip;                     /* we will shrink, not ellipsis */
    flex: 1 1 auto; min-width: 0;
    line-height: 1.2;
  }
`;
document.head.appendChild(style);

// ---------- RENDER ----------
const legend = document.createElement('div');
legend.className = 'legend';
document.body.appendChild(legend);

LEGEND_ITEMS.forEach(({label, color}) => {
  const item = document.createElement('div');
  item.className = 'legend-item';

  const swatch = document.createElement('div');
  swatch.className = 'legend-swatch';
  swatch.style.background = color;

  const text = document.createElement('span');
  text.className = 'legend-label';
  text.textContent = label;

  item.appendChild(swatch);
  item.appendChild(text);
  legend.appendChild(item);
});

// ---------- FIT LONG LABELS (auto-shrink) ----------
(function fitLabels() {
  const MAX = 28;          // starting font size (px)
  const MIN = 16;          // minimum font size (px)
  const STEP = 1;          // shrink step (px)

  const labels = Array.from(document.querySelectorAll('.legend-label'));
  labels.forEach(el => {
    // start at MAX, shrink until it fits
    let size = MAX;
    el.style.fontSize = `${size}px`;
    // measure overflow: scrollWidth > clientWidth means it's too long
    while (size > MIN && el.scrollWidth > el.clientWidth) {
      size -= STEP;
      el.style.fontSize = `${size}px`;
    }
  });
})();
