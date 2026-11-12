#!/usr/bin/env python3
"""Check the documented 36-row SMB Loan survival extract; no third-party packages."""

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


CSV_URL = "https://smbloan.com.au/research-data/business-survival-atlas-june-2026.csv"
WORKBOOK_URL = (
    "https://www.abs.gov.au/statistics/economy/business-indicators/"
    "counts-australian-businesses-including-entries-and-exits/"
    "jul2022-jun2026/8165DC01.xlsx"
)
COHORT = "2022-23 entries to June 2026"
CHECKED = "2026-10-10"
LIMIT = 1_000_000
HEADERS = [
    "dimension", "category", "entrants_2022_23", "survived_june_2026",
    "three_year_survival_pct", "cohort", "source", "checked",
]
TABLES = {"industry": 3, "state": 6, "employment": 16}
DIMENSION_ROWS = {"industry": 20, "state": 9, "employment": 7}
TOTALS = {"industry": "All Industries", "state": "Australia", "employment": "Total"}
REFERENCE_COUNTS = {
    ("industry", "All Industries"): (406365, 199742),
    ("state", "Australia"): (406365, 199742),
    ("employment", "Total"): (406365, 199742),
    ("state", "Western Australia"): (37310, 19113),
    ("employment", "Non-employing"): (297302, 132708),
    ("employment", "20–199"): (1189, 840),
    ("employment", "200+"): (69, 54),
}


def integer(value, field, line):
    if not re.fullmatch(r"[0-9]+", value or ""):
        raise ValueError(f"Line {line}: {field} must be an unsigned integer")
    return int(value)


def inspect_csv(data):
    """Return validation evidence or raise ValueError; never sum overlapping rows."""
    if len(data) > LIMIT:
        raise ValueError("CSV exceeds the 1 MB safety limit")
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("Expected UTF-8 CSV") from exc
    reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
    if reader.fieldnames != HEADERS:
        raise ValueError("Unexpected CSV header; the response may be HTML or a different edition")
    counts = Counter()
    seen = set()
    values = {}
    for row in reader:
        line = reader.line_num
        if None in row or any(value is None for value in row.values()):
            raise ValueError(f"Line {line}: incorrect column count")
        dimension, category = row["dimension"], row["category"]
        if dimension not in TABLES or not category.strip():
            raise ValueError(f"Line {line}: unknown dimension or empty category")
        key = (dimension, unicodedata.normalize("NFKC", category).strip().casefold())
        if key in seen:
            raise ValueError(f"Line {line}: duplicate dimension/category key")
        seen.add(key)
        counts[dimension] += 1
        if row["cohort"] != COHORT or row["checked"] != CHECKED:
            raise ValueError(f"Line {line}: unexpected cohort or edition date")
        if row["source"] != f"{WORKBOOK_URL}#Table-{TABLES[dimension]}":
            raise ValueError(f"Line {line}: unexpected source reference")
        entrants = integer(row["entrants_2022_23"], "entrants", line)
        survived = integer(row["survived_june_2026"], "survivors", line)
        if entrants <= 0 or survived > entrants:
            raise ValueError(f"Line {line}: require positive entrants and 0 <= survivors <= entrants")
        try:
            rate = Decimal(row["three_year_survival_pct"])
        except InvalidOperation as exc:
            raise ValueError(f"Line {line}: invalid percentage") from exc
        if not rate.is_finite() or not Decimal(0) <= rate <= Decimal(100):
            raise ValueError(f"Line {line}: percentage must be finite and between 0 and 100")
        calculated = (Decimal(survived) * 100 / Decimal(entrants)).quantize(
            Decimal("0.1"), rounding=ROUND_HALF_UP
        )
        if rate != calculated:
            raise ValueError(f"Line {line}: percentage {rate} does not match calculated {calculated}")
        values[(dimension, category)] = (entrants, survived)
    if dict(counts) != DIMENSION_ROWS:
        raise ValueError(f"Unexpected dimension row counts: {dict(counts)}")
    for key, expected in REFERENCE_COUNTS.items():
        if values.get(key) != expected:
            raise ValueError(f"Reference count mismatch or missing category: {key}")
    return {
        "status": "passed",
        "cohort": COHORT,
        "csv_checked_field": CHECKED,
        "rows_checked": sum(counts.values()),
        "dimension_rows": dict(counts),
        "unique_dimension_category_keys": len(seen),
        "rate_rounding": "Counts divided, multiplied by 100, rounded to one decimal (half up)",
        "overlapping_national_totals": [
            {"dimension": dimension, "category": category, "entrants": values[(dimension, category)][0],
             "survivors": values[(dimension, category)][1]}
            for dimension, category in TOTALS.items()
        ],
        "warnings": [
            "Dimensions overlap: do not sum industry, state and employment rows together.",
            "Employment includes Total employing and Total as well as component categories.",
            "Selected categories need not constitute every category in the original workbook.",
            "This validates CSV arithmetic and fixed reference counts, not the administrative records or every source-cell transcription.",
        ],
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    }


def download_csv():
    request = Request(CSV_URL, headers={
        "User-Agent": "SMBLoanSurvivalNotes/1.0 (public CSV verification)",
        "Accept": "text/csv,text/plain;q=0.9",
    })
    with urlopen(request, timeout=30) as response:
        final_url = urlsplit(response.geturl())
        if response.status != 200 or final_url.scheme != "https" or final_url.hostname not in {
            "smbloan.com.au", "www.smbloan.com.au"
        }:
            raise ValueError("Download did not return HTTP 200 from the expected HTTPS source")
        if "html" in response.headers.get("Content-Type", "").lower():
            raise ValueError("Source returned HTML instead of CSV; download manually when available")
        data = response.read(LIMIT + 1)
    if len(data) > LIMIT:
        raise ValueError("Download exceeds the 1 MB safety limit")
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--csv", type=Path, help="check an existing CSV; no network request")
    source.add_argument("--download", action="store_true", help="explicitly fetch the public CSV; keep bytes in memory")
    args = parser.parse_args()
    try:
        if args.download:
            data = download_csv()
        else:
            with args.csv.open("rb") as handle:
                data = handle.read(LIMIT + 1)
        result = inspect_csv(data)
        result["input"] = CSV_URL if args.download else str(args.csv)
        result["checked_at_utc"] = datetime.now(timezone.utc).isoformat()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except (OSError, ValueError, csv.Error) as exc:
        print(json.dumps({"status": "failed", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
