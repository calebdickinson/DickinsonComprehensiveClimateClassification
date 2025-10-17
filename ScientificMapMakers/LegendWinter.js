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
    grid-template-columns: repeat(4, max-content); /* 4 columns wide */
    gap: 16px 28px; 
    padding: 24px; 
    background: #fff;
    border: 2px solid #ccc; 
    border-radius: 16px;
    font: 28px/1.2 system-ui, Arial, sans-serif; 
    color: #222;
    box-shadow: 0 8px 28px rgba(0,0,0,.08);
  }
  .legend-item { 
    display: flex; 
    align-items: center; 
    gap: 20px; 
  }
  .legend-swatch {
    width: 72px; 
    height: 36px; 
    border: 2px solid #333; 
    border-radius: 6px;
    box-sizing: border-box;
    opacity: 0.7; /* 70% opacity for each color */
  }
`;
document.head.appendChild(style);

// ---------- RENDER ----------
const legend = document.createElement('div');
legend.className = 'legend';
LEGEND_ITEMS.forEach(({label, color}) => {
  const item = document.createElement('div');
  item.className = 'legend-item';

  const swatch = document.createElement('div');
  swatch.className = 'legend-swatch';
  swatch.style.background = color;

  const text = document.createElement('span');
  text.textContent = label;

  item.appendChild(swatch);
  item.appendChild(text);
  legend.appendChild(item);
});
document.body.appendChild(legend);
