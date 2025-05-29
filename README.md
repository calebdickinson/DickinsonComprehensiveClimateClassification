# DICKINSON CLIMATE CLASSIFICATION

# How to run the code

To run the code, open two Earth Engine Code Editor windows.

Paste the full code of the the most up to date versions, AllVersionsTogether.js and 2100AllVersionsTogether.js seperately in New Script boxes of each of the windows.

Click the "run" button.

This will generate a current climate map and a map of the climate as it is projected to be in the year 2100 given NASA's RCP8.5 "business as usual" global warming/climate change projections.

!(https://github.com/calebdickinson/DickinsonComprehensiveClimateClassification/blob/main/images/screenshot.png)

All locations on the maps are organized and color-coded according to the Dickinson Comprehensive Climate Classification System, which is explained below in this README.

Clicking on any location of the map will result in the climate classification being shown directly below the "Click map for classification" on the bottom right.

Some of these functionalities and category displays may take some time to load.

You can also filter by climate codes using the bottom right dropdown menu.

A graph to the top right displays selected cities, organized by climate classification.

Anyone with a basic knowledge of programming could make their own versions of the code by editing to add more cities to the cityList that is displayed in this graph.

As of this writing, the cityList begins on line 411 of 2100AllVersionsTogether.js and line 372 of AllVersionsTogether.js.

Keep in mind that due to the limitations of the resolution of the data, some small remote islands and/or extremely mountainous areas may not be exactly rendered according to their true classification.

If a different range of years are desired, some simple editing of the first couple lines of the code will generate those years instead, if they are included in the NASA/NEX-GDDP or ECMWF/ERA5 datasets.

# The Dickinson Climate Classification explained

This is a new climate classification inspired by the Koppen system.

It is generally more granular and includes more edge cases than the Koppen system.

This method produces hundreds of possible climates; many of which are hypothetical.

This system has the advantage of the ability to accuratly describe hypothetical climates which may occur in the future due to climate change.

This could be useful in the future as humans continue to warm the earth with fossil fuels.

This system, being more generally more granular in many ways than the Koppen, better illustrates the differences between each of the new extreme climates we will see in the future.

This could even have importance in determining habitability in high emissions (business as usual) warming scenarios.

This system also, because of its edge cases, illustrates some intresting climate factors that may not be obvious on the Koppen.

Each climate is measured with 3 letters.

The first letter measures climate zones by measuring the average temperature of the coldest month in Celsius.

X = Uninhabitable. 40+ (hypothetical)

Z = Ultratropical. 30 - 40 (hypothetical)

A = Supertropical. 20 - 30

B = Tropical. 10 - 20

C = Subtropical. 0 - 10

D = Temperate. -10 - 0

E = Continental. -20 - -10

F = Subarctic. -30 - -20

G = Arctic. -40 - -30

Y = Superarctic. Below -40

The second letter measures aridity zones.

Aridity zones are measured using evapotraspiration, and thresholds had to be manually adjusted to match the boundaries of vegetation zones.

In the future, a more scientifically and specifically defined aridity calculation may be available. 

In the meantime, further information on the specifics of the aridity calculations may be found my examining my code and figuring out how it works.

In my system, the lettering of the aridity zones is as follows:

H = Humid

G = Semihumid

M = Meditterranean (If not arid desert and if < 35% of percipitation falls in the warm half of the year)

W = Monsoon (If not arid desert and if ≥ 80% of percipitation falls in the warm half of the year)

S = Semiarid

D = Arid Desert

The differences in ratios between mediterranean and monsoon may seem strange until you consider that evaporation rates are higher in the warmer months, therefore, the reason for a difference between these ratios (and their corresponding vegetation zones) is intuitive if you really think about it.

It is possible that aridity zone ratios may be further refined in the future; a more scientific examination of vegatation may require fine tuning.

On the other hand, climate zones and zummer zones are unlikely to be changed in the future; due to their root in Celsius and thus their categorizations being simple and intuitive percentages of the difference between the freezing and boiling temperatures of water.

Aridity does not appear to be relevant to the classification of climates that fall withiin subarctic, arctic, superarctic, cold summer, very cold summer, freezing summer, or frigid summer zones.

Climate classifications that fall within these zones are not measured by aridity.

The third letter measures the severity of the summers by measuring the average temperature of the warmest month in Celsius.

X1, X2, X3,... et cetera = Extreme Hyperthermal Summer. 40+ (X3 and above are hypothetical climates)

Z2 = Hyperthermal Summer. 35 - 40

Z1 = Scorching Hot Summer. 30 - 35

A2 = Very Hot Summer. 25 - 30

A1 = Hot Summer. 20 - 25

B2 = Mild Summer. 15 - 20

B1 = Cold summer. 10 - 15

C2 = Very Cold Summer. 5 - 10

C1 = Freezing Summer. 0 - 5

Y = Frigid Summer. Below 0

Programmers and others are encouraged to find uses for this system and to make their own software programs, visualisations, or spin offs of this one based on the Dickinson Climate Classification, as long as Caleb Dickinson is acknowledged as the creater of this system and the system is appropriately titled the Dickinson Climate Classification.

# Here are some examples of these zones.

# Ultratropical Climates (Z):

### Ultratropical Scorching Hot Summer climates (Z-Z1):

Ultratropical Humid Scorching Hot Summer: (ZHZ1):  

# Supertropical Climates (A):

### Supertropical Extreme Hyperthermal Summer climates (A-X1):

Supertropical Semihumid Extreme Hyperthermal Summer (AGX1):  

Supertropical Monsoon Extreme Hyperthermal Summer (AWX1):  

Supertropical Semiarid Extreme Hyperthermal Summer (ASX1):  

### Supertropical Hyperthermal Summer climates (A-Z2):

Supertropical Humid Hyperthermal Summer (AHZ2):  

Supertropical Semihumid Hyperthermal Summer (AGZ2):  

Supertropical Monsoon Hyperthermal Summer (AWZ2):  

Supertropical Semiarid Hyperthermal Summer (ASZ2):  

Supertropical Arid Desert Hyperthermal Summer (ADZ2):  

### Supertropical Scorching Hot Summer climates (A-Z1):

Supertropical Humid Scorching Hot Summer (AHZ1):  

Supertropical Semihumid Scorching Hot Summer (AGZ1):  
Bangkok, Thailand	(today)  
Ho Chi Minh City, Vietnam	(today)  
Chennai, India	(today)  
Phnom Penh, Cambodia	(today)  
Managua, Nicaragua	(today)  

Supertropical Monsoon Scorching Hot Summer (AWZ1):  
Ouagadougou, Burkina Faso	(today)  
Bamako, Mali	(today)  
Naypyidaw, Myanmar	(today)  
Abuja, Nigeria	(today)  

Supertropical Semiarid Scorching Hot Summer (ASZ1):  
Hyderabad, India	(today)  
Juba, South Sudan	(today)

Supertropical Arid Desert Scorching Hot Summer (ADZ1):  
N'Djamena, Chad	(today)  
Djibouti, Djibouti	(today)  
Niamey, Niger	(today)  
Muscat, Oman	(today)  
Khartoum, Sudan	(today)  
Abu Dhabi, United Arab Emirates	(today)  

### Supertropial Very Hot Summer climates (A-A2):

Supertropical Humid Very Hot Summer (AHA2):  
Manila, Philippines	(today)  
Kuala Lumpur, Malaysia	(today)  
San Juan, PR	(today)  
St. John's, Antigua and Barbuda	(today)  
Bandar Seri Begawan, Brunei	(today)  
Moroni, Comoros	(today)  
Roseau, Dominica	(today)  
Malabo, Equatorial Guinea	(today)  
Palikir, Federated States of Micronesia	(today)  
Georgetown, Guyana	(today)  
Kingston, Jamaica	(today)  
Monrovia, Liberia	(today)  
Majuro, Marshall Islands	(today)  
Ngerulmud, Palau	(today)  
Port Moresby, Papua New Guinea	(today)  
Basseterre, Saint Kitts and Nevis	(today)  
Apia, Samoa	(today)  
São Tomé, São Tomé and Príncipe	(today)  
Honiara, Solomon Islands (today)  
Sri Jayawardenepura Kotte, Sri Lanka	(today)  
Nukuʻalofa, Tonga	(today)  
Funafuti, Tuvalu	(today)  
Port Vila, Vanuatu	(today)  
Brades, Montserrat (UK)	(today)  
Pago Pago, American Samoa (US)	(today)  
Hagåtña, Guam (US)	(today)  
Saipan, Northern Mariana Islands (US)	(today)  
Charlotte Amalie, U.S. Virgin Islands (US)	(today)  
San Juan, Puerto Rico (US)	(today)  
Mata-Utu, Wallis & Futuna (FR)	(today)  
Avarua, Cook Islands (NZ)	(today)  
Alofi, Niue (NZ)	(today)  
Nukunonu, Tokelau (NZ)	(today)  

Supertropical Semihumid Very Hot Summer (AGA2):  
Lagos, Nigeria	(today)  
Honolulu, HI	(today)  
Nassau, Bahamas	(today)  
Bridgetown, Barbados	(today)  
Belmopan, Belize	(today)  
Yaoundé, Cameroon	(today)  
Bangui, Central African Republic	(today)  
Yamoussoukro, Côte d'Ivoire	(today)  
Havana, Cuba	(today)  
Santo Domingo, Dominican Republic	(today)  
St. George's, Grenada	(today)  
Port-au-Prince, Haiti	(today)  
Tarawa, Kiribati	(today)  
Malé, Maldives	(today)  
Yaren, Nauru	(today)  
Panama City, Panama	(today)  
Kingstown, Saint Vincent and the Grenadines	(today)  
Singapore, Singapore	(today)  
Paramaribo, Suriname	(today)  
Port of Spain, Trinidad and Tobago	(today)  
The Valley, Anguilla (UK)	(today)  
Road Town, British Virgin Islands (UK)	(today)  
Adamstown, Pitcairn Islands (UK)	(today)  
Philipsburg, Sint Maarten (NL)	(today)  

Supertropical Monsoon Very Hot Summer (AWA2):  
Jakarta, Indonesia	(today)  
Mumbai, India	(today)  
Kinshasa, DR Congo	(today)  
Brazzaville, Congo	(today)  
San Salvador, El Salvador	(today)  
Suva, Fiji	(today)  
Banjul, Gambia	(today)  
Conakry, Guinea	(today)  
Bissau, Guinea-Bissau	(today)  
Vientiane, Laos	(today)  
Port Louis, Mauritius	(today)  
Dakar, Senegal	(today)  
Victoria, Seychelles	(today)  
Freetown, Sierra Leone	(today)  
Dodoma, Tanzania	(today)  
Dili, Timor-Leste	(today)  
Papeete, French Polynesia (FR)	(today)  
Libreville, Gabon	(today)  

Supertropical Semiarid Very Hot Summer (ASA2):  
Bangalore, India	(today)  
Porto-Novo, Benin	(today)  
Accra, Ghana	(today)  
Castries, Saint Lucia	(today)  
Lomé, Togo	(today)  
Oranjestad, Aruba (NL)	(today)  
Kralendijk, Bonaire (NL)	(today)  
The Bottom, Saba (NL)	(today)  
Oranjestad, Sint Eustatius (NL)	(today)  

Supertropical Arid Desert Very Hot Summer (ADA2):  
Karachi, Pakistan	(today)  
Luanda, Angola	(today)  
Praia, Cabo Verde	(today)  
Nouakchott, Mauritania	(today)  
Mogadishu, Somalia	(today)  
George Town, Cayman Islands (UK)	(today)  
Cockburn Town, Turks & Caicos (UK)	(today)  
Willemstad, Curaçao (NL)	(today)  

### Supertropial Hot Summer climates (A-A1):

Supertropical Semihumid Hot Summer (AGA1):  
Caracas, Venezuela (today)

Supertropical Monsoon Hot Summer (AWA1):  
Brasília, Brazil (today)

# Tropical Climates (B):

### Tropical Extreme Hyperthermal Summer climates (B-X1):  

Tropical Monsoon Extreme Hyperthermal Summer (BWX1):  

Tropical Semiarid Extreme Hyperthermal Summer (BSX1):  

Tropical Arid Desert Extreme Hyperthermal Summer (BDX1):  

### Tropical Hyperthermal Summer climates (B-Z2):

Tropical Semihumid Hyperthermal Summer (BGZ2):  

Tropical Monsoon Hyperthermal Summer (BWZ2):  

Tropical Semiarid Hyperthermal Summer (BSZ2):  

Tropical Arid Desert Hyperthermal Summer (BDZ2):  
Phoenix–Mesa–Scottsdale, AZ	(today)  
Baghdad, Iraq	(today)  
Kuwait City, Kuwait	(today)  
Riyadh, Saudi Arabia	(today)  

### Tropical Scorching Hot Summer climates (B-Z1):

Tropical Humid Scorching Hot Summer (BHZ1):  

Tropical Semihumid Scorching Hot Summer (BGZ1):  

Tropical Monsoon Scorching Hot Summer (BWZ1):  
Delhi, India	(today)  
Kolkata, India	(today)  
Lahore, Pakistan	(today)  

Tropical Mediterranean Scorching Hot Summer (BMZ1):   

Tropical Desert Scorching Hot Summer (BDZ1):  
Manama, Bahrain	(today)  
Nicosia, Cyprus	(today)  
Doha, Qatar	(today)  

### Tropical Very Hot Summer Climates (B-A2):

Tropical Humid Very Hot Summer (BHA2):  
Taipei, Taiwan	(today)  
Nouméa, New Caledonia (FR)	(today)  

Tropical Semihumid Very Hot Summer (BGA2):  
Miami–Fort Lauderdale, FL	(today)  
Houston, TX	(today)  
Tampa–St. Petersburg, FL	(today)  
Orlando, FL	(today)  
Jacksonville, FL	(today)  
New Orleans, LA	(today)  
Tallahassee, FL	(today)  
Baton Rouge, LA	(today)  
Hamilton, Bermuda (UK)	(today)  

Tropical Monsoon Very Hot Summer (BWA2):  
Guangzhou–Foshan, China	(today)  
Dhaka, Bangladesh	(today)  
Shenzhen, China	(today)  
Rio de Janeiro, Brazil	(today)  
Dongguan, China	(today)  
Gaborone, Botswana	(today)  
Maputo, Mozambique	(today)  
Asunción, Paraguay	(today)  
Hanoi, Vietnam	(today)  

Tropical Mediterranean Very Hot Summer (BMA2):  
Algiers, Algeria	(today)  
Jerusalem, Israel	(today)  
Beirut, Lebanon	(today)  
Tunis, Tunisia	(today)  

Tropical Semiarid Very Hot Summer (BSA2):  
San Antonio, TX	(today)  
Austin, TX	(today)  

Tropical Arid Desert Very Hot Summer (BDA2):  !(images/All_Gizah_Pyramids.jpg)

Cairo, Egypt	(today)  
Amman, Jordan	(today)  
Tripoli, Libya	(today)  
Valletta, Malta	(today)  
Melilla, Melilla (ES)	(today)  

### Tropical Hot Summer Climates (B-A1):

Tropical Humid Hot Summer (BHA1):  
San José, Costa Rica	(today)  
Kingston, Norfolk Island (AU)	(today)  

Tropical Semihumid Hot Summer (BGA1):  
Buenos Aires, Argentina	(today)  
Tegucigalpa, Honduras	(today)  
Nairobi, Kenya	(today)  
Kampala, Uganda	(today)  
Montevideo, Uruguay	(today)  
Hanga Roa, Easter Island (CL)	(today)  

Tropical Monsoon Hot Summer (BWA1):  
São Paulo, Brazil	(today)  
Gitega, Burundi	(today)  
Asmara, Eritrea	(today)  
Antananarivo, Madagascar	(today)  
Lilongwe, Malawi	(today)  
Sana'a, Yemen	(today)  
Lusaka, Zambia	(today)  
Harare, Zimbabwe	(today)  

Tropical Mediterranean Hot Summer (BMA1):  
Los Angeles, United States	(today)  
Riverside–San Bernardino, CA	(today)  
Rabat, Morocco	(today)  
Lisbon, Portugal	(today)  
Gibraltar, Gibraltar (UK)	(today)  
Ceuta, Ceuta (ES)	(today)  
Ponta Delgada, Azores (PT)	(today)  
Funchal, Madeira (PT)	(today)  

Tropical Semiarid Hot Summer (BSA1):  
Jamestown, St Helena (UK) (today)  

Tropical Arid Desert Hot Summer (BDA1):  
Lima, Peru	(today)  
San Diego, CA	(today)  
Windhoek, Namibia	(today)  

### Tropical Mild Summer Climates (B-B2):

Tropical Humid Mild Summer (BHB2):  
Guatemala City, Guatemala	(today)  
Wellington, New Zealand	(today)  
Edinburgh of the Seven Seas (today)  
Bogotá, Colombia (today)

Tropical Semihumid Mild Summer (BGB2):  
Kigali, Rwanda (today)  
Cape Town, South Africa (today)

Tropical Monsoon Mild Summer (BWB2):  
Mexico City, Mexico (today)  
Mbabane, Eswatini (today)  
Addis Ababa, Ethiopia (today)

### Tropical Cold Summer Climate (BB1):  
Quito, Ecuador (today)  
Sucre, Bolivia (today)

# Subtropical Climates (C):

### Subtropical Extreme Hyperthermal Summer Climates (C-X1):

Subtropical Semihumid Extreme Hyperthermal Summer (CGX1):  

Subtropical Monsoon Extreme Hyperthermal Summer (CWX1):  

Subtropical Mediterranean Extreme Hyperthermal Summer (CMX1):  

Subtropical Semiarid Extreme Hyperthermal Summer (CSX1):  

Subtropical Desert Wasteland (CDX1):  

### Subtropical Hyperthermal Summer Climates (C-Z2):

Subtropical Humid Hyperthermal Summer (CHZ2):  

Subtropical Semihumid Hyperthermal Summer (CGZ2):  

Subtropical Mediterranean Hyperthermal Summer (CMZ2):  

Subtropical Monsoon Hyperthermal Summer (CWZ2):  

Subtropical Semiarid Hyperthermal Summer (CSZ2):  

Subtropical Desert Hyperthermal Summer (CDZ2):  

### Subtropical Scorching Hot Summer Climates (C-Z1):

Subtropical Humid Scorching Hot Summer (CHZ1):  

Subtropical Semihumid Scorching Hot Summer (CGZ1):  

Subtropical Monsoon Scorching Hot Summer (CWZ1):  

Subtropical Meiterranean Scorching Hot Summer (CMZ1):  

Subtropical Semiarid Scorching Hot Summer (CSZ1):   

Subtropical Desert Scorching Hot Summer (CDZ1):  

### Subtropical Very Hot Summer Climates (C-A2):

Subtropical Semihumid Very Hot Summer (CGA2):   

Subtropical Monsoon Very Hot Summer (CWA2):  

Subtropical Mediterranean Very Hot Summer (CMA2):   

Subtropical Semiarid Very Hot Summer (CSA2):  

Subtropical Arid Desert Very Hot Summer (CDA2):  

### Subtropical Hot Summer Climates (C-A1):  

Subtropical Humid Hot Summer (CHA1):  

Subtropical Semihumid Hot Summer (CGA1):   

Subtropical Meiterranean Hot Summer (CMA1):  

Subtropical Arid Desert Hot Summer (CDA1):  

### Subtropical Mild Summer Climates (C-B2):

Subtropical Humid Mild Summer (CHB2):  

Subtropical Semihumid Mild Summer (CGB2):  

Subtropical Mediterranean Mild Summer (CMB2):  

### Subtropical Cold Summer Climate (CB1):  
Ketchikan, AK (today)  
Stanley, Falkland Islands (UK) (today)  
Tórshavn, Faroe Islands (DK) (today)  
Stanley, Falkland Islands (UK) (2100)  
Tórshavn, Faroe Islands (DK) (2100)  
Reykjavík, Iceland  (2100)  
Ushuaia, Argentina (2100)

### Subtropical Very Cold Summer Climate (CC2):  
Adak, AK (today)  
Macquarie Island Research Station (today)  
Macquarie Island Research Station (2100)  
Bird Island Research Station (2100)

# Temperate Climates (D):

### Temperate Wasteland Climates (D-X1):

Temperate Semiarid Extreme Hyperthermal Summer (DSX1):  

Temperate Arid Desert Extreme Hyperthermal Summer (DDX1):  

### Temperate Hyperthermal Summer Climates (D-Z2):  

Temperate Humid Hyperthermal Summer (DHZ2):  

Temperate Semihumid Hyperthermal Summer (DGZ2):  

Temperate Monsoon Hyperthermal Summer (DWZ2):  

Temperate Mediterranean Hyperthermal Summer (DMZ2):  

Temperate Semiarid Hyperthermal Summer (DSZ2):  

Temperate Arid Desert Hyperthermal Summer (DDZ2):  

### Temperate Scorching Hot Summer Climates (D-Z1):

Temperate Humid Scorching Hot Summer (DHZ1):  

Temperate Semihumid Scorching Hot Summer (DGZ1):  

Temperate Monsoon Scorching Hot Summer (DWZ1):  

Temperate Mediterranean Scorching Hot Summer (DMZ1):  

Temperate Semiarid Scorching Hot Summer (DSZ1):  

Temperate Arid Desert Scorching Hot Summer (DDZ1):  

### Temperate Very Hot Summer Climates (D-A2):

Temperate Humid Very Hot Summer (DHA2):  

Temperate Semihumid Very Hot Summer (DGA2):  

Temperate Monsoon Very Hot Summer (DWA2):  

Temperate Mediterranean Very Hot Summer (DMA2):  

Temperate Semiarid Very Hot Summer (DSA2):  

### Temperate Hot Summer Climates (D-A1):

Temperate Humid Hot Summer (DHA1):  

Temperate Semihumid Hot Summer (DGA1):  

Temperate Mediterranean Hot Summer (DMA1):  

Temperate Monsoon Hot Summer (DWA1):  

### Temperate Mild Summer Climates (D-B2):

Temperate Mild Summer (DHB2):  

Temperate Monsoon Mild Summer (DWB2):  

### Temperate Cold Summer Climate (DB1):  
Thimphu, Bhutan (today)  
Reykjavík, Iceland (today)  
Kalifornsky, AK (today)  
Sitka, AK (today)  
Kenai, AK (today)  
Sterling, AK (today)  
Wainwright, AK (2100)

### Temperate Very Cold Summer Climate (DC2):  
Juneau, AK (today)  
Ushuaia, Argentina (today)  
Nuuk, Greenland (DK) (2100)  
Longyearbyen, Svalbard & Jan Mayen (NO) (2100)  

### Temperate Freezing Summer Climate (DC1):  
Bird Island Research Station (today)  
Primavera Research Station, Antarctica (2100)

### Temperate Frigid Summer Climate (DY):  
Primavera Research Station, Antarctica (today)

# Continental Climates (E):

### Continental Hyperthermal Summer Climates (E-Z2):

Continental Semiarid Hyperthermal Summer (ESZ2):  

### Continental Scorching Hot Summer Climates (E-Z1):

Continental Semihumid Scorching Hot Summer (EGZ1):  

Continental Semiarid Scorching Hot Summer (ESZ1):  

### Continental Very Hot Summer Climates (E-A2):

Continental Humid Very Hot Summer (EHA2):  

Continental Semihumid Very Hot Summer (EGA2):  

Continental Monsoon Very Hot Summer (EWA2):  

Continental Semiarid Very Hot Summer (ESA2):  

### Continental Hot Summer Climates (E-A1):

Continental Humid Hot Summer (EHA1):  

Continental Semihumid Hot Summer (EGA1):  

Continental Monsoon Hot Summer (EWA1):  

Continental Semiarid Hot Summer (ESA1):  

Continental Arid Desert Hot Summer (EDA1):  

### Continental Mild Summer Climates (E-B2):  

Continental Humid Mild Summer (EHB2):  

Continental Monsoon Mild Summer (EWB2):  

### Continental Cold Summer Climate (EB1):  
Meadow Lakes, AK (today)  
Bethel, AK (today)  
Iqaluit, NU (2100)  
Igloolik, NU (2100)  
Qikiqtarjuaq, NU (2100)  
Utqiagvik, AK (2100)

### Continental Very Cold Summer Climate (EC2):  
Nuuk, Greenland (DK) (today)  
Longyearbyen, Svalbard & Jan Mayen (NO) (today)  
Pangnirtung, NU (2100)

### Continental Freezing Summer Climate (EC1):  
Davis Research Station, Antarctica (today)  
Davis Research Station, Antarctica (2100)  
Casey Research Station, Antarctica (2100)

### Continental Frigid Summer Climate (EY):  
Casey Research Station, Antarctica (today)

# Subarctic Climates (F):

### Subarctic Very Hot Summer Climate (FA2):  
Yakutsk, Russia (2100)

### Subarctic Hot Summer Climate (FA1):  

### Subarctic Mild Summer Climate (FB2):  
Ulaanbaatar, Mongolia (today)  
Thompson, MB (today)  
Yellowknife, NT	(today)  
Hay River, NT	(today)  
Fort Smith, NT	(today)  
Behchoko, NT	(today)  
Fort Simpson, NT	(today)  
Fort Providence, NT	(today)  
Norman Wells, NT	(today)  
Fort Good Hope, NT	(today)  
Baker Lake, NU (2100)

### Subarctic Cold Summer Climate (FB1):  
Inuvik, NT (today)  
Arviat, NU (today)  
Cambridge Bay, NU (2100)

### Subarctic Very Cold Summer Climate (FC2):  
Tuktoyaktuk, NT (today)  
Iqaluit, NU (today)  
Pangnirtung, NU (today)     
Prudhoe Bay, AK (today)  
Tuktoyaktuk, NT (today)  
Eureka Research Station, NU (2100)  
Isachsen Research Station, NU (2100)

### Subarctic Freezing Summer Climate (FC1):  
Qikiqtarjuaq, NU (today)  
Wainwright, AK (today)  
Utqiagvik, AK (today)  
Pond Inlet, NU (today)  
Pond Inlet, NU (2100)  
McMurdo Research Station, Antarctica (2100)

### Subarctic Frigid Summer Climate (FY):  
McMurdo Research Station, Antarctica (today)

# Arctic Climates (G): 

### Arctic Mild Summer Climate (GB2):  
Yakutsk, Russia (today)

### Arctic Cold Summer Climate (GB1):  
Rankin Inlet, NU (today)  
Baker Lake, NU (today)  
Coral Harbour, NU (today)

### Arctic Very Cold Summer Climate (GC2):  
Cambridge Bay, NU (today)  
Igloolik, NU (today)  
Eureka Research Station, NU (today)

### Arctic Freezing Summer Climate (GC1):  
Isachsen Research Station, NU (today)

### Arctic Frigid Summer Climate (GY):  

# Superarctic Climates (Y):

### Superarctic Very Cold Summer Climate (YC2):  
Concordia Research Station, Antarctica (2100)

### Superarctic Freezing Summer Climate (YC1):  

### Superarctic Frigid Summer Climate (YY):  
Concordia Research Station, Antarctica (today)




