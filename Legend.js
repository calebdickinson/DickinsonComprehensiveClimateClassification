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
  "AHA2": "#009090",
  "AHA1": "#00CACA",

  "BHA2": "#005500",
  "BHA1": "#008800",
  "BHB2": "#00BB00",

  "CHZ1": "#005050",
  "CHA2": "#009090",
  "CHA1": "#00CACA",
  "CHB2": "#00EEEE",

  "DHA2": "#005500",
  "DHA1": "#008800",
  "DHB2": "#00BB00",

  "EHA1": "#00CACA",
  "EHB2": "#00EEEE",

  "AGZ1": "#90EE90",
  "AGA2": "#90EE90",
  "AGA1": "#90EE90",

  "BGA2": "#90EE90",
  "BGA1": "#90EE90",
  "BGB2": "#90EE90",

  "CGZ1": "#90EE90",
  "CGA2": "#90EE90",
  "CGA1": "#90EE90",
  "CGB2": "#90EE90",

  "DGA2": "#90EE90",
  "DGA1": "#90EE90",
  "DGB2": "#90EE90",

  "EGA1": "#90EE90",
  "EGB2": "#90EE90",

  "AMA2": "#FFFF00",

  "BMA2": "#FFFF00",
  "BMA1": "#FFFF00",
  "BMB2": "#FFFF00",

  "CMA2": "#FFFF00",
  "CMA1": "#FFFF00",
  "CMB2": "#FFFF00",

  "DMA2": "#FFFF00",
  "DMA1": "#FFFF00",
  "DMB2": "#FFFF00",

  "EMB2": "#FFFF00",

  "AWZ2": "#800080",
  "AWZ1": "#800080",
  "AWA2": "#800080",
  "AWA1": "#800080",

  "BWZ2": "#800080",
  "BWZ1": "#800080",
  "BWA2": "#800080",
  "BWA1": "#800080",
  "BWB2": "#800080",

  "CWA2": "#800080",
  "CWA1": "#800080",
  "CWB2": "#800080",

  "DWA2": "#800080",
  "DWA1": "#800080",
  "DWB2": "#800080",

  "EWA2": "#800080",
  "EWA1": "#800080",
  "EWB2": "#800080",

  "ASZ1": "#FFA500",
  "ASA1": "#FFA500",
  "ASA2": "#FFA500",
  
  "BSZ2": "#FFA500",
  "BSZ1": "#FFA500",
  "BSA2": "#FFA500",
  "BSA1": "#FFA500",
  "BSB2": "#FFA500",

  "CSZ1": "#FFA500",
  "CSA2": "#FFA500",
  "CSA1": "#FFA500",
  "CSB2": "#FFA500",

  "DSA2": "#FFA500",
  "DSA1": "#FFA500",
  "DSB2": "#FFA500",

  "ESA2": "#FFA500",
  "ESA1": "#FFA500",
  "ESB2": "#FFA500",

  "ADZ2": "#FF0000",
  "ADZ1": "#FF0000",
  "ADA2": "#FF0000",
  "ADA1": "#FF0000",

  "BDX1": "#000000",
  "BDZ2": "#770000",
  "BDZ1": "#FF0000",
  "BDA2": "#FF0000",
  "BDA1": "#FF0000",
  "BDB2": "#FF0000",

  "CDZ2": "#FF0000",
  "CDZ1": "#FF0000",
  "CDA2": "#FF0000",
  "CDA1": "#FF0000",
  "CDB2": "#FF0000",

  "DDZ1": "#FF0000",
  "DDA2": "#FF0000",
  "DDA1": "#FF0000",
  "DDB2": "#FF0000",

  "EDA2": "#FF0000",
  "EDA1": "#FF0000",
  "EDB2": "#FF0000",

  "B_B1": "#0000FF",

  "C_B1": "#3333FF",
  "C_C2": "#AC6AC5", 
  "C_C1": "#DC5596",

  "D_B1": "#5555FF",
  "D_C2": "#C378E0",
  "D_C1": "#FF69B4",
  "D_Y":  "#888888",

  "E_B1": "#7777FF",
  "E_C2": "#DD88FF",
  "E_C1": "#FF90BB",
  "E_Y":  "#AAAAAA",

  "F_A1": "#5C4033",
  "F_B2": "#964B00",
  "F_B1": "#9999FF",
  "F_C2": "#EFBBFF",
  "F_C1": "#FFB6C1",
  "F_Y":  "#CCCCCC",

  "G_B2": "#AD7842",
  "G_B1": "#BBBBFF",
  "G_C2": "#E6CCFF",
  "G_C1": "#FBD9ED",
  "G_Y":  "#EEEEEE",

  "Y_B2": "#C4A484",
  "Y_B1": "#DDDDFF",
  "Y_Y":  "#FFFFFF"
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
