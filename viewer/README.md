# James Waring Exhibition Viewer

Static HTML/CSS/JS viewer for `James Waring current version final.xlsx`.
It serves images from Google Drive first, then falls back to local files from
`Waring-thumbnails586` when Drive does not return an image.

## Run It

```sh
cd viewer
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Refresh The Data

If the spreadsheet changes, export or download it again as
`James Waring current version final.xlsx`, then run:

```sh
cd viewer
python3 generate-data.py
```

The generator preserves the hidden Google Drive links behind the spreadsheet's
`View Thumbnail` cells and also records matching local image filenames when they
exist.

For Drive-hosted images to render in a browser, the Drive files need to be
shared so the viewer can fetch them without an interactive sign-in prompt.
