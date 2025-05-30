# DICKINSON CLIMATE CLASSIFICATION

# How to run the code

To run the code, open two Earth Engine Code Editor windows.

Paste the full code of the the most up to date versions, AllVersionsTogether.js and 2100AllVersionsTogether.js seperately in New Script boxes of each of the windows.

Click the "run" button.

This will generate a current climate map and a map of the climate as it is projected to be in the year 2100 given NASA's RCP8.5 "business as usual" global warming/climate change projections.

<img src="images/screenshot.png"/>

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

### Ultratropical Extreme Hyperthermal Summer climates (Z-X1):

Ultratropical Arid Desert Extreme Hyperthermal Summer (ZDX1):  
Niamey, Niger	Z (Ultratropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)
Khartoum, Sudan	Z (Ultratropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)

### Ultratropical Hyperthermal Summer climates (Z-Z2):

Ultratropical Semiarid Hyperthermal Summer (ZSZ2):  
Bangkok, Thailand	Z (Ultratropical), S (Semiarid), Z2 (Hyperthermal Summer)
Phnom Penh, Cambodia	Z (Ultratropical), S (Semiarid), Z2 (Hyperthermal Summer)
Juba, South Sudan	Z (Ultratropical), S (Semiarid), Z2 (Hyperthermal Summer)

Ultratropical Arid Desert Hyperthermal Summer (ZDZ2):  
Ouagadougou, Burkina Faso	Z (Ultratropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Bamako, Mali	Z (Ultratropical), D (Arid Desert), Z2 (Hyperthermal Summer)

### Ultratropical Scorching Hot Summer climates (Z-Z1):

Ultratropical Humid Scorching Hot Summer: (ZHZ1):  
Bandar Seri Begawan, Brunei	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Tarawa, Kiribati	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Majuro, Marshall Islands	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Yaren, Nauru	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Ngerulmud, Palau	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Funafuti, Tuvalu	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Hagåtña, Guam (US)	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)
Saipan, Northern Mariana Islands (US)	Z (Ultratropical), H (Humid), Z1 (Scorching Hot Summer)

Ultratropical Semihumid Scorching Hot Summer: (ZGZ1):  
Ho Chi Minh City, Vietnam	Z (Ultratropical), G (Semihumid), Z1 (Scorching Hot Summer)
Kuala Lumpur, Malaysia	Z (Ultratropical), G (Semihumid), Z1 (Scorching Hot Summer)
Georgetown, Guyana	Z (Ultratropical), G (Semihumid), Z1 (Scorching Hot Summer)
Singapore, Singapore	Z (Ultratropical), G (Semihumid), Z1 (Scorching Hot Summer)
Nukunonu, Tokelau (NZ)	Z (Ultratropical), G (Semihumid), Z1 (Scorching Hot Summer)

Ultratropical Monsoon Hyperthermal Summer (ZWZ1):  
Jakarta, Indonesia	Z (Ultratropical), W (Monsoon), Z1 (Scorching Hot Summer)

Ultratropical Semiarid Hyperthermal Summer (ZSZ1):  
Bissau, Guinea-Bissau	Z (Ultratropical), S (Semiarid), Z1 (Scorching Hot Summer)
Paramaribo, Suriname	Z (Ultratropical), S (Semiarid), Z1 (Scorching Hot Summer)

Ultratropical Arid Desert Hyperthermal Summer (ZDZ1):  
Mogadishu, Somalia	Z (Ultratropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Willemstad, Curaçao (NL)	Z (Ultratropical), D (Arid Desert), Z1 (Scorching Hot Summer)

# Supertropical Climates (A):

### Supertropical Extreme Hyperthermal Summer climates (A-X1):

Supertropical Arid Desert Extreme Hyperthermal Summer (ADX1):  
Manama, Bahrain	A (Supertropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)
Doha, Qatar	A (Supertropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)
Riyadh, Saudi Arabia	A (Supertropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)
Abu Dhabi, United Arab Emirates	A (Supertropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)

### Supertropical Hyperthermal Summer climates (A-Z2):

Supertropical Monsoon Hyperthermal Summer (AWZ2):  
Kolkata, India	A (Supertropical), W (Monsoon), Z2 (Hyperthermal Summer)
Hyderabad, India	A (Supertropical), W (Monsoon), Z2 (Hyperthermal Summer)
Naypyidaw, Myanmar	A (Supertropical), W (Monsoon), Z2 (Hyperthermal Summer)
Hanoi, Vietnam	A (Supertropical), W (Monsoon), Z2 (Hyperthermal Summer)

Supertropical Semiarid Hyperthermal Summer (ASZ2):  
Chennai, India	A (Supertropical), S (Semiarid), Z2 (Hyperthermal Summer)

Supertropical Arid Desert Hyperthermal Summer (ADZ2):  
Karachi, Pakistan	A (Supertropical), D (Arid Desert), Z2 (Hyperthermal Summer)
N'Djamena, Chad	A (Supertropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Djibouti, Djibouti	A (Supertropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Muscat, Oman	A (Supertropical), D (Arid Desert), Z2 (Hyperthermal Summer)

### Supertropical Scorching Hot Summer climates (A-Z1):

Supertropical Humid Scorching Hot Summer (AHZ1):  
Manila, Philippines	A (Supertropical), H (Humid), Z1 (Scorching Hot Summer)
Palikir, Federated States of Micronesia	A (Supertropical), H (Humid), Z1 (Scorching Hot Summer)
Monrovia, Liberia	A (Supertropical), H (Humid), Z1 (Scorching Hot Summer)
Sri Jayawardenepura Kotte, Sri Lanka	A (Supertropical), H (Humid), Z1 (Scorching Hot Summer)

Supertropical Semihumid Scorching Hot Summer (AGZ1):  
Ho Chi Minh City, Vietnam	(today)  
Phnom Penh, Cambodia	(today)  
Yaoundé, Cameroon	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Bangui, Central African Republic	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Kingston, Jamaica	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Malé, Maldives	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Panama City, Panama	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Port Moresby, Papua New Guinea	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Brades, Montserrat (UK)	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)

Supertropical Monsoon Scorching Hot Summer (AWZ1):  
Bamako, Mali	(today)  
Naypyidaw, Myanmar	(today)  
Abuja, Nigeria	(today)  
Mumbai, India	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Dhaka, Bangladesh	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Kinshasa, DR Congo	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Brasília, Brazil	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Brazzaville, Congo	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Conakry, Guinea	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Vientiane, Laos	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Lilongwe, Malawi	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Maputo, Mozambique	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Abuja, Nigeria	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Apia, Samoa	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Victoria, Seychelles	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Lusaka, Zambia	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Libreville, Gabon	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)

Supertropical Semiarid Scorching Hot Summer (ASZ1):  
Bangkok, Thailand	(today)  
Chennai, India	(today)  
Hyderabad, India	(today)  
Managua, Nicaragua	(today)  
Juba, South Sudan	(today)  
Bangalore, India	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Lagos, Nigeria	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Rio de Janeiro, Brazil	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Miami–Fort Lauderdale, FL	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
San Juan, PR	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
St. John's, Antigua and Barbuda	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Nassau, Bahamas	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Bridgetown, Barbados	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Belmopan, Belize	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Porto-Novo, Benin	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Yamoussoukro, Côte d'Ivoire	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Havana, Cuba	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Santo Domingo, Dominican Republic	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
San Salvador, El Salvador	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Accra, Ghana	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
St. George's, Grenada	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Port-au-Prince, Haiti	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Managua, Nicaragua	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Asunción, Paraguay	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Basseterre, Saint Kitts and Nevis	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Kingstown, Saint Vincent and the Grenadines	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Lomé, Togo	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Port of Spain, Trinidad and Tobago	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
The Valley, Anguilla (UK)	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Hamilton, Bermuda (UK)	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Road Town, British Virgin Islands (UK)	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Charlotte Amalie, U.S. Virgin Islands (US)	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
San Juan, Puerto Rico (US)	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Philipsburg, Sint Maarten (NL)	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)

Supertropical Arid Desert Scorching Hot Summer (ADZ1):  
Ouagadougou, Burkina Faso	(today)  
N'Djamena, Chad	(today)  
Djibouti, Djibouti	(today)  
Niamey, Niger	(today)  
Muscat, Oman	(today)  
Khartoum, Sudan	(today)  
Abu Dhabi, United Arab Emirates	(today)  
Luanda, Angola	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Gaborone, Botswana	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Praia, Cabo Verde	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Banjul, Gambia	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Nouakchott, Mauritania	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Castries, Saint Lucia	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Dakar, Senegal	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
George Town, Cayman Islands (UK)	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Oranjestad, Aruba (NL)	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)

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
Panama City, Panama	(today)  
Port Moresby, Papua New Guinea	(today)  
Basseterre, Saint Kitts and Nevis	(today)  
Apia, Samoa	(today)  
São Tomé, São Tomé and Príncipe	(today)  
Singapore, Singapore	(today)  
Honiara, Solomon Islands	(today)  
Sri Jayawardenepura Kotte, Sri Lanka	(today)  
Nukuʻalofa, Tonga	(today)  
Funafuti, Tuvalu	(today)  
Port Vila, Vanuatu	(today)  
Road Town, British Virgin Islands (UK)	(today)  
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
San José, Costa Rica	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Roseau, Dominica	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Malabo, Equatorial Guinea	A (Supertropical), H (Humid), A2 (Very Hot Summer)
São Tomé, São Tomé and Príncipe	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Freetown, Sierra Leone	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Honiara, Solomon Islands	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Port Vila, Vanuatu	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Pago Pago, American Samoa (US)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Mata-Utu, Wallis & Futuna (FR)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Alofi, Niue (NZ)	A (Supertropical), H (Humid), A2 (Very Hot Summer)

Supertropical Semihumid Very Hot Summer (AGA2):  
Bridgetown, Barbados	(today)  
Belmopan, Belize	(today)  
Yaoundé, Cameroon	(today)  
Bangui, Central African Republic	(today)  
Port-au-Prince, Haiti	(today)  
Malé, Maldives	(today)  
Yaren, Nauru	(today)  
Kingstown, Saint Vincent and the Grenadines	(today)  
Paramaribo, Suriname	(today)  
Port of Spain, Trinidad and Tobago	(today)  
The Valley, Anguilla (UK)	(today)  
Adamstown, Pitcairn Islands (UK)	(today)  
Philipsburg, Sint Maarten (NL)	(today)  
Moroni, Comoros	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Nukuʻalofa, Tonga	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Kampala, Uganda	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Nouméa, New Caledonia (FR)	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)

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
Victoria, Seychelles	(today)  
Freetown, Sierra Leone	(today)  
Dili, Timor-Leste	(today)  
Papeete, French Polynesia (FR)	(today)  
Libreville, Gabon	(today)  
São Paulo, Brazil	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Gitega, Burundi	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Suva, Fiji	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Antananarivo, Madagascar	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Port Louis, Mauritius	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Dili, Timor-Leste	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Papeete, French Polynesia (FR)	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)

Supertropical Semiarid Very Hot Summer (ASA2):  
Bangalore, India	(today)  
Lagos, Nigeria	(today)  
Honolulu, HI	(today)  
Nassau, Bahamas	(today)  
Porto-Novo, Benin	(today)  
Yamoussoukro, Côte d'Ivoire	(today)  
Havana, Cuba	(today)  
Santo Domingo, Dominican Republic	(today)  
Accra, Ghana	(today)  
St. George's, Grenada	(today)  
Tarawa, Kiribati	(today)  
Castries, Saint Lucia	(today)  
Lomé, Togo	(today)  
Oranjestad, Aruba (NL)	(today)  
Honolulu, HI	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Tegucigalpa, Honduras	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Nairobi, Kenya	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Kigali, Rwanda	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Caracas, Venezuela	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)

Supertropical Arid Desert Very Hot Summer (ADA2):  
Karachi, Pakistan	(today)  
Luanda, Angola	(today)  
Praia, Cabo Verde	(today)  
Nouakchott, Mauritania	(today)  
Dakar, Senegal	(today)  
Mogadishu, Somalia	(today)  
Dodoma, Tanzania	(today)  
George Town, Cayman Islands (UK)	(today)  
Cockburn Town, Turks & Caicos (UK)	(today)  
Willemstad, Curaçao (NL)	(today)  
Kralendijk, Bonaire (NL)	(today)  
The Bottom, Saba (NL)	(today)  
Oranjestad, Sint Eustatius (NL)	(today)  
Lima, Peru	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Asmara, Eritrea	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Dodoma, Tanzania	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Cockburn Town, Turks & Caicos (UK)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Kralendijk, Bonaire (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
The Bottom, Saba (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Oranjestad, Sint Eustatius (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)

### Supertropial Hot Summer climates (A-A1):  

Supertropical Humid Hot Summer (AHA1):  
Quito, Ecuador	A (Supertropical), H (Humid), A1 (Hot Summer)
Guatemala City, Guatemala	A (Supertropical), H (Humid), A1 (Hot Summer)  

Supertropical Semihumid Hot Summer (AGA1):  
Addis Ababa, Ethiopia	A (Supertropical), G (Semihumid), A1 (Hot Summer)

Supertropical Monsoon Hot Summer (AWA1):  
Brasília, Brazil	(today)  

Supertropical Semiarid Hot Summer (ASA1):  
Caracas, Venezuela	(today)  

# Tropical Climates (B):  

### Tropical Extreme Hyperthermal Summer climates (B-X1):

Tropical Arid Desert Extreme Hyperthermal Summer (BDX1):  
Baghdad, Iraq	B (Tropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)
Kuwait City, Kuwait	B (Tropical), D (Arid Desert), X1 (Extreme Hyperthermal Summer)

### Tropical Hyperthermal Summer climates (B-Z2):  

Tropical Semiarid Hyperthermal Summer (BSZ2):  
Dallas–Fort Worth–Arlington, TX	B (Tropical), S (Semiarid), Z2 (Hyperthermal Summer)
Islamabad, Pakistan	B (Tropical), S (Semiarid), Z2 (Hyperthermal Summer)

Tropical Arid Desert Hyperthermal Summer (BDZ2):  
Phoenix–Mesa–Scottsdale, AZ	(today)  
Baghdad, Iraq	(today)  
Kuwait City, Kuwait	(today)  
Riyadh, Saudi Arabia	(today)  
Delhi, India	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Cairo, Egypt	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Lahore, Pakistan	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Phoenix–Mesa–Scottsdale, AZ	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Las Vegas–Henderson–Paradise, NV	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)

### Tropical Scorching Hot Summer climates (B-Z1): 

Tropical Humid Scorching Hot Summer (BHZ1):  
Taipei, Taiwan	B (Tropical), H (Humid), Z1 (Scorching Hot Summer)

Tropical Semihumid Scorching Hot Summer (BGZ1):  
Atlanta, GA	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Jacksonville, FL	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
New Orleans, LA	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Montgomery, AL	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Little Rock, AR	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Tallahassee, FL	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Baton Rouge, LA	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Jackson, MS	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)
Columbia, SC	B (Tropical), G (Semihumid), Z1 (Scorching Hot Summer)

Tropical Monsoon Scorching Hot Summer (BWZ1):  
Delhi, India	(today)  
Kolkata, India	(today)  
Guangzhou–Foshan, China	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)
Shenzhen, China	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)
Chengdu, China	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)
Chongqing, China	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)
Dongguan, China	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)

Tropical Mediterranean Scorching Hot Summer (BMZ1):  
Rome, Italy	B (Tropical), M (Mediterranean), Z1 (Scorching Hot Summer)
Monaco, Monaco	B (Tropical), M (Mediterranean), Z1 (Scorching Hot Summer)
Vatican City, Vatican City	B (Tropical), M (Mediterranean), Z1 (Scorching Hot Summer)

Tropical Semiarid Scorching Hot Summer (BSZ1):  
Houston, TX	B (Tropical), S (Semiarid), Z1 (Scorching Hot Summer)
Tampa–St. Petersburg, FL	B (Tropical), S (Semiarid), Z1 (Scorching Hot Summer)
Orlando, FL	B (Tropical), S (Semiarid), Z1 (Scorching Hot Summer)
Austin, TX	B (Tropical), S (Semiarid), Z1 (Scorching Hot Summer)

Tropical Desert Scorching Hot Summer (BDZ1):  
Lahore, Pakistan	(today)  
Manama, Bahrain	(today)  
Nicosia, Cyprus	(today)  
Doha, Qatar	(today)  
San Antonio, TX	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Sacramento, CA	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Algiers, Algeria	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Nicosia, Cyprus	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Athens, Greece	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Jerusalem, Israel	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Amman, Jordan	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Beirut, Lebanon	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Tripoli, Libya	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Valletta, Malta	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Windhoek, Namibia	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Tunis, Tunisia	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Melilla, Melilla (ES)	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)

### Tropical Very Hot Summer Climates (B-A2):

Tropical Humid Very Hot Summer (BHA2):  
Taipei, Taiwan	(today)  
Nouméa, New Caledonia (FR)	(today)  

Tropical Semihumid Very Hot Summer (BGA2):  
Miami–Fort Lauderdale, FL	(today)  
Tampa–St. Petersburg, FL	(today)  
Orlando, FL	(today)  
Jacksonville, FL	(today)  
New Orleans, LA	(today)  
Tallahassee, FL	(today)  
Baton Rouge, LA	(today)  
Hamilton, Bermuda (UK)	(today)  
Buenos Aires, Argentina	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Montevideo, Uruguay	B (Tropical), G (Semihumid), A2 (Very Hot Summer)

Tropical Monsoon Very Hot Summer (BWA2):  
Guangzhou–Foshan, China	(today)  
Dhaka, Bangladesh	(today)  
Shenzhen, China	(today)  
Rio de Janeiro, Brazil	(today)  
Dongguan, China	(today)  
Maputo, Mozambique	(today)  
Asunción, Paraguay	(today)  
Hanoi, Vietnam	(today)  
Johannesburg–Pretoria, South Africa	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Mbabane, Eswatini	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Maseru, Lesotho	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Kathmandu, Nepal	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Harare, Zimbabwe	B (Tropical), W (Monsoon), A2 (Very Hot Summer)

Tropical Mediterranean Very Hot Summer (BMA2):  
Algiers, Algeria	(today)  
Beirut, Lebanon	(today)  
Tunis, Tunisia	(today)  
Seattle–Tacoma, WA	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)
San Jose, CA	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)
Olympia, WA	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)
Lisbon, Portugal	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)
Ponta Delgada, Azores (PT)	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)

Tropical Semiarid Very Hot Summer (BSA2):  
Houston, TX	(today)  
San Antonio, TX	(today)  
Austin, TX	(today)  
Canberra, Australia	B (Tropical), S (Semiarid), A2 (Very Hot Summer)

Tropical Arid Desert Very Hot Summer (BDA2):  
<img src="images/pyramids.jpg"/>  

Cairo, Egypt	(today)  
Gaborone, Botswana	(today)  
Jerusalem, Israel	(today)  
Amman, Jordan	(today)  
Tripoli, Libya	(today)  
Valletta, Malta	(today)  
Melilla, Melilla (ES)	(today)  
Los Angeles, United States	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
San Diego, CA	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Riverside–San Bernardino, CA	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Santiago, Chile	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Rabat, Morocco	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Bloemfontein, South Africa	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Sana'a, Yemen	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Gibraltar, Gibraltar (UK)	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Ceuta, Ceuta (ES)	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)

### Tropical Hot Summer Climates (B-A1):

Tropical Humid Hot Summer (BHA1):  
San José, Costa Rica	(today)  
Kingston, Norfolk Island (AU)	(today)  
Wellington, New Zealand	B (Tropical), H (Humid), A1 (Hot Summer)
Avarua, Cook Islands (NZ)	B (Tropical), H (Humid), A1 (Hot Summer)

Tropical Semihumid Hot Summer (BGA1):  
Buenos Aires, Argentina	(today)  
Tegucigalpa, Honduras	(today)  
Kampala, Uganda	(today)  
Montevideo, Uruguay	(today)  
Kingston, Norfolk Island (AU)	B (Tropical), G (Semihumid), A1 (Hot Summer)

Tropical Monsoon Hot Summer (BWA1):  
São Paulo, Brazil	(today)  
Gitega, Burundi	(today)  
Antananarivo, Madagascar	(today)  
Lilongwe, Malawi	(today)  
Sana'a, Yemen	(today)  
Lusaka, Zambia	(today)  
Harare, Zimbabwe	(today)  
Mexico City, Mexico	B (Tropical), W (Monsoon), A1 (Hot Summer)
Sucre, Bolivia	B (Tropical), W (Monsoon), A1 (Hot Summer)

Tropical Mediterranean Hot Summer (BMA1):  
Los Angeles, United States	(today)  
Riverside–San Bernardino, CA	(today)  )
Lisbon, Portugal	(today)  
Gibraltar, Gibraltar (UK)	(today)  
Ceuta, Ceuta (ES)	(today)  
Ponta Delgada, Azores (PT)	(today)  
Funchal, Madeira (PT)	(today)  
San Francisco–Oakland, CA	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Funchal, Madeira (PT)	B (Tropical), M (Mediterranean), A1 (Hot Summer)

Tropical Semiarid Hot Summer (BSA1):  
Nairobi, Kenya	(today)  
Jamestown, St Helena (UK)	(today)  
Hanga Roa, Easter Island (CL)	(today)  
Cape Town, South Africa	B (Tropical), S (Semiarid), A1 (Hot Summer)
Adamstown, Pitcairn Islands (UK)	B (Tropical), S (Semiarid), A1 (Hot Summer)
Hanga Roa, Easter Island (CL)	B (Tropical), S (Semiarid), A1 (Hot Summer)

Tropical Arid Desert Hot Summer (BDA1):  
Lima, Peru	(today)  
San Diego, CA	(today)  
Asmara, Eritrea	(today)  
Rabat, Morocco	(today)  
Windhoek, Namibia	(today)  
Jamestown, St Helena (UK)	B (Tropical), D (Arid Desert), A1 (Hot Summer)

### Tropical Mild Summer Climates (B-B2):

Tropical Humid Mild Summer (BHB2):  
Guatemala City, Guatemala	(today)  
Wellington, New Zealand	(today)  
Bogotá, Colombia (today)  
Edinburgh of the Seven Seas	(today)  
Bogotá, Colombia	B (Tropical), H (Humid), B2 (Mild Summer)

Tropical Semihumid Mild Summer (BGB2):  
Kigali, Rwanda	(today)  
<img src="images/Ruwenpflanzen.jpg"/>

Tropical Monsoon Mild Summer (BWB2):  
Mexico City, Mexico	(today)  
Mbabane, Eswatini	(today)  
Addis Ababa, Ethiopia	(today)  

Tropical Semiarid Mild Summer (BSB2):  
Cape Town, South Africa	(today)  

### Tropical Cold Summer Climate (BB1):  
Quito, Ecuador (today)  
Sucre, Bolivia (today)

# Subtropical Climates (C):  

### Subtropical Hyperthermal Summer Climates (C-Z2):  

Subtropical Semihumid Hyperthermal Summer (CGZ2):  
Wuhan, China	C (Subtropical), G (Semihumid), Z2 (Hyperthermal Summer)

Subtropical Arid Desert Hyperthermal Summer (CDZ2):  
Tehran, Iran	C (Subtropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Ashgabat, Turkmenistan	C (Subtropical), D (Arid Desert), Z2 (Hyperthermal Summer)

### Subtropical Scorching Hot Summer Climates (C-Z1):  

Subtropical Humid Scorching Hot Summer (CHZ1):  
Tokyo–Yokohama, Japan	C (Subtropical), H (Humid), Z1 (Scorching Hot Summer)
Osaka–Kobe–Kyoto, Japan	C (Subtropical), H (Humid), Z1 (Scorching Hot Summer)
Nagoya, Japan	C (Subtropical), H (Humid), Z1 (Scorching Hot Summer)

Subtropical Semihumid Scorching Hot Summer (CGZ1):  
Shanghai, China	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
New York, United States	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Hangzhou, China	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Philadelphia, PA–NJ–DE–MD	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Washington–Arlington, DC–VA–MD	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Baltimore, MD	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Indianapolis, IN	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Cincinnati, OH–KY	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Kansas City, MO–KS	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Virginia Beach–Norfolk, VA	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Charlotte, NC–SC	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Nashville–Davidson, TN	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Raleigh, NC	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Richmond, VA	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Memphis, TN–MS–AR	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Louisville/Jefferson County, KY–IN	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Dover, DE	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Springfield, IL	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Frankfort, KY	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Annapolis, MD	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Trenton, NJ	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Harrisburg, PA	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Charleston, WV	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Carbondale, IL	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)
Champaign, IL	C (Subtropical), G (Semihumid), Z1 (Scorching Hot Summer)

Subtropical Monsoon Scorching Hot Summer (CWZ1):  
Seoul–Incheon, South Korea	C (Subtropical), W (Monsoon), Z1 (Scorching Hot Summer)
Zhengzhou, China	C (Subtropical), W (Monsoon), Z1 (Scorching Hot Summer)

Subtropical Mediterranean Scorching Hot Summer (CMZ1):  
Istanbul, Turkey	C (Subtropical), M (Mediterranean), Z1 (Scorching Hot Summer)
Tirana, Albania	C (Subtropical), M (Mediterranean), Z1 (Scorching Hot Summer)
Podgorica, Montenegro	C (Subtropical), M (Mediterranean), Z1 (Scorching Hot Summer)
Dushanbe, Tajikistan	C (Subtropical), M (Mediterranean), Z1 (Scorching Hot Summer)

Subtropical Semiarid Scorching Hot Summer (CSZ1):   
Islamabad, Pakistan	(today)  
Xi’an, China	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
St. Louis, MO–IL	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Salt Lake City, UT	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Oklahoma City, OK	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Des Moines, IA	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Topeka, KS	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Jefferson City, MO	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Lincoln, NE	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Tbilisi, Georgia	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Pristina, Kosovo	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Bucharest, Romania	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)
Belgrade, Serbia	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)

Subtropical Desert Scorching Hot Summer (CDZ1):  
Las Vegas–Henderson–Paradise, NV	(today)  
Beijing, China	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Tianjin, China	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Yerevan, Armenia	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Baku, Azerbaijan	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Madrid, Spain	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Tashkent, Uzbekistan	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)

### Subtropical Very Hot Summer Climates (C-A2):

Subtropical Humid Very Hot Summer (CHA2):  
Tokyo–Yokohama, Japan	(today)  
Osaka–Kobe–Kyoto, Japan	(today)  
Nagoya, Japan	(today)  
Atlanta, GA	(today)  
Virginia Beach–Norfolk, VA	(today)  
Nashville–Davidson, TN	(today)  
Memphis, TN–MS–AR	(today)  
Louisville/Jefferson County, KY–IN	(today)  
Little Rock, AR	(today)  
Annapolis, MD	(today)  
Carbondale, IL	(today)  
Boston, MA–NH	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Providence, RI–MA	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Hartford, CT	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Concord, NH	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Ljubljana, Slovenia	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Dieppe, NB	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Charlottetown, PE	C (Subtropical), H (Humid), A2 (Very Hot Summer)

Subtropical Semihumid Very Hot Summer (CGA2):   
Shanghai, China	(today)  
Wuhan, China	(today)  
Hangzhou, China	(today)  
Charlotte, NC–SC	(today)  
Raleigh, NC	(today)  
Richmond, VA	(today)  
Montgomery, AL	(today)  
Jackson, MS	(today)  
Columbia, SC	(today)  
Chicago, United States	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Detroit, MI	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Pittsburgh, PA	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Cleveland, OH	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Columbus, OH	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Milwaukee, WI	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Buffalo, NY	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Lansing, MI	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Albany, NY	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Sarajevo, Bosnia and Herzegovina	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Zagreb, Croatia	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Toronto, ON	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Mississauga, ON	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Brampton, ON	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Hamilton, ON	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)

Subtropical Monsoon Very Hot Summer (CWA2):  
Chengdu, China	(today)  
Chongqing, China	(today)  
Xi’an, China	(today)  
Zhengzhou, China	(today)  

Subtropical Mediterranean Very Hot Summer (CMA2):   
Istanbul, Turkey	(today)  
Sacramento, CA	(today)  
Athens, Greece	(today)  
Tashkent, Uzbekistan	(today)  
Portland, OR–WA	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Boise, ID	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Salem, OR	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Surrey, BC	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Richmond, BC	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Abbotsford, BC	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)

Subtropical Semiarid Very Hot Summer (CSA2):  
Dallas–Fort Worth–Arlington, TX	(today)  
Oklahoma City, OK	(today)  
Madrid, Spain	(today)  
Paris, France	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Denver–Aurora, CO	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Helena, MT	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Santa Fe, NM	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Cheyenne, WY	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Vienna, Austria	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Sofia, Bulgaria	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Prague, Czech Republic	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Budapest, Hungary	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Chișinău, Moldova	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Skopje, North Macedonia	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
San Marino, San Marino	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Bratislava, Slovakia	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Kyiv, Ukraine	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Rexburg, ID	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)

Subtropical Arid Desert Very Hot Summer (CDA2):  
Baku, Azerbaijan	(today)  
Ashgabat, Turkmenistan	(today)  
Kabul, Afghanistan	C (Subtropical), D (Arid Desert), A2 (Very Hot Summer)
Damascus, Syria	C (Subtropical), D (Arid Desert), A2 (Very Hot Summer)
Ankara, Turkey	C (Subtropical), D (Arid Desert), A2 (Very Hot Summer)

### Subtropical Hot Summer Climates (C-A1):  

Subtropical Humid Hot Summer (CHA1):  
Dover, DE	(today)  
Frankfort, KY	(today)  
Charleston, WV	(today)  
Tirana, Albania	(today)  
Podgorica, Montenegro	(today)  
Vaduz, Liechtenstein	C (Subtropical), H (Humid), A1 (Hot Summer)
Oslo, Norway	C (Subtropical), H (Humid), A1 (Hot Summer)
Bern, Switzerland	C (Subtropical), H (Humid), A1 (Hot Summer)
Saint-Pierre, Saint-Pierre & Miquelon (FR)	C (Subtropical), H (Humid), A1 (Hot Summer)
Halifax, NS	C (Subtropical), H (Humid), A1 (Hot Summer)
Cape Breton Regional Municipality, NS	C (Subtropical), H (Humid), A1 (Hot Summer)
Truro, NS	C (Subtropical), H (Humid), A1 (Hot Summer)
New Glasgow, NS	C (Subtropical), H (Humid), A1 (Hot Summer)
Amherst, NS	C (Subtropical), H (Humid), A1 (Hot Summer)
Saint John, NB	C (Subtropical), H (Humid), A1 (Hot Summer)
St. John's, NL	C (Subtropical), H (Humid), A1 (Hot Summer)
Conception Bay South, NL	C (Subtropical), H (Humid), A1 (Hot Summer)
Mount Pearl, NL	C (Subtropical), H (Humid), A1 (Hot Summer)
Paradise, NL	C (Subtropical), H (Humid), A1 (Hot Summer)
Kalifornsky, AK	C (Subtropical), H (Humid), A1 (Hot Summer)
Kenai, AK	C (Subtropical), H (Humid), A1 (Hot Summer)

Subtropical Semihumid Hot Summer (CGA1):   
Washington–Arlington, DC–VA–MD	(today)  
Rome, Italy	(today)  
Monaco, Monaco	(today)  
San Marino, San Marino	(today)  
Belgrade, Serbia	(today)  
London, United Kingdom	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Andorra la Vella, Andorra	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Minsk, Belarus	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Brussels, Belgium	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Copenhagen, Denmark	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Tallinn, Estonia	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Helsinki, Finland	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Riga, Latvia	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Vilnius, Lithuania	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Luxembourg, Luxembourg	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Amsterdam, Netherlands	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Stockholm, Sweden	C (Subtropical), G (Semihumid), A1 (Hot Summer)

Subtropical Monsoon Hot Summer (CWA1):  
Johannesburg–Pretoria, South Africa	(today)  
Maseru, Lesotho	(today)  
Kathmandu, Nepal	(today)  
Bloemfontein, South Africa	(today)  

Subtropical Meiterranean Hot Summer (CMA1):  
Damascus, Syria	(today)  
Carson City, NV	C (Subtropical), M (Mediterranean), A1 (Hot Summer)
Vancouver, BC	C (Subtropical), M (Mediterranean), A1 (Hot Summer)
Burnaby, BC	C (Subtropical), M (Mediterranean), A1 (Hot Summer)

Subtropical Semiarid Hot Summer (CSA1):  
Vatican City, Vatican City	(today)  
Berlin, Germany	C (Subtropical), S (Semiarid), A1 (Hot Summer)
Warsaw, Poland	C (Subtropical), S (Semiarid), A1 (Hot Summer)

Subtropical Arid Desert Hot Summer (CDA1):  
Santiago, Chile	(today)  

### Subtropical Mild Summer Climates (C-B2):

Subtropical Humid Mild Summer (CHB2):  
Dublin, Ireland	(today)  
Luxembourg, Luxembourg	(today)  
Bern, Switzerland	(today)  
Dublin, Ireland	C (Subtropical), H (Humid), B2 (Mild Summer)
Sitka, AK	C (Subtropical), H (Humid), B2 (Mild Summer)
Sterling, AK	C (Subtropical), H (Humid), B2 (Mild Summer)
Edinburgh of the Seven Seas	C (Subtropical), H (Humid), B2 (Mild Summer)
Adak, AK	C (Subtropical), H (Humid), B2 (Mild Summer)

Subtropical Semihumid Mild Summer (CGB2):  
Paris, France	(today)  
London, United Kingdom	(today)  
Canberra, Australia	(today)  
Brussels, Belgium	(today)  
Copenhagen, Denmark	(today)  
Berlin, Germany	(today)  
Amsterdam, Netherlands	(today)  

Subtropical Monsoon Mild Summer (CWB2):  
Thimphu, Bhutan	C (Subtropical), W (Monsoon), B2 (Mild Summer)

Subtropical Mediterranean Mild Summer (CMB2):  
Seattle–Tacoma, WA	(today)  
San Francisco–Oakland, CA	(today)  
Portland, OR–WA	(today)  
San Jose, CA	(today)  
Salem, OR	(today)  
Olympia, WA	(today)  
Vancouver, BC	(today)  
Surrey, BC	(today)  
Burnaby, BC	(today)  
Richmond, BC	(today)  
Abbotsford, BC	(today)  
Ketchikan, AK	C (Subtropical), M (Mediterranean), B2 (Mild Summer)

### Subtropical Cold Summer Climate (CB1):  
Ketchikan, AK (today)  
Stanley, Falkland Islands (UK) (today)  
Tórshavn, Faroe Islands (DK) (today)  
Stanley, Falkland Islands (UK) (2100)  
Tórshavn, Faroe Islands (DK) (2100)  
Reykjavík, Iceland  (2100)  
Ushuaia, Argentina (2100)

### Subtropical Very Cold Summer Climate (CC2):  
<img src="images/MacquarieIsland.jpg"/>

Adak, AK (today)  
Macquarie Island Research Station (today)  
Macquarie Island Research Station (2100)  
Bird Island Research Station (2100)

# Temperate Climates (D):

### Temperate Scorching Hot Summer Climates (D-Z1):

Temperate Monsson Scorching Hot Summer (DWZ1):  
Pyongyang, North Korea	D (Temperate), W (Monsoon), Z1 (Scorching Hot Summer)

Temperate Semiarid Scorching Hot Summer (DSZ1):  
Pierre, SD	D (Temperate), S (Semiarid), Z1 (Scorching Hot Summer)

### Temperate Very Hot Summer Climates (D-A2):

Temperate Humid Very Hot Summer (DHA2):  
Kansas City, MO–KS	(today)  
Augusta, ME	D (Temperate), H (Humid), A2 (Very Hot Summer)
Montpelier, VT	D (Temperate), H (Humid), A2 (Very Hot Summer)
Montreal, QC	D (Temperate), H (Humid), A2 (Very Hot Summer)
Quebec City, QC	D (Temperate), H (Humid), A2 (Very Hot Summer)
Laval, QC	D (Temperate), H (Humid), A2 (Very Hot Summer)
Longueuil, QC	D (Temperate), H (Humid), A2 (Very Hot Summer)
Moncton, NB	D (Temperate), H (Humid), A2 (Very Hot Summer)
Fredericton, NB	D (Temperate), H (Humid), A2 (Very Hot Summer)
Miramichi, NB	D (Temperate), H (Humid), A2 (Very Hot Summer)

Temperate Semihumid Very Hot Summer (DGA2):  
St. Louis, MO–IL	(today)  
Topeka, KS	(today)  
Jefferson City, MO	(today)  
Lincoln, NE	(today)  
Minneapolis–St. Paul, MN	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Madison, WI	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Ottawa, Canada	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Ottawa, ON	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Gatineau, QC	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Duluth, MN	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Lutsen, MN	D (Temperate), G (Semihumid), A2 (Very Hot Summer)

Temperate Monsoon Very Hot Summer (DWA2):  
Seoul–Incheon, South Korea	(today)  
Beijing, China	(today)  
Tianjin, China	(today)  

Temperate Semiarid Very Hot Summer (DSA2):  
Salt Lake City, UT	(today)  
Pierre, SD	(today)  
Bismarck, ND	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Bishkek, Kyrgyzstan	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Lethbridge, AB	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Winnipeg, MB	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Brandon, MB	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Steinbach, MB	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Portage la Prairie, MB	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Saskatoon, SK	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Regina, SK	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Moose Jaw, SK	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Swift Current, SK	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Novosibirsk, Russia	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Omsk, Russia	D (Temperate), S (Semiarid), A2 (Very Hot Summer)

Temperate Arid Desert Very Hot Summer (DDA2):  
Tehran, Iran	(today)  
Astana, Kazakhstan	D (Temperate), D (Arid Desert), A2 (Very Hot Summer)

### Temperate Hot Summer Climates (D-A1):

Temperate Humid Hot Summer (DHA1):  
New York, United States	(today)  
Chicago, United States	(today)  
Philadelphia, PA–NJ–DE–MD	(today)  
Boston, MA–NH	(today)  
Baltimore, MD	(today)  
Pittsburgh, PA	(today)  
Cleveland, OH	(today)  
Indianapolis, IN	(today)  
Cincinnati, OH–KY	(today)  
Columbus, OH	(today)  
Milwaukee, WI	(today)  
Providence, RI–MA	(today)  
Hartford, CT	(today)  
Buffalo, NY	(today)  
Augusta, ME	(today)  
Concord, NH	(today)  
Trenton, NJ	(today)  
Albany, NY	(today)  
Harrisburg, PA	(today)  
Madison, WI	(today)  
Zagreb, Croatia	(today)  
Hamilton, ON	(today)  
Champaign, IL	(today)  
Corner Brook, NL	D (Temperate), H (Humid), A1 (Hot Summer)

Temperate Semihumid Hot Summer (DGA1):  
Moscow, Russia	(today)  
Detroit, MI	(today)  
Minneapolis–St. Paul, MN	(today)  
Springfield, IL	(today)  
Des Moines, IA	(today)  
Lansing, MI	(today)  
Vienna, Austria	(today)  
Budapest, Hungary	(today)  
Pristina, Kosovo	(today)  
Skopje, North Macedonia	(today)  
Bratislava, Slovakia	(today)  
Kyiv, Ukraine	(today)  
Toronto, ON	(today)  
Mississauga, ON	(today)  
Brampton, ON	(today)  
Moscow, Russia	D (Temperate), G (Semihumid), A1 (Hot Summer)
Anchorage, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Knik-Fairview, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
North Lakes, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Meadow Lakes, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Wasilla, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Tanaina, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Palmer, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Gateway, AK	D (Temperate), G (Semihumid), A1 (Hot Summer)
Krasnoyarsk, Russia	D (Temperate), G (Semihumid), A1 (Hot Summer)
Thunder Bay, ON	D (Temperate), G (Semihumid), A1 (Hot Summer)

Temperate Monsoon Hot Summer (DWA1):  
Pyongyang, North Korea	(today)  

Temperate Mediterranean Hot Summer (DMA1):  
Boise, ID	(today)  
Carson City, NV	(today)  

Temperate Semiarid Hot Summer (DSA1): 
Denver–Aurora, CO	(today)  
Santa Fe, NM	(today)  
Cheyenne, WY	(today)  
Kabul, Afghanistan	(today)  
Yerevan, Armenia	(today)  
Tbilisi, Georgia	(today)  
Bishkek, Kyrgyzstan	(today)  
Chișinău, Moldova	(today)  
Bucharest, Romania	(today)  
Ankara, Turkey	(today)  
Rexburg, ID	(today)  
Calgary, AB	D (Temperate), S (Semiarid), A1 (Hot Summer)
Edmonton, AB	D (Temperate), S (Semiarid), A1 (Hot Summer)
Red Deer, AB	D (Temperate), S (Semiarid), A1 (Hot Summer)
St. Albert, AB	D (Temperate), S (Semiarid), A1 (Hot Summer)

### Temperate Mild Summer Climates (D-B2):

Temperate Humid Mild Summer (DHB2):  
Sarajevo, Bosnia and Herzegovina	(today)  
Vaduz, Liechtenstein	(today)  
Oslo, Norway (today)  
Ljubljana, Slovenia	(today)  
Saint-Pierre, Saint-Pierre & Miquelon (FR) (today)  
Halifax, NS	(today)  
Cape Breton Regional Municipality, NS	(today)  
Truro, NS	(today)  
New Glasgow, NS	(today)  
Amherst, NS	(today)  
Moncton, NB	(today)  
Saint John, NB	(today)  
Dieppe, NB	(today)  
St. John's, NL	(today)  
Conception Bay South, NL	(today)  
Mount Pearl, NL	(today)  
Paradise, NL	(today)  
Corner Brook, NL	(today)  
Charlottetown, PE	(today)  
Andorra la Vella, Andorra (today)  
Juneau, AK	D (Temperate), H (Humid), B2 (Mild Summer)

Temperate Semihumid Mild Summer (DGB2):  
Minsk, Belarus	(today)  
Sofia, Bulgaria	(today)  
Prague, Czech Republic	(today)  
Tallinn, Estonia	(today)  
Helsinki, Finland	(today)  
Riga, Latvia	(today)  
Vilnius, Lithuania	(today)  
Stockholm, Sweden	(today)  
Calgary, AB	(today)  
Bethel, AK	D (Temperate), G (Semihumid), B2 (Mild Summer)

Temperate Mediterranean Mild Summer (DMB2):  
Dushanbe, Tajikistan	(today)  

Temperate Semiarid Mild Summer (DSB2):  
Helena, MT	(today)  
Warsaw, Poland	(today)  
Lethbridge, AB	(today)  

### Temperate Cold Summer Climate (DB1):  
Anchorage, AK (today)  
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

### Continental Hot Summer Climates (E-A1):

Continental Humid Hot Summer (EHA1):  
Ottawa, Canada	(today)  
Ottawa, ON	(today)  
Montreal, QC	(today)  
Laval, QC	(today)  
Gatineau, QC	(today)  
Longueuil, QC	(today)  

Continental Semihumid Hot Summer (EGA1):  
Thompson, MB	E (Continental), G (Semihumid), A1 (Hot Summer)
Fort Simpson, NT	E (Continental), G (Semihumid), A1 (Hot Summer)
Norman Wells, NT	E (Continental), G (Semihumid), A1 (Hot Summer)

Continental Monsoon Hot Summer (EWA1):  
Bismarck, ND	(today)  
Fairbanks, AK	E (Continental), W (Monsoon), A1 (Hot Summer)
Badger, AK	E (Continental), W (Monsoon), A1 (Hot Summer)
College, AK	E (Continental), W (Monsoon), A1 (Hot Summer)
Steele Creek, AK	E (Continental), W (Monsoon), A1 (Hot Summer)
Chena Ridge, AK	E (Continental), W (Monsoon), A1 (Hot Summer)
Ulaanbaatar, Mongolia	E (Continental), W (Monsoon), A1 (Hot Summer)

Continental Semiarid Hot Summer (ESA1):  
Prince Albert, SK	E (Continental), S (Semiarid), A1 (Hot Summer)
Yellowknife, NT	E (Continental), S (Semiarid), A1 (Hot Summer)
Hay River, NT	E (Continental), S (Semiarid), A1 (Hot Summer)
Fort Smith, NT	E (Continental), S (Semiarid), A1 (Hot Summer)
Behchoko, NT	E (Continental), S (Semiarid), A1 (Hot Summer)
Fort Providence, NT	E (Continental), S (Semiarid), A1 (Hot Summer)
Fort Good Hope, NT	E (Continental), S (Semiarid), A1 (Hot Summer)

### Continental Mild Summer Climates (E-B2):  

Continental Humid Mild Summer (EHB2):  
Montpelier, VT	(today)  
Quebec City, QC	(today)  
Fredericton, NB	(today)  
Miramichi, NB	(today)  
Duluth, MN	(today)  
Lutsen, MN	(today)  
Thunder Bay, ON	(today)  

Continental Semihumid Mild Summer (EGB2):  
Edmonton, AB	(today)  
Red Deer, AB	(today)  
St. Albert, AB	(today)  
Winnipeg, MB	(today)  
Brandon, MB	(today)  
Steinbach, MB	(today)  
Portage la Prairie, MB	(today)  
Prince Albert, SK	(today)  
Knik-Fairview, AK	(today)  
Novosibirsk, Russia	(today)  
Krasnoyarsk, Russia	(today)  
Omsk, Russia	(today)  
Rankin Inlet, NU	E (Continental), G (Semihumid), B2 (Mild Summer)
Arviat, NU	E (Continental), G (Semihumid), B2 (Mild Summer)
Coral Harbour, NU	E (Continental), G (Semihumid), B2 (Mild Summer)

Continental Monsoon Mild Summer (EWB2):  
Fairbanks, AK	(today)  
Badger, AK	(today)  
Steele Creek, AK	(today)  
Continental Semiarid Mild Summer (ESB2):   
Astana, Kazakhstan	(today)  
Saskatoon, SK	(today)  
Regina, SK	(today)  
Moose Jaw, SK	(today)  
Swift Current, SK	(today)  
College, AK	(today)  
Chena Ridge, AK	(today)  


Continental Semiarid Mild Summer (ESB2):  
Inuvik, NT	E (Continental), S (Semiarid), B2 (Mild Summer)
Tuktoyaktuk, NT	E (Continental), S (Semiarid), B2 (Mild Summer)
Tuktoyaktuk, NT	E (Continental), S (Semiarid), B2 (Mild Summer)

Continental Arid Desert Mild Summer (EDB2):  
Prudhoe Bay, AK	E (Continental), D (Arid Desert), B2 (Mild Summer)

### Continental Cold Summer Climate (EB1):  
BETHEL IN SUMMER
<img src="images/BethelAlaska.jpg"/>

BETHEL IN WINTER
<img src="images/BethelWinter.jpg"/>

Meadow Lakes, AK (today)  
Bethel, AK (today)  
North Lakes, AK	(today)  
Wasilla, AK	(today)  
Tanaina, AK	(today)  
Palmer, AK	(today)  
Gateway, AK	(today)  
Iqaluit, NU (2100)  
Igloolik, NU (2100)  
Qikiqtarjuaq, NU (2100)  
Utqiagvik, AK (2100)

### Continental Very Cold Summer Climate (EC2):  
NUUK IN JUNE
<img src="images/NuukJune.jpg"/>

Nuuk, Greenland (DK) (today)  
Longyearbyen, Svalbard & Jan Mayen (NO) (today)  
Pangnirtung, NU (2100)

### Continental Freezing Summer Climate (EC1):  
<img src="images/DavisStation.jpg"/>

Davis Research Station, Antarctica (today)  
Davis Research Station, Antarctica (2100)  
Casey Research Station, Antarctica (2100)

### Continental Frigid Summer Climate (EY):  
<img src="images/CaseyStation.jpg"/>
Casey Research Station, Antarctica (today)

# Subarctic Climates (F):

### Subarctic Very Hot Summer Climate (FA2):  
Yakutsk, Russia (2100)

### Subarctic Hot Summer Climate (FA1):  

### Subarctic Mild Summer Climate (FB2):  
<img src="images/GorkhiTerelj.jpg"/>

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
<img src="images/Inuvik.jpg"/>

Inuvik, NT (today)   
Arviat, NU (today)  
Cambridge Bay, NU (2100)

### Subarctic Very Cold Summer Climate (FC2):  
PRODHOE BAY IN JULY
<img src="images/ProdhoeJuly.jpg"/>

Tuktoyaktuk, NT (today)  
Iqaluit, NU (today)  
Pangnirtung, NU (today)     
Prudhoe Bay, AK (today)  
Eureka Research Station, NU (2100)  
Isachsen Research Station, NU (2100)

### Subarctic Freezing Summer Climate (FC1):  
POND INLET IN JUNE  
<img src="images/PondInletJune.jpg"/>

Qikiqtarjuaq, NU (today)  
Wainwright, AK (today)  
Utqiagvik, AK (today)  
Pond Inlet, NU (today)  
Pond Inlet, NU (2100)  
McMurdo Research Station, Antarctica (2100)

### Subarctic Frigid Summer Climate (FY):  
<img src="images/McMurdoStation.jpg"/>

McMurdo Research Station, Antarctica (today)

# Arctic Climates (G): 

### Arctic Mild Summer Climate (GB2):  
<img src="images/Yakutsk_.jpg"/>

Yakutsk, Russia (today)

### Arctic Cold Summer Climate (GB1):  
<img src="images/Baker_Lake.jpg"/>  

Rankin Inlet, NU (today)  
Baker Lake, NU (today)  
Coral Harbour, NU (today)

### Arctic Very Cold Summer Climate (GC2):  
<img src="images/Cambridge_Bay.jpg"/>

Cambridge Bay, NU (today)  
Igloolik, NU (today)  
Eureka Research Station, NU (today)

### Arctic Freezing Summer Climate (GC1):  
<img src="images/Isachsen.jpg"/>

Isachsen Research Station, NU (today)

### Arctic Frigid Summer Climate (GY):  

# Superarctic Climates (Y):

### Superarctic Very Cold Summer Climate (YC2):  
Concordia Research Station, Antarctica (2100)

### Superarctic Freezing Summer Climate (YC1):  

### Superarctic Frigid Summer Climate (YY):  
<img src="images/Concordia.jpg"/>

Concordia Research Station, Antarctica (today)




