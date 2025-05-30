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
Ho Chi Minh City, Vietnam	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)
Phnom Penh, Cambodia	A (Supertropical), G (Semihumid), Z1 (Scorching Hot Summer)

Supertropical Monsoon Scorching Hot Summer (AWZ1):  
Bamako, Mali	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Naypyidaw, Myanmar	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)
Abuja, Nigeria	A (Supertropical), W (Monsoon), Z1 (Scorching Hot Summer)

Supertropical Semiarid Scorching Hot Summer (ASZ1):  
Bangkok, Thailand	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Chennai, India	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Hyderabad, India	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Managua, Nicaragua	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)
Juba, South Sudan	A (Supertropical), S (Semiarid), Z1 (Scorching Hot Summer)

Supertropical Arid Desert Scorching Hot Summer (ADZ1):  
Ouagadougou, Burkina Faso	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
N'Djamena, Chad	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Djibouti, Djibouti	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Niamey, Niger	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Muscat, Oman	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Khartoum, Sudan	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Abu Dhabi, United Arab Emirates	A (Supertropical), D (Arid Desert), Z1 (Scorching Hot Summer)

### Supertropial Very Hot Summer climates (A-A2):

Supertropical Humid Very Hot Summer (AHA2):  
Manila, Philippines	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Kuala Lumpur, Malaysia	A (Supertropical), H (Humid), A2 (Very Hot Summer)
San Juan, PR	A (Supertropical), H (Humid), A2 (Very Hot Summer)
St. John's, Antigua and Barbuda	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Bandar Seri Begawan, Brunei	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Moroni, Comoros	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Roseau, Dominica	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Malabo, Equatorial Guinea	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Palikir, Federated States of Micronesia	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Georgetown, Guyana	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Kingston, Jamaica	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Monrovia, Liberia	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Majuro, Marshall Islands	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Ngerulmud, Palau	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Panama City, Panama	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Port Moresby, Papua New Guinea	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Basseterre, Saint Kitts and Nevis	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Apia, Samoa	A (Supertropical), H (Humid), A2 (Very Hot Summer)
São Tomé, São Tomé and Príncipe	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Singapore, Singapore	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Honiara, Solomon Islands	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Sri Jayawardenepura Kotte, Sri Lanka	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Nukuʻalofa, Tonga	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Funafuti, Tuvalu	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Port Vila, Vanuatu	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Road Town, British Virgin Islands (UK)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Brades, Montserrat (UK)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Pago Pago, American Samoa (US)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Hagåtña, Guam (US)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Saipan, Northern Mariana Islands (US)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Charlotte Amalie, U.S. Virgin Islands (US)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
San Juan, Puerto Rico (US)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Mata-Utu, Wallis & Futuna (FR)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Avarua, Cook Islands (NZ)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Alofi, Niue (NZ)	A (Supertropical), H (Humid), A2 (Very Hot Summer)
Nukunonu, Tokelau (NZ)	A (Supertropical), H (Humid), A2 (Very Hot Summer)

Supertropical Semihumid Very Hot Summer (AGA2):  
Bridgetown, Barbados	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Belmopan, Belize	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Yaoundé, Cameroon	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Bangui, Central African Republic	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Port-au-Prince, Haiti	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Malé, Maldives	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Yaren, Nauru	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Kingstown, Saint Vincent and the Grenadines	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Paramaribo, Suriname	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Port of Spain, Trinidad and Tobago	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
The Valley, Anguilla (UK)	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Adamstown, Pitcairn Islands (UK)	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)
Philipsburg, Sint Maarten (NL)	A (Supertropical), G (Semihumid), A2 (Very Hot Summer)

Supertropical Monsoon Very Hot Summer (AWA2):  
Jakarta, Indonesia	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Mumbai, India	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Kinshasa, DR Congo	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Brazzaville, Congo	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
San Salvador, El Salvador	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Suva, Fiji	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Banjul, Gambia	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Conakry, Guinea	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Bissau, Guinea-Bissau	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Vientiane, Laos	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Port Louis, Mauritius	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Victoria, Seychelles	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Freetown, Sierra Leone	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Dili, Timor-Leste	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Papeete, French Polynesia (FR)	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)
Libreville, Gabon	A (Supertropical), W (Monsoon), A2 (Very Hot Summer)

Supertropical Semiarid Very Hot Summer (ASA2):  
Bangalore, India	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Lagos, Nigeria	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Honolulu, HI	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Nassau, Bahamas	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Porto-Novo, Benin	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Yamoussoukro, Côte d'Ivoire	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Havana, Cuba	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Santo Domingo, Dominican Republic	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Accra, Ghana	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
St. George's, Grenada	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Tarawa, Kiribati	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Castries, Saint Lucia	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Lomé, Togo	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)
Oranjestad, Aruba (NL)	A (Supertropical), S (Semiarid), A2 (Very Hot Summer)

Supertropical Arid Desert Very Hot Summer (ADA2):  
Karachi, Pakistan	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Luanda, Angola	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Praia, Cabo Verde	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Nouakchott, Mauritania	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Dakar, Senegal	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Mogadishu, Somalia	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Dodoma, Tanzania	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
George Town, Cayman Islands (UK)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Cockburn Town, Turks & Caicos (UK)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Willemstad, Curaçao (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Kralendijk, Bonaire (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
The Bottom, Saba (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)
Oranjestad, Sint Eustatius (NL)	A (Supertropical), D (Arid Desert), A2 (Very Hot Summer)

### Supertropial Hot Summer climates (A-A1):

Supertropical Monsoon Hot Summer (AWA1):  
Brasília, Brazil	A (Supertropical), W (Monsoon), A1 (Hot Summer)

Supertropical Semiarid Hot Summer (ASA1):  
Caracas, Venezuela	A (Supertropical), S (Semiarid), A1 (Hot Summer)

# Tropical Climates (B):

### Tropical Hyperthermal Summer climates (B-Z2):

Tropical Arid Desert Hyperthermal Summer (BDZ2):  
Phoenix–Mesa–Scottsdale, AZ	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Baghdad, Iraq	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Kuwait City, Kuwait	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)
Riyadh, Saudi Arabia	B (Tropical), D (Arid Desert), Z2 (Hyperthermal Summer)

### Tropical Scorching Hot Summer climates (B-Z1): 

Tropical Monsoon Scorching Hot Summer (BWZ1):  
Delhi, India	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)
Kolkata, India	B (Tropical), W (Monsoon), Z1 (Scorching Hot Summer)

Tropical Desert Scorching Hot Summer (BDZ1):  
Lahore, Pakistan	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Manama, Bahrain	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Nicosia, Cyprus	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)
Doha, Qatar	B (Tropical), D (Arid Desert), Z1 (Scorching Hot Summer)

### Tropical Very Hot Summer Climates (B-A2):

Tropical Humid Very Hot Summer (BHA2):  
Taipei, Taiwan	B (Tropical), H (Humid), A2 (Very Hot Summer)
Nouméa, New Caledonia (FR)	B (Tropical), H (Humid), A2 (Very Hot Summer)

Tropical Semihumid Very Hot Summer (BGA2):  
Miami–Fort Lauderdale, FL	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Tampa–St. Petersburg, FL	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Orlando, FL	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Jacksonville, FL	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
New Orleans, LA	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Tallahassee, FL	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Baton Rouge, LA	B (Tropical), G (Semihumid), A2 (Very Hot Summer)
Hamilton, Bermuda (UK)	B (Tropical), G (Semihumid), A2 (Very Hot Summer)

Tropical Monsoon Very Hot Summer (BWA2):  
Guangzhou–Foshan, China	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Dhaka, Bangladesh	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Shenzhen, China	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Rio de Janeiro, Brazil	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Dongguan, China	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Maputo, Mozambique	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Asunción, Paraguay	B (Tropical), W (Monsoon), A2 (Very Hot Summer)
Hanoi, Vietnam	B (Tropical), W (Monsoon), A2 (Very Hot Summer)

Tropical Mediterranean Very Hot Summer (BMA2):  
Algiers, Algeria	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)
Beirut, Lebanon	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)
Tunis, Tunisia	B (Tropical), M (Mediterranean), A2 (Very Hot Summer)

Tropical Semiarid Very Hot Summer (BSA2):  
Houston, TX	B (Tropical), S (Semiarid), A2 (Very Hot Summer)
San Antonio, TX	B (Tropical), S (Semiarid), A2 (Very Hot Summer)
Austin, TX	B (Tropical), S (Semiarid), A2 (Very Hot Summer)

Tropical Arid Desert Very Hot Summer (BDA2):  
<img src="images/pyramids.jpg"/>  

Cairo, Egypt	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Gaborone, Botswana	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Jerusalem, Israel	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Amman, Jordan	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Tripoli, Libya	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Valletta, Malta	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)
Melilla, Melilla (ES)	B (Tropical), D (Arid Desert), A2 (Very Hot Summer)

### Tropical Hot Summer Climates (B-A1):

Tropical Humid Hot Summer (BHA1):  
San José, Costa Rica	B (Tropical), H (Humid), A1 (Hot Summer)
Kingston, Norfolk Island (AU)	B (Tropical), H (Humid), A1 (Hot Summer)

Tropical Semihumid Hot Summer (BGA1):  
Buenos Aires, Argentina	B (Tropical), G (Semihumid), A1 (Hot Summer)
Tegucigalpa, Honduras	B (Tropical), G (Semihumid), A1 (Hot Summer)
Kampala, Uganda	B (Tropical), G (Semihumid), A1 (Hot Summer)
Montevideo, Uruguay	B (Tropical), G (Semihumid), A1 (Hot Summer)

Tropical Monsoon Hot Summer (BWA1):  
São Paulo, Brazil	B (Tropical), W (Monsoon), A1 (Hot Summer)
Gitega, Burundi	B (Tropical), W (Monsoon), A1 (Hot Summer)
Antananarivo, Madagascar	B (Tropical), W (Monsoon), A1 (Hot Summer)
Lilongwe, Malawi	B (Tropical), W (Monsoon), A1 (Hot Summer)
Sana'a, Yemen	B (Tropical), W (Monsoon), A1 (Hot Summer)
Lusaka, Zambia	B (Tropical), W (Monsoon), A1 (Hot Summer)
Harare, Zimbabwe	B (Tropical), W (Monsoon), A1 (Hot Summer)

Tropical Mediterranean Hot Summer (BMA1):  
Los Angeles, United States	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Riverside–San Bernardino, CA	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Lisbon, Portugal	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Gibraltar, Gibraltar (UK)	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Ceuta, Ceuta (ES)	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Ponta Delgada, Azores (PT)	B (Tropical), M (Mediterranean), A1 (Hot Summer)
Funchal, Madeira (PT)	B (Tropical), M (Mediterranean), A1 (Hot Summer)

Tropical Semiarid Hot Summer (BSA1):  
Nairobi, Kenya	B (Tropical), S (Semiarid), A1 (Hot Summer)
Jamestown, St Helena (UK)	B (Tropical), S (Semiarid), A1 (Hot Summer)
Hanga Roa, Easter Island (CL)	B (Tropical), S (Semiarid), A1 (Hot Summer)

Tropical Arid Desert Hot Summer (BDA1):  
Lima, Peru	B (Tropical), D (Arid Desert), A1 (Hot Summer)
San Diego, CA	B (Tropical), D (Arid Desert), A1 (Hot Summer)
Asmara, Eritrea	B (Tropical), D (Arid Desert), A1 (Hot Summer)
Rabat, Morocco	B (Tropical), D (Arid Desert), A1 (Hot Summer)
Windhoek, Namibia	B (Tropical), D (Arid Desert), A1 (Hot Summer)

### Tropical Mild Summer Climates (B-B2):

Tropical Humid Mild Summer (BHB2):  
Guatemala City, Guatemala	B (Tropical), H (Humid), B2 (Mild Summer)
Wellington, New Zealand	B (Tropical), H (Humid), B2 (Mild Summer)
Bogotá, Colombia (today)  
Edinburgh of the Seven Seas	(today)

Tropical Semihumid Mild Summer (BGB2):  
Kigali, Rwanda	B (Tropical), G (Semihumid), B2 (Mild Summer)
<img src="images/Ruwenpflanzen.jpg"/>

Tropical Monsoon Mild Summer (BWB2):  
Mexico City, Mexico	B (Tropical), W (Monsoon), B2 (Mild Summer)
Mbabane, Eswatini	B (Tropical), W (Monsoon), B2 (Mild Summer)
Addis Ababa, Ethiopia	B (Tropical), W (Monsoon), B2 (Mild Summer)

Tropical Semiarid Mild Summer (BSB2):  
Cape Town, South Africa	B (Tropical), S (Semiarid), B2 (Mild Summer)

### Tropical Cold Summer Climate (BB1):  
Quito, Ecuador (today)  
Sucre, Bolivia (today)

# Subtropical Climates (C):

### Subtropical Scorching Hot Summer Climates (C-Z1):

Subtropical Semiarid Scorching Hot Summer (CSZ1):   
Islamabad, Pakistan	C (Subtropical), S (Semiarid), Z1 (Scorching Hot Summer)

Subtropical Desert Scorching Hot Summer (CDZ1):  
Las Vegas–Henderson–Paradise, NV	C (Subtropical), D (Arid Desert), Z1 (Scorching Hot Summer)

### Subtropical Very Hot Summer Climates (C-A2):

Subtropical Humid Very Hot Summer (CHA2):  
Tokyo–Yokohama, Japan	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Osaka–Kobe–Kyoto, Japan	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Nagoya, Japan	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Atlanta, GA	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Virginia Beach–Norfolk, VA	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Nashville–Davidson, TN	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Memphis, TN–MS–AR	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Louisville/Jefferson County, KY–IN	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Little Rock, AR	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Annapolis, MD	C (Subtropical), H (Humid), A2 (Very Hot Summer)
Carbondale, IL	C (Subtropical), H (Humid), A2 (Very Hot Summer)

Subtropical Semihumid Very Hot Summer (CGA2):   
Shanghai, China	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Wuhan, China	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Hangzhou, China	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Charlotte, NC–SC	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Raleigh, NC	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Richmond, VA	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Montgomery, AL	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Jackson, MS	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)
Columbia, SC	C (Subtropical), G (Semihumid), A2 (Very Hot Summer)

Subtropical Monsoon Very Hot Summer (CWA2):  
Chengdu, China	C (Subtropical), W (Monsoon), A2 (Very Hot Summer)
Chongqing, China	C (Subtropical), W (Monsoon), A2 (Very Hot Summer)
Xi’an, China	C (Subtropical), W (Monsoon), A2 (Very Hot Summer)
Zhengzhou, China	C (Subtropical), W (Monsoon), A2 (Very Hot Summer)

Subtropical Mediterranean Very Hot Summer (CMA2):   
Istanbul, Turkey	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Sacramento, CA	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Athens, Greece	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)
Tashkent, Uzbekistan	C (Subtropical), M (Mediterranean), A2 (Very Hot Summer)

Subtropical Semiarid Very Hot Summer (CSA2):  
Dallas–Fort Worth–Arlington, TX	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Oklahoma City, OK	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)
Madrid, Spain	C (Subtropical), S (Semiarid), A2 (Very Hot Summer)

Subtropical Arid Desert Very Hot Summer (CDA2):  
Baku, Azerbaijan	C (Subtropical), D (Arid Desert), A2 (Very Hot Summer)
Ashgabat, Turkmenistan	C (Subtropical), D (Arid Desert), A2 (Very Hot Summer)

### Subtropical Hot Summer Climates (C-A1):  

Subtropical Humid Hot Summer (CHA1):  
Dover, DE	C (Subtropical), H (Humid), A1 (Hot Summer)
Frankfort, KY	C (Subtropical), H (Humid), A1 (Hot Summer)
Charleston, WV	C (Subtropical), H (Humid), A1 (Hot Summer)
Tirana, Albania	C (Subtropical), H (Humid), A1 (Hot Summer)
Podgorica, Montenegro	C (Subtropical), H (Humid), A1 (Hot Summer)

Subtropical Semihumid Hot Summer (CGA1):   
Washington–Arlington, DC–VA–MD	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Rome, Italy	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Monaco, Monaco	C (Subtropical), G (Semihumid), A1 (Hot Summer)
San Marino, San Marino	C (Subtropical), G (Semihumid), A1 (Hot Summer)
Belgrade, Serbia	C (Subtropical), G (Semihumid), A1 (Hot Summer)

Subtropical Monsoon Hot Summer (CWA1):  
Johannesburg–Pretoria, South Africa	C (Subtropical), W (Monsoon), A1 (Hot Summer)
Maseru, Lesotho	C (Subtropical), W (Monsoon), A1 (Hot Summer)
Kathmandu, Nepal	C (Subtropical), W (Monsoon), A1 (Hot Summer)
Bloemfontein, South Africa	C (Subtropical), W (Monsoon), A1 (Hot Summer)

Subtropical Meiterranean Hot Summer (CMA1):  
Damascus, Syria	C (Subtropical), M (Mediterranean), A1 (Hot Summer)

Subtropical Semiarid Hot Summer (CSA1):  
Vatican City, Vatican City	C (Subtropical), S (Semiarid), A1 (Hot Summer)

Subtropical Arid Desert Hot Summer (CDA1):  
Santiago, Chile	C (Subtropical), D (Arid Desert), A1 (Hot Summer)

### Subtropical Mild Summer Climates (C-B2):

Subtropical Humid Mild Summer (CHB2):  
Dublin, Ireland	C (Subtropical), H (Humid), B2 (Mild Summer)
Luxembourg, Luxembourg	C (Subtropical), H (Humid), B2 (Mild Summer)
Bern, Switzerland	C (Subtropical), H (Humid), B2 (Mild Summer)

Subtropical Semihumid Mild Summer (CGB2):  
Paris, France	C (Subtropical), G (Semihumid), B2 (Mild Summer)
London, United Kingdom	C (Subtropical), G (Semihumid), B2 (Mild Summer)
Canberra, Australia	C (Subtropical), G (Semihumid), B2 (Mild Summer)
Brussels, Belgium	C (Subtropical), G (Semihumid), B2 (Mild Summer)
Copenhagen, Denmark	C (Subtropical), G (Semihumid), B2 (Mild Summer)
Berlin, Germany	C (Subtropical), G (Semihumid), B2 (Mild Summer)
Amsterdam, Netherlands	C (Subtropical), G (Semihumid), B2 (Mild Summer)

Subtropical Mediterranean Mild Summer (CMB2):  
Seattle–Tacoma, WA	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
San Francisco–Oakland, CA	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Portland, OR–WA	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
San Jose, CA	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Salem, OR	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Olympia, WA	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Vancouver, BC	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Surrey, BC	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Burnaby, BC	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Richmond, BC	C (Subtropical), M (Mediterranean), B2 (Mild Summer)
Abbotsford, BC	C (Subtropical), M (Mediterranean), B2 (Mild Summer)

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

### Temperate Very Hot Summer Climates (D-A2):

Temperate Humid Very Hot Summer (DHA2):  
Kansas City, MO–KS	D (Temperate), H (Humid), A2 (Very Hot Summer)

Temperate Semihumid Very Hot Summer (DGA2):  
St. Louis, MO–IL	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Topeka, KS	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Jefferson City, MO	D (Temperate), G (Semihumid), A2 (Very Hot Summer)
Lincoln, NE	D (Temperate), G (Semihumid), A2 (Very Hot Summer)

Temperate Monsoon Very Hot Summer (DWA2):  
Seoul–Incheon, South Korea	D (Temperate), W (Monsoon), A2 (Very Hot Summer)
Beijing, China	D (Temperate), W (Monsoon), A2 (Very Hot Summer)
Tianjin, China	D (Temperate), W (Monsoon), A2 (Very Hot Summer)

Temperate Semiarid Very Hot Summer (DSA2):  
Salt Lake City, UT	D (Temperate), S (Semiarid), A2 (Very Hot Summer)
Pierre, SD	D (Temperate), S (Semiarid), A2 (Very Hot Summer)

Temperate Arid Desert Very Hot Summer (DDA2):  
Tehran, Iran	D (Temperate), D (Arid Desert), A2 (Very Hot Summer)

### Temperate Hot Summer Climates (D-A1):

Temperate Humid Hot Summer (DHA1):  
New York, United States	D (Temperate), H (Humid), A1 (Hot Summer)
Chicago, United States	D (Temperate), H (Humid), A1 (Hot Summer)
Philadelphia, PA–NJ–DE–MD	D (Temperate), H (Humid), A1 (Hot Summer)
Boston, MA–NH	D (Temperate), H (Humid), A1 (Hot Summer)
Baltimore, MD	D (Temperate), H (Humid), A1 (Hot Summer)
Pittsburgh, PA	D (Temperate), H (Humid), A1 (Hot Summer)
Cleveland, OH	D (Temperate), H (Humid), A1 (Hot Summer)
Indianapolis, IN	D (Temperate), H (Humid), A1 (Hot Summer)
Cincinnati, OH–KY	D (Temperate), H (Humid), A1 (Hot Summer)
Columbus, OH	D (Temperate), H (Humid), A1 (Hot Summer)
Milwaukee, WI	D (Temperate), H (Humid), A1 (Hot Summer)
Providence, RI–MA	D (Temperate), H (Humid), A1 (Hot Summer)
Hartford, CT	D (Temperate), H (Humid), A1 (Hot Summer)
Buffalo, NY	D (Temperate), H (Humid), A1 (Hot Summer)
Augusta, ME	D (Temperate), H (Humid), A1 (Hot Summer)
Concord, NH	D (Temperate), H (Humid), A1 (Hot Summer)
Trenton, NJ	D (Temperate), H (Humid), A1 (Hot Summer)
Albany, NY	D (Temperate), H (Humid), A1 (Hot Summer)
Harrisburg, PA	D (Temperate), H (Humid), A1 (Hot Summer)
Madison, WI	D (Temperate), H (Humid), A1 (Hot Summer)
Zagreb, Croatia	D (Temperate), H (Humid), A1 (Hot Summer)
Hamilton, ON	D (Temperate), H (Humid), A1 (Hot Summer)
Champaign, IL	D (Temperate), H (Humid), A1 (Hot Summer)

Temperate Semihumid Hot Summer (DGA1):  
Moscow, Russia	D (Temperate), G (Semihumid), A1 (Hot Summer)
Detroit, MI	D (Temperate), G (Semihumid), A1 (Hot Summer)
Minneapolis–St. Paul, MN	D (Temperate), G (Semihumid), A1 (Hot Summer)
Springfield, IL	D (Temperate), G (Semihumid), A1 (Hot Summer)
Des Moines, IA	D (Temperate), G (Semihumid), A1 (Hot Summer)
Lansing, MI	D (Temperate), G (Semihumid), A1 (Hot Summer)
Vienna, Austria	D (Temperate), G (Semihumid), A1 (Hot Summer)
Budapest, Hungary	D (Temperate), G (Semihumid), A1 (Hot Summer)
Pristina, Kosovo	D (Temperate), G (Semihumid), A1 (Hot Summer)
Skopje, North Macedonia	D (Temperate), G (Semihumid), A1 (Hot Summer)
Bratislava, Slovakia	D (Temperate), G (Semihumid), A1 (Hot Summer)
Kyiv, Ukraine	D (Temperate), G (Semihumid), A1 (Hot Summer)
Toronto, ON	D (Temperate), G (Semihumid), A1 (Hot Summer)
Mississauga, ON	D (Temperate), G (Semihumid), A1 (Hot Summer)
Brampton, ON	D (Temperate), G (Semihumid), A1 (Hot Summer)

Temperate Monsoon Hot Summer (DWA1):  
Pyongyang, North Korea	D (Temperate), W (Monsoon), A1 (Hot Summer)

Temperate Mediterranean Hot Summer (DMA1):  
Boise, ID	D (Temperate), M (Mediterranean), A1 (Hot Summer)
Carson City, NV	D (Temperate), M (Mediterranean), A1 (Hot Summer)

Temperate Semiarid Hot Summer (DSA1): 
Denver–Aurora, CO	D (Temperate), S (Semiarid), A1 (Hot Summer)
Santa Fe, NM	D (Temperate), S (Semiarid), A1 (Hot Summer)
Cheyenne, WY	D (Temperate), S (Semiarid), A1 (Hot Summer)
Kabul, Afghanistan	D (Temperate), S (Semiarid), A1 (Hot Summer)
Yerevan, Armenia	D (Temperate), S (Semiarid), A1 (Hot Summer)
Tbilisi, Georgia	D (Temperate), S (Semiarid), A1 (Hot Summer)
Bishkek, Kyrgyzstan	D (Temperate), S (Semiarid), A1 (Hot Summer)
Chișinău, Moldova	D (Temperate), S (Semiarid), A1 (Hot Summer)
Bucharest, Romania	D (Temperate), S (Semiarid), A1 (Hot Summer)
Ankara, Turkey	D (Temperate), S (Semiarid), A1 (Hot Summer)
Rexburg, ID	D (Temperate), S (Semiarid), A1 (Hot Summer)

### Temperate Mild Summer Climates (D-B2):

Temperate Humid Mild Summer (DHB2):  
Sarajevo, Bosnia and Herzegovina	D (Temperate), H (Humid), B2 (Mild Summer)
Vaduz, Liechtenstein	D (Temperate), H (Humid), B2 (Mild Summer)
Oslo, Norway	D (Temperate), H (Humid), B2 (Mild Summer)
Ljubljana, Slovenia	D (Temperate), H (Humid), B2 (Mild Summer)
Saint-Pierre, Saint-Pierre & Miquelon (FR)	D (Temperate), H (Humid), B2 (Mild Summer)
Halifax, NS	D (Temperate), H (Humid), B2 (Mild Summer)
Cape Breton Regional Municipality, NS	D (Temperate), H (Humid), B2 (Mild Summer)
Truro, NS	D (Temperate), H (Humid), B2 (Mild Summer)
New Glasgow, NS	D (Temperate), H (Humid), B2 (Mild Summer)
Amherst, NS	D (Temperate), H (Humid), B2 (Mild Summer)
Moncton, NB	D (Temperate), H (Humid), B2 (Mild Summer)
Saint John, NB	D (Temperate), H (Humid), B2 (Mild Summer)
Dieppe, NB	D (Temperate), H (Humid), B2 (Mild Summer)
St. John's, NL	D (Temperate), H (Humid), B2 (Mild Summer)
Conception Bay South, NL	D (Temperate), H (Humid), B2 (Mild Summer)
Mount Pearl, NL	D (Temperate), H (Humid), B2 (Mild Summer)
Paradise, NL	D (Temperate), H (Humid), B2 (Mild Summer)
Corner Brook, NL	D (Temperate), H (Humid), B2 (Mild Summer)
Charlottetown, PE	D (Temperate), H (Humid), B2 (Mild Summer)
Andorra la Vella, Andorra (today)

Temperate Semihumid Mild Summer (DGB2):  
Minsk, Belarus	D (Temperate), G (Semihumid), B2 (Mild Summer)
Sofia, Bulgaria	D (Temperate), G (Semihumid), B2 (Mild Summer)
Prague, Czech Republic	D (Temperate), G (Semihumid), B2 (Mild Summer)
Tallinn, Estonia	D (Temperate), G (Semihumid), B2 (Mild Summer)
Helsinki, Finland	D (Temperate), G (Semihumid), B2 (Mild Summer)
Riga, Latvia	D (Temperate), G (Semihumid), B2 (Mild Summer)
Vilnius, Lithuania	D (Temperate), G (Semihumid), B2 (Mild Summer)
Stockholm, Sweden	D (Temperate), G (Semihumid), B2 (Mild Summer)
Calgary, AB	D (Temperate), G (Semihumid), B2 (Mild Summer)

Temperate Mediterranean Mild Summer (DMB2):  
Dushanbe, Tajikistan	D (Temperate), M (Mediterranean), B2 (Mild Summer)

Temperate Semiarid Mild Summer (DSB2):  
Helena, MT	D (Temperate), S (Semiarid), B2 (Mild Summer)
Warsaw, Poland	D (Temperate), S (Semiarid), B2 (Mild Summer)
Lethbridge, AB	D (Temperate), S (Semiarid), B2 (Mild Summer)

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
Ottawa, Canada	E (Continental), H (Humid), A1 (Hot Summer)
Ottawa, ON	E (Continental), H (Humid), A1 (Hot Summer)
Montreal, QC	E (Continental), H (Humid), A1 (Hot Summer)
Laval, QC	E (Continental), H (Humid), A1 (Hot Summer)
Gatineau, QC	E (Continental), H (Humid), A1 (Hot Summer)
Longueuil, QC	E (Continental), H (Humid), A1 (Hot Summer)

Continental Monsoon Hot Summer (EWA1):  
Bismarck, ND	E (Continental), W (Monsoon), A1 (Hot Summer)

### Continental Mild Summer Climates (E-B2):  

Continental Humid Mild Summer (EHB2):  
Montpelier, VT	E (Continental), H (Humid), B2 (Mild Summer)
Quebec City, QC	E (Continental), H (Humid), B2 (Mild Summer)
Fredericton, NB	E (Continental), H (Humid), B2 (Mild Summer)
Miramichi, NB	E (Continental), H (Humid), B2 (Mild Summer)
Duluth, MN	E (Continental), H (Humid), B2 (Mild Summer)
Lutsen, MN	E (Continental), H (Humid), B2 (Mild Summer)
Thunder Bay, ON	E (Continental), H (Humid), B2 (Mild Summer)

Continental Semihumid Mild Summer (EGB2):  
Edmonton, AB	E (Continental), G (Semihumid), B2 (Mild Summer)
Red Deer, AB	E (Continental), G (Semihumid), B2 (Mild Summer)
St. Albert, AB	E (Continental), G (Semihumid), B2 (Mild Summer)
Winnipeg, MB	E (Continental), G (Semihumid), B2 (Mild Summer)
Brandon, MB	E (Continental), G (Semihumid), B2 (Mild Summer)
Steinbach, MB	E (Continental), G (Semihumid), B2 (Mild Summer)
Portage la Prairie, MB	E (Continental), G (Semihumid), B2 (Mild Summer)
Prince Albert, SK	E (Continental), G (Semihumid), B2 (Mild Summer)
Knik-Fairview, AK	E (Continental), G (Semihumid), B2 (Mild Summer)
Novosibirsk, Russia	E (Continental), G (Semihumid), B2 (Mild Summer)
Krasnoyarsk, Russia	E (Continental), G (Semihumid), B2 (Mild Summer)
Omsk, Russia	E (Continental), G (Semihumid), B2 (Mild Summer)

Continental Monsoon Mild Summer (EWB2):  
Fairbanks, AK	E (Continental), W (Monsoon), B2 (Mild Summer)
Badger, AK	E (Continental), W (Monsoon), B2 (Mild Summer)
Steele Creek, AK	E (Continental), W (Monsoon), B2 (Mild Summer)

Continental Semiarid Mild Summer (ESB2):   
Astana, Kazakhstan	E (Continental), S (Semiarid), B2 (Mild Summer)
Saskatoon, SK	E (Continental), S (Semiarid), B2 (Mild Summer)
Regina, SK	E (Continental), S (Semiarid), B2 (Mild Summer)
Moose Jaw, SK	E (Continental), S (Semiarid), B2 (Mild Summer)
Swift Current, SK	E (Continental), S (Semiarid), B2 (Mild Summer)
College, AK	E (Continental), S (Semiarid), B2 (Mild Summer)
Chena Ridge, AK	E (Continental), S (Semiarid), B2 (Mild Summer)

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




