const grid = document.getElementById("grid");
const search = document.getElementById("search");
const folderFiltersEl = document.getElementById("folder-filters");
const clearBtn = document.getElementById("clear-filters");

const bucketCountEl = document.getElementById("bucket-count");
const viewBucketBtn = document.getElementById("view-bucket");
const clearBucketBtn = document.getElementById("clear-bucket");

let images = [];
let filteredImages = [];
let expandedCard = null;
let expandedIndex = -1;
let activeFolders = new Set();
let bucketMode = false;

const BUCKET_KEY = "visual_library_bucket";
let bucket = new Set(JSON.parse(localStorage.getItem(BUCKET_KEY) || "[]"));

function saveBucket() {
  localStorage.setItem(BUCKET_KEY, JSON.stringify([...bucket]));
  bucketCountEl.textContent = `Bucket (${bucket.size})`;
}

fetch(`data.json?v=${Date.now()}`)
  .then(r => r.json())
  .then(data => {
    images = data.images || [];
    buildFolderFilters(images);
    saveBucket();
    applyFilters();
  });

search.addEventListener("input", applyFilters);
clearBtn.addEventListener("click", clearFilters);
viewBucketBtn.addEventListener("click", toggleBucketMode);
clearBucketBtn.addEventListener("click", () => {
  bucket.clear();
  saveBucket();
  applyFilters();
});

/* ---------- FOLDER FILTERS ---------- */

function buildFolderFilters(images) {
  const folders = [...new Set(images.map(img => img.folder))].sort();
  folderFiltersEl.innerHTML = "";
  activeFolders.clear();

  folders.forEach(folder => {
    const label = document.createElement("label");
    label.className = "filter-item";
    label.innerHTML = `
      <input type="checkbox" data-folder="${folder}" checked />
      <span>${folder}</span>
    `;

    const checkbox = label.querySelector("input");
    activeFolders.add(folder);

    checkbox.addEventListener("change", e => {
      if (e.target.checked) activeFolders.add(folder);
      else activeFolders.delete(folder);
      applyFilters();
    });

    folderFiltersEl.appendChild(label);
  });
}

function clearFilters() {
  search.value = "";
  activeFolders.clear();
  folderFiltersEl.querySelectorAll("input").forEach(cb => {
    cb.checked = false;
  });
  applyFilters();
}

/* ---------- BUCKET MODE ---------- */

function toggleBucketMode() {
  bucketMode = !bucketMode;
  viewBucketBtn.textContent = bucketMode ? "Exit Bucket" : "View Bucket";
  applyFilters();
}

/* ---------- FILTERING ---------- */

function applyFilters() {
  const q = (search.value || "").toLowerCase();

  filteredImages = images.filter(img => {
    if (bucketMode && !bucket.has(img.file)) return false;
    if (!bucketMode && !activeFolders.has(img.folder)) return false;

    const tags = Array.isArray(img.tags) ? img.tags.join(" ").toLowerCase() : "";
    const notes = (img.notes || "").toLowerCase();
    const lens = (img.lens || "").toLowerCase();
    const folder = (img.folder || "").toLowerCase();

    return (
      tags.includes(q) ||
      notes.includes(q) ||
      lens.includes(q) ||
      folder.includes(q)
    );
  });

  render(filteredImages);
}

/* ---------- RENDER ---------- */

function render(list) {
  grid.innerHTML = "";
  expandedCard = null;
  expandedIndex = -1;

  list.forEach((img, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const inBucket = bucket.has(img.file);

    card.innerHTML = `
      <div class="bucket-icon ${inBucket ? "active" : ""}" data-file="${img.file}">
        📚
      </div>
      <img src="${img.file}" alt="" />
      <div class="meta">
        <div><strong>Folder:</strong> ${img.folder}</div>
        <div><strong>Lens:</strong> ${img.lens}</div>
        <div><strong>Lighting:</strong> ${img.lighting}</div>
        <div><strong>Tags:</strong> ${img.tags.join(", ")}</div>
        <div class="notes">${img.notes}</div>
      </div>
    `;

    card.querySelector(".bucket-icon").addEventListener("click", e => {
      e.stopPropagation();
      const file = e.target.dataset.file;
      if (bucket.has(file)) bucket.delete(file);
      else bucket.add(file);
      saveBucket();
      applyFilters();
    });

    card.addEventListener("click", () => expandAt(index));
    grid.appendChild(card);
  });
}

/* ---------- EXPANSION ---------- */

function expandAt(index) {
  const cards = Array.from(grid.children);

  if (expandedCard) expandedCard.classList.remove("expanded");

  expandedIndex = index;
  expandedCard = cards[index];
  if (!expandedCard) return;

  expandedCard.classList.add("expanded");
  expandedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------- KEYBOARD NAV ---------- */

document.addEventListener("keydown", e => {
  if (expandedIndex === -1) return;

  if (e.key === "ArrowRight" && expandedIndex < filteredImages.length - 1) {
    expandAt(expandedIndex + 1);
  }

  if (e.key === "ArrowLeft" && expandedIndex > 0) {
    expandAt(expandedIndex - 1);
  }

  if (e.key === "Escape") {
    if (expandedCard) expandedCard.classList.remove("expanded");
    expandedCard = null;
    expandedIndex = -1;
  }
});
