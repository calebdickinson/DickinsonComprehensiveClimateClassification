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

// Tables
const winterZoneTable = {
  Z: '00',
  A: '22',
  B: '44',
  C: '66',
  D: '88',
  E: 'AA',
  F: 'CC',
  G: 'EE',
  Y: 'FF'
};
const aridityTable = {
  H: 'FF',
  G: 'DD',
  W: 'BB',
  M: '99',
  S: '55',
  D: '00' 
};
const summerZoneTable = {
  X1: 'FF',
  Z2: 'CC',
  Z1: 'AA',
  A2: '88',
  A1: '66',
  B2: '44',
  B1: '66',
  C2: '77',
  C1: '88',
  Y: ''
};

// Codes to show
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
  "BB1" , "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "CDZ2",
  "CHZ1", "CGZ1", "    ", "    ", "CSZ1", "CDZ1",
  "CHA2", "CGA2", "CWA2", "CMA2", "CSA2", "CDA2",
  "CHA1", "CGA1", "CWA1", "CMA1", "CSA1", "CDA1",
  "CHB2", "CGB2", "CWB2", "CMB2", "CSB2", "CDB2",
  "CB1" , "    ", "    ", "    ", "    ", "    ",
  "CC2" , "    ", "    ", "    ", "    ", "    ",
  "CC1" , "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "DDZ1",
  "DHA2", "DGA2", "DWA2", "DMA2", "DSA2", "DDA2",
  "DHA1", "DGA1", "DWA1", "DMA1", "DSA1", "DDA1",
  "DHB2", "DGB2", "DWB2", "DMB2", "DSB2", "DDB2",
  "DB1" , "    ", "    ", "    ", "    ", "    ",
  "DC2" , "    ", "    ", "    ", "    ", "    ",
  "DC1" , "    ", "    ", "    ", "    ", "    ",
  "DY"  , "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "EWA2", "    ", "ESA2", "EDA2",
  "EHA1", "EGA1", "EWA1", "    ", "ESA1", "EDA1",
  "EHB2", "EGB2", "EWB2", "EMB2", "ESB2", "EDB2",
  "EB1" , "    ", "    ", "    ", "    ", "    ",
  "EC2" , "    ", "    ", "    ", "    ", "    ",
  "EC1" , "    ", "    ", "    ", "    ", "    ",
  "EY"  , "    ", "    ", "    ", "    ", "    ",
  "    ", "    ", "    ", "    ", "    ", "    ",
  "FA1" , "FB2" , "FB1" , "FC2" , "FC1" , "FY"  ,
  "    ", "    ", "    ", "    ", "    ", "    ",
  "    ", "GB2" , "GB1" , "GC2" , "GC1" , "GY"  ,
  "    ", "    ", "    ", "    ", "    ", "    ",
  "    ", "YB2" , "YB1" , "    ", "    ", "YY"  ,
  "    ", "    ", "    ", "    ", "    ", "    ",
  ];

legendData.forEach(code => {
  const winter = code.charAt(0);    // e.g. "A"
  const arid   = code.charAt(1);    // e.g. "W"
  const summer = code.slice(2);     // e.g. "Z2"

  const blue  = winterZoneTable[winter]   || '00';
  const green = aridityTable[arid]        || '00';
  const red   = summerZoneTable[summer]    || '00';

  const hexColor = `#${red}${green}${blue}`;

  if (red === '00' && green === '00' && blue === '00') {
  const placeholder = document.createElement('div');
  placeholder.className = 'legend-item';
  const box = document.createElement('div');
  box.className = 'color-box';
  box.style.visibility = 'hidden';
  placeholder.appendChild(box);
  container.appendChild(placeholder);
  return;
}


const item = document.createElement('div');
item.className = 'legend-item';

const box = document.createElement('div');
box.className = 'color-box';
box.style.backgroundColor = hexColor;

const label = document.createElement('span');
label.textContent = `${code}`;

item.appendChild(box);
item.appendChild(label);
container.appendChild(item);

});
