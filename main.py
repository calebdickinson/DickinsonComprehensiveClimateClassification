import json
import backend.create_database as create_database
import backend.format as format

def main():

    # create cities.csv
    df1900 = format.get_csv("1961-1990 normals.csv")
    df2025 = format.get_csv("2025 RCP8.5 projection.csv")
    df2100 = format.get_csv("2100 RCP 8.5 projection.csv")
    dfcities = format.generate_cities_list(df1900, df2025, df2100)
    dfcities.to_csv("cities.csv", index=False)

    # create data.json
    data = create_database.generate_json() #type:ignore
    with open("data/data.json", "w") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    main()
