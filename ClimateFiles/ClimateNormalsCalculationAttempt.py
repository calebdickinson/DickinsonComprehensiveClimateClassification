# hottest_coldest_1971_2000.py
import time
import sys
import numpy as np
import xarray as xr
import rioxarray  # activates .rio accessor
import fsspec

print("Using Python:", sys.executable, flush=True)

# -----------------------------
# CONFIG
# -----------------------------
SCENARIO = "historical"
RUN = "r1i1p1"
VERSION = "v1.0"

# Start with one model for testing; add more later for the ensemble mean.
MODELS = ["inmcm4"]

# For a faster first test, you can uncomment the next 2 lines to clip to a small region:
# LAT_SLICE = slice(50, 40)        # north -> south (e.g., Pacific NW)
# LON_SLICE = slice(-130, -120)    # west -> east

# Output files
OUT_HOT  = "/Users/calebdickinson/Desktop/HottestC_1971_2000.tif"
OUT_COLD = "/Users/calebdickinson/Desktop/ColdestC_1971_2000.tif"


def open_var_model_years(var: str, model: str):
    """
    Open all NetCDFs for (var, model) from the CMIP5 NEX-GDDP S3 bucket.
    Ensures 's3://' paths so xarray uses remote IO (anonymous).
    """
    glob_path = (
        f"s3://nasanex/NEX-GDDP/BCSD/{SCENARIO}/day/atmos/{var}/{RUN}/{VERSION}/"
        f"{var}_day_BCSD_{SCENARIO}_{RUN}_{model}_*.nc"
    )
    fs = fsspec.filesystem("s3", anon=True)
    paths = fs.glob(glob_path)
    # Ensure the 's3://' prefix is present
    paths = [p if p.startswith("s3://") else f"s3://{p}" for p in paths]
    print(f"{var}/{model}: matched {len(paths)} files", flush=True)
    if not paths:
        raise FileNotFoundError(f"No files matched: {glob_path}")

    # Use h5netcdf with fsspec storage_options for anonymous access
    ds = xr.open_mfdataset(
        paths,
        engine="h5netcdf",
        combine="by_coords",
        chunks={"time": 90},
        decode_times=True,
        backend_kwargs={"storage_options": {"anon": True}},
    )

    # Restrict to 1971–2000 inclusive (matches your EE filter)
    ds = ds.sel(time=slice("1971-01-01", "2000-12-31"))
    return ds[var]


def monthly_mean_tmean_celsius(model: str):
    """Compute monthly climatology of (tasmaxC + tasminC)/2 with stage timers."""
    t0 = time.time()
    print("  Loading tasmax …", flush=True)
    tasmax = open_var_model_years("tasmax", model) - 273.15
    t1 = time.time()
    print(f"    tasmax loaded in {t1 - t0:.1f}s", flush=True)

    print("  Loading tasmin …", flush=True)
    tasmin = open_var_model_years("tasmin", model) - 273.15
    t2 = time.time()
    print(f"    tasmin loaded in {t2 - t1:.1f}s", flush=True)

    # Optional small-region clip (uncomment LAT_SLICE/LON_SLICE in CONFIG first)
    if "LAT_SLICE" in globals() and "LON_SLICE" in globals():
        print("  Clipping to small region …", flush=True)
        tasmax = tasmax.sel(lat=LAT_SLICE, lon=LON_SLICE)
        tasmin = tasmin.sel(lat=LAT_SLICE, lon=LON_SLICE)

    print("  Computing monthly means …", flush=True)
    tmean = (tasmax + tasmin) / 2.0
    monthly = tmean.groupby("time.month").mean("time").sortby("month")
    t3 = time.time()
    print(f"    monthly means computed in {t3 - t2:.1f}s", flush=True)

    monthly = monthly.assign_attrs(units="degC", long_name="monthlyMean")
    return monthly


def main():
    start_time = time.time()
    sum_monthly = None
    n_models = len(MODELS)

    for i, model in enumerate(MODELS, start=1):
        step_start = time.time()
        print(f"[{i}/{n_models}] Processing {model} …", flush=True)

        m = monthly_mean_tmean_celsius(model)
        sum_monthly = m if sum_monthly is None else xr.align(sum_monthly, m, join="exact")[0] + m

        step_end = time.time()
        elapsed = step_end - start_time
        step_dur = step_end - step_start
        avg_per_model = elapsed / i
        eta = avg_per_model * (n_models - i)
        print(
            f"  Model done in {step_dur:.1f}s | Elapsed {elapsed/60:.1f} min | ETA {eta/60:.1f} min",
            flush=True,
        )

    print("Combining ensemble and extracting extremes …", flush=True)
    ens = sum_monthly / float(n_models)
    hottestC = ens.max(dim="month").rename("hottestC").assign_attrs(units="degC")
    coldestC = ens.min(dim="month").rename("coldestC").assign_attrs(units="degC")

    print("Writing GeoTIFFs …", flush=True)
    for arr, out_path in [(hottestC, OUT_HOT), (coldestC, OUT_COLD)]:
        if "lon" not in arr.dims or "lat" not in arr.dims:
            raise RuntimeError("Expected lon/lat dims.")
        arr = (
            arr.rio.set_spatial_dims(x_dim="lon", y_dim="lat", inplace=False)
                   .rio.write_crs("EPSG:4326", inplace=False)
        )
        # Ensure latitude is descending for GeoTIFF convention
        if np.any(np.diff(arr["lat"].values) > 0):
            arr = arr.sortby("lat", ascending=False)

        t0 = time.time()
        arr.rio.to_raster(out_path, compress="DEFLATE")
        print(f"  Wrote {out_path} in {time.time() - t0:.1f}s", flush=True)

    total = time.time() - start_time
    print(f"Done. Total time: {total/60:.1f} min", flush=True)


if __name__ == "__main__":
    main()
