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
Ho Chi Minh City, Vietnam	(today)  
Phnom Penh, Cambodia	(today)  

Supertropical Monsoon Scorching Hot Summer (AWZ1):  
Bamako, Mali	(today)  
Naypyidaw, Myanmar	(today)  
Abuja, Nigeria	(today)  

Supertropical Semiarid Scorching Hot Summer (ASZ1):  
Bangkok, Thailand	(today)  
Chennai, India	(today)  
Hyderabad, India	(today)  
Managua, Nicaragua	(today)  
Juba, South Sudan	(today)  

Supertropical Arid Desert Scorching Hot Summer (ADZ1):  
Ouagadougou, Burkina Faso	(today)  
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

### Supertropial Hot Summer climates (A-A1):

Supertropical Monsoon Hot Summer (AWA1):  
Brasília, Brazil	(today)  

Supertropical Semiarid Hot Summer (ASA1):  
Caracas, Venezuela	(today)  

# Tropical Climates (B):

### Tropical Hyperthermal Summer climates (B-Z2):

Tropical Arid Desert Hyperthermal Summer (BDZ2):  
Phoenix–Mesa–Scottsdale, AZ	(today)  
Baghdad, Iraq	(today)  
Kuwait City, Kuwait	(today)  
Riyadh, Saudi Arabia	(today)  

### Tropical Scorching Hot Summer climates (B-Z1): 

Tropical Monsoon Scorching Hot Summer (BWZ1):  
Delhi, India	(today)  
Kolkata, India	(today)  

Tropical Desert Scorching Hot Summer (BDZ1):  
Lahore, Pakistan	(today)  
Manama, Bahrain	(today)  
Nicosia, Cyprus	(today)  
Doha, Qatar	(today)  

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

Tropical Monsoon Very Hot Summer (BWA2):  
Guangzhou–Foshan, China	(today)  
Dhaka, Bangladesh	(today)  
Shenzhen, China	(today)  
Rio de Janeiro, Brazil	(today)  
Dongguan, China	(today)  
Maputo, Mozambique	(today)  
Asunción, Paraguay	(today)  
Hanoi, Vietnam	(today)  

Tropical Mediterranean Very Hot Summer (BMA2):  
Algiers, Algeria	(today)  
Beirut, Lebanon	(today)  
Tunis, Tunisia	(today)  

Tropical Semiarid Very Hot Summer (BSA2):  
Houston, TX	(today)  
San Antonio, TX	(today)  
Austin, TX	(today)  

Tropical Arid Desert Very Hot Summer (BDA2):  
<img src="images/pyramids.jpg"/>  

Cairo, Egypt	(today)  
Gaborone, Botswana	(today)  
Jerusalem, Israel	(today)  
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
Kampala, Uganda	(today)  
Montevideo, Uruguay	(today)  

Tropical Monsoon Hot Summer (BWA1):  
São Paulo, Brazil	(today)  
Gitega, Burundi	(today)  
Antananarivo, Madagascar	(today)  
Lilongwe, Malawi	(today)  
Sana'a, Yemen	(today)  
Lusaka, Zambia	(today)  
Harare, Zimbabwe	(today)  

Tropical Mediterranean Hot Summer (BMA1):  
Los Angeles, United States	(today)  
Riverside–San Bernardino, CA	(today)  )
Lisbon, Portugal	(today)  
Gibraltar, Gibraltar (UK)	(today)  
Ceuta, Ceuta (ES)	(today)  
Ponta Delgada, Azores (PT)	(today)  
Funchal, Madeira (PT)	(today)  

Tropical Semiarid Hot Summer (BSA1):  
Nairobi, Kenya	(today)  
Jamestown, St Helena (UK)	(today)  
Hanga Roa, Easter Island (CL)	(today)  

Tropical Arid Desert Hot Summer (BDA1):  
Lima, Peru	(today)  
San Diego, CA	(today)  
Asmara, Eritrea	(today)  
Rabat, Morocco	(today)  
Windhoek, Namibia	(today)  

### Tropical Mild Summer Climates (B-B2):

Tropical Humid Mild Summer (BHB2):  
Guatemala City, Guatemala	(today)  
Wellington, New Zealand	(today)  
Bogotá, Colombia (today)  
Edinburgh of the Seven Seas	(today)

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

### Subtropical Scorching Hot Summer Climates (C-Z1):

Subtropical Semiarid Scorching Hot Summer (CSZ1):   
Islamabad, Pakistan	(today)  

Subtropical Desert Scorching Hot Summer (CDZ1):  
Las Vegas–Henderson–Paradise, NV	(today)  

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

Subtropical Semiarid Very Hot Summer (CSA2):  
Dallas–Fort Worth–Arlington, TX	(today)  
Oklahoma City, OK	(today)  
Madrid, Spain	(today)  

Subtropical Arid Desert Very Hot Summer (CDA2):  
Baku, Azerbaijan	(today)  
Ashgabat, Turkmenistan	(today)  

### Subtropical Hot Summer Climates (C-A1):  

Subtropical Humid Hot Summer (CHA1):  
Dover, DE	(today)  
Frankfort, KY	(today)  
Charleston, WV	(today)  
Tirana, Albania	(today)  
Podgorica, Montenegro	(today)  

Subtropical Semihumid Hot Summer (CGA1):   
Washington–Arlington, DC–VA–MD	(today)  
Rome, Italy	(today)  
Monaco, Monaco	(today)  
San Marino, San Marino	(today)  
Belgrade, Serbia	(today)  

Subtropical Monsoon Hot Summer (CWA1):  
Johannesburg–Pretoria, South Africa	(today)  
Maseru, Lesotho	(today)  
Kathmandu, Nepal	(today)  
Bloemfontein, South Africa	(today)  

Subtropical Meiterranean Hot Summer (CMA1):  
Damascus, Syria	(today)  

Subtropical Semiarid Hot Summer (CSA1):  
Vatican City, Vatican City	(today)  

Subtropical Arid Desert Hot Summer (CDA1):  
Santiago, Chile	(today)  

### Subtropical Mild Summer Climates (C-B2):

Subtropical Humid Mild Summer (CHB2):  
Dublin, Ireland	(today)  
Luxembourg, Luxembourg	(today)  
Bern, Switzerland	(today)  

Subtropical Semihumid Mild Summer (CGB2):  
Paris, France	(today)  
London, United Kingdom	(today)  
Canberra, Australia	(today)  
Brussels, Belgium	(today)  
Copenhagen, Denmark	(today)  
Berlin, Germany	(today)  
Amsterdam, Netherlands	(today)  

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
Kansas City, MO–KS	(today)  

Temperate Semihumid Very Hot Summer (DGA2):  
St. Louis, MO–IL	(today)  
Topeka, KS	(today)  
Jefferson City, MO	(today)  
Lincoln, NE	(today)  

Temperate Monsoon Very Hot Summer (DWA2):  
Seoul–Incheon, South Korea	(today)  
Beijing, China	(today)  
Tianjin, China	(today)  

Temperate Semiarid Very Hot Summer (DSA2):  
Salt Lake City, UT	(today)  
Pierre, SD	(today)  

Temperate Arid Desert Very Hot Summer (DDA2):  
Tehran, Iran	(today)  

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
Continental Monsoon Hot Summer (EWA1):  
Bismarck, ND	(today)  
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




