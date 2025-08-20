*This guide is written for macOS and will probably also work on Linux. If you use Windows an online tutorial about how to use github and how to use python on your device will work just as well.*

In your terminal, copy-paste this command and hit `ENTER`:

`git clone https://github.com/calebdickinson/DickinsonComprehensiveClimateClassification.git`

This downloads the project onto your device. Now, enter these commands in order:

`cd DickinsonComprehensiveClimateClassification`

`chmod +x setup.sh`

`./setup.sh`

Now go to your browser and input `http://localhost:8000` into the address bar. 

You should now see the website.

When you are done coding, run `deactivate` in the terminal. 

Now, whenever you code, run `./start.sh` at the beginning of your session and `deactivate` at the end.

More details on what exactly you're doing are in the comments of `setup.sh` and `start.sh`. Those files are sitting in your `DickinsonComprehensiveClimateClassification` folder. 


When you want to upload code back to the website, run these commands in order:

`git pull`

`git add -A`

`git commit -m "generic commit message"`

`git push`

If you cannot push to the project, please reach out to @calebdickinson to ask for access.

Enjoy!