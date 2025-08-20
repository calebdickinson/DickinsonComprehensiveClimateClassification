# use virtual environment
# if this is your first time setting up the project, then
# go to the setup.sh file and run it

source venv/bin/activate
# if you want you can just run this command directly in your terminal instead

# when you are done coding, deactivate your virtual environment 
# by running this command: deactivate
# we probably don't need a script for that




# locally test website

# local tests are the fastest way to ensure that changes work
# (until we write unit tests)

# to run this:
# go into your terminal in the folder and enter the folder for this climate project
# run this command: ./test.sh

# to view your locally-ran test website:
# open a web browser and go to http://localhost:8000

python3 -m http.server 8000