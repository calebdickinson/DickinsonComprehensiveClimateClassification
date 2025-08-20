# locally test website

# local tests are the fastest way to ensure that changes work
# (until we write unit tests)

# to run this:
# go into your terminal in the folder and enter the folder for this climate project
# run this command: ./test.sh

# to view your locally-ran test website:
# open a web browser and go to http://localhost:8000

# you may need to run this command first from the same folder to give your computer permission to run this file
# this will only be necessary the first time you run this file
# run this command first: chmod +x test.sh

python3 -m http.server 8000