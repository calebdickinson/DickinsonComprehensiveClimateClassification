// Define and inject styles
const style = document.createElement('style');
style.textContent = `
  .legend {
  display: grid;
  /* pick the maximum number of columns in any row of your layout */
  grid-template-columns: repeat(6, auto);
  grid-auto-rows: auto;
  gap: 5px 10px;
  max-height: calc(100vh - 20px);
  overflow-y: auto;
  background: white;
  font-family: Arial;
  padding: 10px;
  border: 1px solid #ccc;
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  border-radius: 6px;
}
.legend-item {
  display: flex;
  align-items: center;
}
.legend-item.blank {
  /* invisible placeholder to preserve the grid cell */
  visibility: hidden;
}
.color-box {
  width: 40px;
  height: 20px;
  margin-right: 10px;
  border: 1px solid #333;
}
`;
document.head.appendChild(style);

// Create container
const container = document.createElement('div');
container.className = 'legend';
document.body.appendChild(container);

const codeColorMap = {
  "AWZ2": "#800080",
  "ADZ2": "#FF0000",
  "AGZ1": "#90EE90",
  "AWZ1": "#800080",
  "ASZ1": "#FFA500",
  "ADZ1": "#FF0000",
  "AHA2": "#006400",
  "AGA2": "#90EE90",
  "AWA2": "#800080",
  "AMA2": "#FFFF00",
  "ASA2": "#FFA500",
  "ADA2": "#FF0000",
  "AHA1": "#006400",
  "AGA1": "#90EE90",
  "AWA1": "#800080",
  "ASA1": "#FFA500",
  "ADA1": "#FF0000",
  "BDX1": "#FF0000",
  "BWZ2": "#800080",
  "BSZ2": "#FFA500",
  "BDZ2": "#FF0000",
  "BWZ1": "#800080",
  "BSZ1": "#FFA500",
  "BDZ1": "#FF0000",
  "BHA2": "#006400",
  "BGA2": "#90EE90",
  "BWA2": "#800080",
  "BMA2": "#FFFF00",
  "BSA2": "#FFA500",
  "BDA2": "#FF0000",
  "BHA1": "#006400",
  "BGA1": "#90EE90",
  "BWA1": "#800080",
  "BMA1": "#FFFF00",
  "BSA1": "#FFA500",
  "BDA1": "#FF0000",
  "BHB2": "#006400",
  "BGB2": "#90EE90",
  "BWB2": "#800080",
  "BMB2": "#FFFF00",
  "BSB2": "#FFA500",
  "BDB2": "#FF0000",
  "B_B1": "#0000FF",
  "CDZ2": "#FF0000",
  "CHZ1": "#006400",
  "CGZ1": "#90EE90",
  "CSZ1": "#FFA500",
  "CDZ1": "#FF0000",
  "CHA2": "#006400",
  "CGA2": "#90EE90",
  "CWA2": "#800080",
  "CMA2": "#FFFF00",
  "CSA2": "#FFA500",
  "CDA2": "#FF0000",
  "CHA1": "#006400",
  "CGA1": "#90EE90",
  "CWA1": "#800080",
  "CMA1": "#FFFF00",
  "CSA1": "#FFA500",
  "CDA1": "#FF0000",
  "CHB2": "#006400",
  "CGB2": "#90EE90",
  "CWB2": "#800080",
  "CMB2": "#FFFF00",
  "CSB2": "#FFA500",
  "CDB2": "#FF0000",
  "C_B1": "#0000FF",
  "C_C2": "#0000FF",
  "C_C1": "#0000FF",
  "DDZ1": "#FF0000",
  "DHA2": "#006400",
  "DGA2": "#90EE90",
  "DWA2": "#800080",
  "DMA2": "#FFFF00",
  "DSA2": "#FFA500",
  "DDA2": "#FF0000",
  "DHA1": "#006400",
  "DGA1": "#90EE90",
  "DWA1": "#800080",
  "DMA1": "#FFFF00",
  "DSA1": "#FFA500",
  "DDA1": "#FF0000",
  "DHB2": "#006400",
  "DGB2": "#90EE90",
  "DWB2": "#800080",
  "DMB2": "#FFFF00",
  "DSB2": "#FFA500",
  "DDB2": "#FF0000",
  "D_B1": "#0000FF",
  "D_C2": "#0000FF",
  "D_C1": "#0000FF",
  "D_Y":  "#0000FF",
  "EWA2": "#800080",
  "ESA2": "#FFA500",
  "EDA2": "#FF0000",
  "EHA1": "#006400",
  "EGA1": "#90EE90",
  "EWA1": "#800080",
  "ESA1": "#FFA500",
  "EDA1": "#FF0000",
  "EHB2": "#006400",
  "EGB2": "#90EE90",
  "EWB2": "#800080",
  "EMB2": "#FFFF00",
  "ESB2": "#FFA500",
  "EDB2": "#FF0000",
  "E_B1": "#0000FF",
  "E_C2": "#0000FF",
  "E_C1": "#0000FF",
  "E_Y":  "#0000FF",
  "F_A1": "#0000FF",
  "F_B2": "#0000FF",
  "F_B1": "#0000FF",
  "F_C2": "#0000FF",
  "F_C1": "#0000FF",
  "F_Y":  "#0000FF",
  "G_B2": "#0000FF",
  "G_B1": "#0000FF",
  "G_C2": "#0000FF",
  "G_C1": "#0000FF",
  "G_Y":  "#0000FF",
  "Y_B2": "#0000FF",
  "Y_B1": "#0000FF",
  "Y_Y":  "#0000FF"
};

const legendData = [
  "    ", "    ", "AWZ2", "    ", "    ", "ADZ2",
  "    ", "AGZ1", "AWZ1", "    ", "ASZ1", "ADZ1",
  "AHA2", "AGA2", "AWA2", "AMA2", "ASA2", "ADA2", 
  "AHA1", "AGA1", "AWA1", "    ", "ASA1", "ADA1",
  "    ", "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "BDX1",
  "    ", "    ", "BWZ2", "    ", "BSZ2", "BDZ2",
  "    ", "    ", "BWZ1", "    ", "BSZ1", "BDZ1",
  "BHA2", "BGA2", "BWA2", "BMA2", "BSA2", "BDA2",
  "BHA1", "BGA1", "BWA1", "BMA1", "BSA1", "BDA1",
  "BHB2", "BGB2", "BWB2", "BMB2", "BSB2", "BDB2",
  "B_B1", "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "CDZ2",
  "CHZ1", "CGZ1", "    ", "    ", "CSZ1", "CDZ1",
  "CHA2", "CGA2", "CWA2", "CMA2", "CSA2", "CDA2",
  "CHA1", "CGA1", "CWA1", "CMA1", "CSA1", "CDA1",
  "CHB2", "CGB2", "CWB2", "CMB2", "CSB2", "CDB2",
  "C_B1", "    ", "    ", "    ", "    ", "    ",
  "C_C2", "    ", "    ", "    ", "    ", "    ",
  "C_C1", "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "DDZ1",
  "DHA2", "DGA2", "DWA2", "DMA2", "DSA2", "DDA2",
  "DHA1", "DGA1", "DWA1", "DMA1", "DSA1", "DDA1",
  "DHB2", "DGB2", "DWB2", "DMB2", "DSB2", "DDB2",
  "D_B1", "    ", "    ", "    ", "    ", "    ",
  "D_C2", "    ", "    ", "    ", "    ", "    ",
  "D_C1", "    ", "    ", "    ", "    ", "    ",
  "D_Y" , "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "EWA2", "    ", "ESA2", "EDA2",
  "EHA1", "EGA1", "EWA1", "    ", "ESA1", "EDA1",
  "EHB2", "EGB2", "EWB2", "EMB2", "ESB2", "EDB2",
  "E_B1", "    ", "    ", "    ", "    ", "    ",
  "E_C2", "    ", "    ", "    ", "    ", "    ",
  "E_C1", "    ", "    ", "    ", "    ", "    ",
  "E_Y" , "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "    ",
  "F_A1", "F_B2", "F_B1", "F_C2", "F_C1", "F_Y" ,
  "    ", "    ", "    ", "    ", "    ", "    ",
  "    ", "G_B2", "G_B1", "G_C2", "G_C1", "G_Y" ,
  "    ", "    ", "    ", "    ", "    ", "    ",
  "    ", "Y_B2", "Y_B1", "    ", "    ", "Y_Y" ,
  "    ", "    ", "    ", "    ", "    ", "    ",
  ];

legendData.forEach(code => {
  if (!code.trim() || !(code in codeColorMap)) {
    const placeholder = document.createElement('div');
    placeholder.className = 'legend-item';
    const box = document.createElement('div');
    box.className = 'color-box';
    box.style.visibility = 'hidden';
    placeholder.appendChild(box);
    container.appendChild(placeholder);
    return;
  }

  // Look up the manually assigned color
  const hexColor = codeColorMap[code];

  const item = document.createElement('div');
  item.className = 'legend-item';

  const box = document.createElement('div');
  box.className = 'color-box';
  box.style.backgroundColor = hexColor;

  const label = document.createElement('span');
  label.textContent = code;

  item.appendChild(box);
  item.appendChild(label);
  container.appendChild(item);
});
