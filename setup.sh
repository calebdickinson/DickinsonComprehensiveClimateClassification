# if you do not have Python3 installed, then
# run this command: brew install python3
# (if you don't have Homebrew installed, go to their website and install it)

# if you haven't yet, git clone the repo to your machine
# then navigate into the folder of the repo in your terminal
# now run this command: chmod +x setup.sh
# then run this command: ./setup.sh

# this will set up the virtual environment for your folder, 
# permit the other scripts in the folder to run,
# and launch the localhost

# in the future you should run ./start.sh to activate your virtual environment
# and ./localhost.sh to launch the localhost

# this and all other shell scripts are written for Mac (and will probably work on Linux)
# if you run Windows, I recommend WSL2 (Windows Subsystem for Linux)
# if you don't want to use that, you'll need to make your own scripts

python3 -m venv venv # set up virtual environment
source venv/bin/activate
pip install -r requirements.txt

# shellcheck disable=SC2035
chmod +x *.sh # activate other scripts

# when you are done coding, deactivate your virtual environment 
# by running this command: deactivate
# we probably don't need a script for that