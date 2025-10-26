<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Climate Legend</title>

  <style>
    body {
      background-color: #000; /* black page background */
      color: #fff;            /* white text (for anything outside legend) */
    }

    .legend {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: grid;
      grid-template-columns: repeat(6, 1fr);   /* 6 uniform columns */
      gap: 16px 28px; padding: 24px; 
      background: #fff;                        /* keep legend white */
      border: 2px solid #ccc; border-radius: 16px;
      font-family: system-ui, Arial, sans-serif; color: #222;
      box-shadow: 0 8px 28px rgba(0,0,0,.08);
      max-width: min(96vw, 1600px);
    }

    .legend-item {
      display: flex; align-items: center; gap: 20px;
      min-width: 0;
    }

    .legend-swatch {
      width: 72px; height: 36px; border: 2px solid #333; border-radius: 6px;
      box-sizing: border-box; opacity: 0.7;
      flex: 0 0 auto;
    }

    .legend-label {
      display: block;
      white-space: nowrap; overflow: hidden;
      text-overflow: clip;
      flex: 1 1 auto; min-width: 0;
      line-height: 1.2;
    }
  </style>
</head>

<body>
  <script>
    // ---------- CONFIG ----------
    const LEGEND_ITEMS = [
      { label: "EC2",              color: "#FFFFFF" },
      { label: "EB1",              color: "#0000FF" },
      { label: "EHB2",              color: "#002200" },
      { label: "DB1",              color: "#FF0000" },
      { label: "DHB2",              color: "#004400" },
      { label: "DHA1",              color: "#008800" },
    ];
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
      const MAX = 28;  // starting font size (px)
      const MIN = 16;  // minimum font size (px)
      const STEP = 1;  // shrink step (px)

      const labels = Array.from(document.querySelectorAll('.legend-label'));
      labels.forEach(el => {
        let size = MAX;
        el.style.fontSize = `${size}px`;
        while (size > MIN && el.scrollWidth > el.clientWidth) {
          size -= STEP;
          el.style.fontSize = `${size}px`;
        }
      });
    })();
  </script>
</body>
</html>
