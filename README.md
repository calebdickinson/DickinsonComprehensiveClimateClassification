# DICKINSON COMPREHENSIVE CLIMATE CLASSIFICATION SYSTEM

https://www.dickinsonclimate.com/


## How it works

Note: much of this workflow is very much out of date and has yet to be updated.

The Dickinson climate classification is a new climate classification system inspired by the Köppen system, developed and maintained by Caleb Dickinson.

Unlike the Köppen system, the Dickinson system contains hundreds of possible climates, many of which are hypothetical. 
This allows the Dickinson system to accurately describe hypothetical climates that may occur in the future due to climate change, but do not currently exist on Earth. 
This will be useful in the future as humans continue to warm the Earth with fossil fuels.</p>

Being more generally more granular than the Köppen system, the Dickinson system better illustrates the differences between each of the new extreme climates we will see in the future, as well as the climates we see today.
Edge cases illustrate some interesting climate factors not measured in the Köppen system.</p>

The Dickinson system encodes each climate in 3 (or 2) parts, depending on whether an aridity value is included.
Aridity is not relevant to extremely hot and cold climates. 
We omit the aridity score in climates that fall within subarctic, arctic, superarctic, cold summer, very cold summer, freezing summer, or frigid summer zones.

- The first value in the climate code represents the average temperature of the coldest month.
- The second value (if aridity is included) represents the aridity zone, which is measured using evapotranspiration (see https://www.dickinsonclimate.com/classification.html).
- The final value represents the average temperature of the warmest month.

### Coldest Month

| Code | Name            | Temperature Range (Celsius) |
|:-----|:----------------|:----------------------------|
| H    | Hypercaneal     | 50 and above (hypothetical) |
| X    | Uninhabitable   | 40 - 50      (hypothetical) |
| Z    | Hyperequatorial | 30 - 40                     |
| A    | Equatorial      | 20 - 30                     |
| B    | Tropical        | 10 - 20                     |
| C    | Subtropical     | 0 - 10                      |
| D    | Temperate       | -10 - 0                     |
| E    | Continental     | -20 - -10                   |
| F    | Subarctic       | -30 - -20                   |
| G    | Arctic          | -40 - -30                   |
| Y    | Superarctic     | Below -40                   |

### Aridity

| Code | Name          |
|:-----|:--------------|
| H    | Humid         |
| G    | Semihumid     |
| W    | Monsoon       |
| M    | Mediterranean |
| S    | Semiarid      |
| D    | Arid          |

### Hottest Month

| Code | Name                | Temperature Range (Celsius) |
|:-----|:--------------------|:----------------------------|
| H    | Hypercaneal Summer  | 50 and above (hypothetical) |
| X    | Hyperthermal Summer | 40 - 50                     |
| Z2   | Scorching Summer    | 35 - 40                     |
| Z1   | Very Hot Summer     | 30 - 35                     |
| A2   | Hot Summer          | 25 - 30                     |
| A1   | Warm Summer         | 20 - 25                     |
| B2   | Cool Summer         | 15 - 20                     |
| B1   | Cold Summer         | 10 - 15                     |
| C2   | Very Cold Summer    | 5 - 10                      |
| C1   | Freezing Summer     | 0 - 5                       |
| Y    | Frigid Summer       | Below 0                     |


# How to run the JavaScript Google Earth Engine files in this repository

1. Open two Earth Engine Code Editor windows. It may be necessary to make an account with Google Earth Engine.
2. Paste the full code of the most up-to-date versions, `AllZonesTogether.js` and `AllZonesTogether2100.js`, separately in the New Script boxes of each of the windows. These files can be found in the MapMakers folder of this GitHub repository.
3. Click the "run" button. This will generate a current climate map and a map of the climate as projected for the year 2100 in NASA's RCP8.5 "business as usual" global warming/climate change projections.

<img src="images/screenshot.png" alt=""/>

- All locations on the maps are organized and color-coded according to the Dickinson climate classification.
- Clicking on any location of the map will result in the climate classification being shown directly below the "Click map for classification" on the bottom right.
- Some of these functionalities and category displays may take some time to load.
- You can also filter by climate codes using the bottom-right dropdown menu.
- A graph to the top right displays selected cities, organized by climate classification.
- You can get climate data on more cities by adding to the `cityList` displayed in this graph.
- Keep in mind that due to the limitations of the resolution of the data, some small remote islands and/or extremely mountainous areas may not be exactly rendered according to their true classification.
- If you want a different range of years, edit the first couple of lines of the code to generate a new year range, if the range is included in the NASA/NEX-GDDP or ECMWF/ERA5 datasets.

# How to generate a website-ready database from the Google Earth Engine outputs
*This guide is written for macOS and will probably also work on Linux* 

### Installation
In your terminal, copy-paste this command and hit `ENTER`:

`git clone https://github.com/calebdickinson/DickinsonComprehensiveClimateClassification.git`

Then enter this command:

`ls`

At this point, you should see a folder titled `DickinsonComprehensiveClimateClassification`. 


### Setup

Now, enter these commands in order:

`cd DickinsonComprehensiveClimateClassification` 

`chmod +x setup.sh` 

`./setup.sh`

Go to your browser and input `http://localhost:8000` into the address bar.

At this point, you should see a local version of the website in your browser.


### Editing

When you are done for the day, run `deactivate` in the terminal.

Now, whenever you code, run `./start.sh` at the beginning of your session and `deactivate` at the end.

To add code changes to get, run these commands in the terminal:

`git pull`

`git add -A`

`git commit -m "generic commit message"`

`git push`

### Contributing
You will not be able to contribute to the project directly unless Caleb Dickinson gives you access. 
If you want to contribute, fork our project and make a pull request when your contributions are complete.
If Caleb Dickinson accepts your pull request, then your changes will be added.

# What's in the repository?

### Utilities

*These must stay in the root folder*

`.gitignore` tells git which files to ignore

`requirements.txt` tells the setup script which Python packages to install

`setup.sh` sets up your Python virtual environment

`start.sh` launches your Python virtual environment

`CNAME` tells your browser to use an alias for our website

`README.md` tells readers about this repository

#### More utilities

`OlderVersions/*` older versions of some files

`venv/*` python virtual environment, will appear if you run the project locally

### Website Databases

*Other programs generate the first one, and you don't need to edit it directly. The other ones could also be generated automatically if we built the code to do it*

`data/data.json` main database, lists climates and their characteristics. This takes info from all other databases (and some other places) and puts it in a one-stop everything-shop.

`data/cities.csv` database that lists cities and their climates at different periods

`images/*` image database (folder of images) containing maps and infographics

`images/landscape/CLIMATE.jpg` image of nature in the `CLIMATE` climate

`images/map_1900s/CLIMATE.png` map of `CLIMATE` in 1961-1990 normals

`images/map_2025/CLIMATE.png` map of `CLIMATE` in 2025

`images/map_2100/CLIMATE.png` projected map of `CLIMATE` in 2100

### Backend

*Programs that handle data*

`ClimateFiles/*` converts raw research data to lists of city climates

`MapMakers/*` converts raw research data to climate maps

`backend/format.py` converts Google Earth Engine outputs to `data/cities.csv` data

`backend/create_database.py` constructs the `data/data.json` file

`backend/climates.py` handles climate code logic

`main.py` is the Python file you will run (it calls the other files). Run it by entering `python3 main.py` in your terminal

### Frontend

*Programs that display data*

`index.html` landing page lets you search for climates by temperature

`home.html` displays the Dickinson climate classification as a set of grids of selectable climates

`classification.html` provides in-depth explanations and visualizations of how the Dickinson climate classification works

`maps.html` detailed climate maps

`about.html` information about the Dickinson climate classification

`climate.html` information about the selected climate

`css/styles.css` styles the website




