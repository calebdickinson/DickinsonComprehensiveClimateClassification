(head -n 1 "1961-1900 normals.csv" && tail -n +2 "1961-1900 normals.csv" | sort -t, -k1) > "1960-1900 normals.csv"
(head -n 1 "2025 RCP8.5 projection.csv" && tail -n +2 "2025 RCP8.5 projection.csv" | sort -t, -k1) > "2025 RCP8.5 projection.csv"
(head -n 1 "2100 RCP 8.5 projection.csv" && tail -n +2 "2100 RCP 8.5 projection.csv" | sort -t, -k1) > "2100 RCP 8.5 projection.csv"