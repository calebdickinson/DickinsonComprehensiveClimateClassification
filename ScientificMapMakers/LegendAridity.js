// ---------- CONFIG ----------
const LEGEND_ITEMS = [
  { label: "Humid",           color: "#008800" },
  { label: "Semihumid",       color: "#00FF00" },
  { label: "Semi-arid",       color: "#FFAA00" },
  { label: "Arid",            color: "#FF0000" },
  { label: "Monsoon",         color: "#FF00FF" },
  { label: "Mediterranean",   color: "#FFFF00" },
  { label: "Polar-Alpine",    color: "#3A7BD5" },
  { label: "non-Polar Ocean", color: "#7ED3E5" }
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
  }
  /* Checkerboard for transparent (if ever used) */
  .legend-swatch.transparent {
    background-image:
      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%),
      linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%);
    background-size: 20px 20px;
    background-position: 0 0, 10px 10px;
    background-color: transparent;
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
  if (color === 'transparent') {
    swatch.classList.add('transparent');
  } else {
    swatch.style.background = color;
  }

  const text = document.createElement('span');
  text.textContent = label;

  item.appendChild(swatch);
  item.appendChild(text);
  legend.appendChild(item);
});
document.body.appendChild(legend);
