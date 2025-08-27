import json
import backend.create_database as create_database

def main():
    data = create_database.generate_json() #type:ignore
    with open("data/data.json", "w") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    main()

# right now this just automatically updates data/data.json
# given time I should also add a function that stitches together the pieces in backend/format.py
# to automatically update data/cities.json after Caleb's Google Earth Engine stuff runs
# however since school's about to start, until then, we can use Excel or something like that to format his data
# into the data/cities.csv format (must be that exact format) if he runs another sim and gets new data