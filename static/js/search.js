// Site search: Fuse.js (Apache-2.0, static/js/LICENSE-fuse.txt) over /index.json.
// Open with the header button, Ctrl/Cmd+K, or "/". Index + library load on first open.
(() => {
  const dlg = document.getElementById("search");
  const input = document.getElementById("search-input");
  const list = document.getElementById("search-results");
  const status = document.getElementById("search-status");
  if (!dlg || !input || !list) return;

  let fuse = null, loading = null, active = -1;

  const load = () => loading ||= Promise.all([
    import(dlg.dataset.fuse).then(m => m.default),
    fetch(dlg.dataset.index).then(r => r.json()),
  ]).then(([Fuse, docs]) => {
    fuse = new Fuse(docs, {
      keys: [
        { name: "title", weight: 3 },
        { name: "people", weight: 2 },
        { name: "tags", weight: 1.5 },
        { name: "summary", weight: 1 },
        { name: "content", weight: 0.5 },
      ],
      ignoreLocation: true,
      threshold: 0.35,
      minMatchCharLength: 2,
    });
  });

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const render = () => {
    const q = input.value.trim();
    active = -1;
    if (!fuse || q.length < 2) { list.innerHTML = ""; status.textContent = ""; return; }
    const hits = fuse.search(q, { limit: 10 });
    status.textContent = hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "No results";
    list.innerHTML = hits.map(({ item }) => `
      <li><a href="${esc(item.url)}">
        <span class="sr-title">${esc(item.title)}</span>
        <span class="sr-meta">${esc(item.section)}${item.people ? " · " + esc(item.people) : ""}</span>
        ${item.summary ? `<span class="sr-summary">${esc(item.summary)}</span>` : ""}
      </a></li>`).join("");
  };

  const move = d => {
    const links = [...list.querySelectorAll("a")];
    if (!links.length) return;
    active = (active + d + links.length) % links.length;
    links.forEach((a, i) => a.classList.toggle("active", i === active));
    links[active].scrollIntoView({ block: "nearest" });
  };

  const open = () => {
    if (!dlg.open) dlg.showModal();
    input.select();
    load().then(render).catch(() => { status.textContent = "Search failed to load."; });
  };

  document.querySelectorAll("[data-search-open]").forEach(b => b.addEventListener("click", open));
  document.addEventListener("keydown", e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); open(); }
  });
  input.addEventListener("input", render);
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      const a = list.querySelectorAll("a")[Math.max(active, 0)];
      if (a) { e.preventDefault(); location.href = a.href; }
    }
  });
  // click on the backdrop closes
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
})();
