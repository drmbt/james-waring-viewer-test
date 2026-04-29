#!/usr/bin/env python3
"""Generate viewer/data.json from the James Waring spreadsheet."""

from __future__ import annotations

import json
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = ROOT / "James Waring current version final.xlsx"
OUTPUT = Path(__file__).resolve().parent / "data.json"

FIELD_MAP = {
    "File Name": "fileName",
    "Thumbnail Link": "thumbnailLink",
    "Name / Caption": "nameCaption",
    "Photo": "photo",
    "Year": "year",
    "Copyright": "copyright",
    "Description": "description",
    "Comment": "comment",
}


def clean(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def main() -> None:
    workbook = load_workbook(WORKBOOK, data_only=True)
    sheet = workbook.active
    headers = [clean(cell.value) for cell in sheet[1]]
    rows = []

    for spreadsheet_row, row in enumerate(sheet.iter_rows(min_row=2), start=2):
        item = {"spreadsheetRow": spreadsheet_row}

        for index, cell in enumerate(row):
            if index >= len(headers):
                continue

            key = FIELD_MAP.get(headers[index])
            if not key:
                continue

            value = clean(cell.value)
            if key == "thumbnailLink" and cell.hyperlink:
                value = cell.hyperlink.target
            item[key] = value

        if item.get("fileName"):
            rows.append(item)

    OUTPUT.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
