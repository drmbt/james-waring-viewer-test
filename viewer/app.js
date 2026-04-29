const FIELD_LABELS = {
  nameCaption: "Name / Caption",
  fileName: "Filenames",
  photo: "Photo",
  year: "Year",
  copyright: "Copyright",
  description: "Description",
  comment: "Comment",
};

const GROUP_FIELDS = [
  "nameCaption",
  "fileName",
  "photo",
  "year",
  "copyright",
  "description",
  "comment",
];

const groupsEl = document.querySelector("#groups");
const groupCountEl = document.querySelector("#group-count");
const itemCountEl = document.querySelector("#item-count");
const searchEl = document.querySelector("#search");
const groupTemplate = document.querySelector("#group-template");
const thumbTemplate = document.querySelector("#thumb-template");

let allGroups = [];

init();

async function init() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`Could not load data.json (${response.status})`);
    }

    const rows = await response.json();
    allGroups = groupRows(rows);
    render(allGroups);
    searchEl.addEventListener("input", () => {
      const query = searchEl.value.trim().toLowerCase();
      render(filterGroups(allGroups, query));
    });
  } catch (error) {
    groupsEl.innerHTML = `<p class="empty">${error.message}</p>`;
    groupCountEl.textContent = "Unable to load viewer data";
  }
}

function groupRows(rows) {
  const byKey = new Map();

  rows.forEach((row) => {
    const key = getGroupKey(row.fileName);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        title: titleFromKey(key),
        rows: [],
        searchText: "",
      });
    }
    byKey.get(key).rows.push(row);
  });

  return [...byKey.values()].map((group) => ({
    ...group,
    searchText: [
      group.title,
      ...group.rows.flatMap((row) => Object.values(row).filter(Boolean)),
    ]
      .join(" ")
      .toLowerCase(),
  }));
}

function getGroupKey(fileName = "") {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const normalized = stem.replace(/\\_/g, "_").trim();
  const parts = normalized.split("-").filter(Boolean);

  if (parts.length <= 1) {
    return normalized || "Untitled";
  }

  const removableSuffix = /^(?:imgp|dscf|sdcf|scan|photo|image|page|frame|slide|detail|copy)?[_\s-]*\d+[a-z]?$/i;
  while (parts.length > 1 && removableSuffix.test(parts.at(-1))) {
    parts.pop();
  }

  return parts.join("-");
}

function titleFromKey(key) {
  return key
    .replace(/^(\d+)([A-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function filterGroups(groups, query) {
  if (!query) {
    return groups;
  }
  return groups.filter((group) => group.searchText.includes(query));
}

function render(groups) {
  groupsEl.replaceChildren();

  const itemCount = groups.reduce((sum, group) => sum + group.rows.length, 0);
  groupCountEl.textContent = `${groups.length.toLocaleString()} groups`;
  itemCountEl.textContent = `${itemCount.toLocaleString()} spreadsheet rows`;

  if (!groups.length) {
    groupsEl.innerHTML = '<p class="empty">No matching exhibits.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  groups.forEach((group, index) => {
    const node = groupTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".group-kicker").textContent =
      `Group ${index + 1} · ${group.rows.length} item${group.rows.length === 1 ? "" : "s"}`;
    node.querySelector("h2").textContent = group.title;

    const meta = node.querySelector(".meta");
    GROUP_FIELDS.forEach((field) => {
      const value = concatField(group.rows, field);
      if (!value) {
        return;
      }

      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const details = document.createElement("dd");
      term.textContent = FIELD_LABELS[field];
      details.textContent = value;
      wrapper.append(term, details);
      meta.append(wrapper);
    });

    const grid = node.querySelector(".thumb-grid");
    group.rows.forEach((row) => {
      grid.append(renderThumb(row));
    });

    fragment.append(node);
  });

  groupsEl.append(fragment);
}

function concatField(rows, field) {
  const values = rows
    .map((row) => normalizeValue(row[field]))
    .filter(Boolean);

  return [...new Set(values)].join("\n");
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function renderThumb(row) {
  const node = thumbTemplate.content.firstElementChild.cloneNode(true);
  const link = node.querySelector("a");
  const img = node.querySelector("img");
  const caption = node.querySelector("figcaption");
  const googleImage = googleusercontentImageUrl(row.thumbnailLink);
  const driveThumb = driveImageUrl(row.thumbnailLink);
  const imageCandidates = [googleImage, driveThumb].filter(Boolean);

  link.href = row.thumbnailLink || googleImage || driveThumb || "#";
  img.src = imageCandidates[0] || "";
  img.dataset.imageIndex = "0";
  img.referrerPolicy = "no-referrer";
  img.alt = row.nameCaption || row.fileName || "Spreadsheet image";
  img.addEventListener("error", () => {
    const nextIndex = Number(img.dataset.imageIndex || 0) + 1;
    const nextUrl = imageCandidates[nextIndex];
    if (nextUrl) {
      img.dataset.imageIndex = String(nextIndex);
      img.src = nextUrl;
      return;
    }

    img.removeAttribute("src");
    img.style.objectFit = "contain";
    img.alt = `Image unavailable: ${img.alt}`;
  });
  caption.textContent = row.fileName || "Unnamed file";

  return node;
}

function googleusercontentImageUrl(url) {
  const fileId = extractDriveId(url);
  if (!fileId) {
    return "";
  }

  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

function driveImageUrl(url) {
  const fileId = extractDriveId(url);
  if (!fileId) {
    return url || "";
  }

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

function extractDriveId(url = "") {
  return (
    url.match(/\/file\/d\/([^/]+)/)?.[1] ||
    url.match(/[?&]id=([^&]+)/)?.[1] ||
    ""
  );
}
