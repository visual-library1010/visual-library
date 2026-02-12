const grid = document.getElementById("grid");
const search = document.getElementById("search");
const folderFiltersEl = document.getElementById("folder-filters");
const clearBtn = document.getElementById("clear-filters");

let images = [];
let filteredImages = [];
let expandedCard = null;
let expandedIndex = -1;
let activeFolders = new Set();

fetch(`data.json?v=${Date.now()}`)
  .then(r => r.json())
  .then(data => {
    images = data.images || [];
    buildFolderFilters(images);
    applyFilters();
  });

search.addEventListener("input", applyFilters);
clearBtn.addEventListener("click", clearFilters);

/* ---------- FILTERS ---------- */

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

  folderFiltersEl
    .querySelectorAll("input[type=checkbox]")
    .forEach(cb => {
      cb.checked = false;
    });

  applyFilters();
}

function applyFilters() {
  const q = (search.value || "").toLowerCase();

  filteredImages = images.filter(img => {
    if (!activeFolders.has(img.folder)) return false;

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
    card.innerHTML = `
      <img src="${img.file}" alt="" />
      <div class="meta">
        <div><strong>Folder:</strong> ${img.folder}</div>
        <div><strong>Lens:</strong> ${img.lens}</div>
        <div><strong>Lighting:</strong> ${img.lighting}</div>
        <div><strong>Tags:</strong> ${img.tags.join(", ")}</div>
        <div class="notes">${img.notes}</div>
      </div>
    `;

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

