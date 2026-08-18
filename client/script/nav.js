const PLATFORMS = [
  { id: "all", href: "./index.html", label: "All media" },
  { id: "youtube", href: "./youtube.html", label: "YouTube" },
  { id: "instagram", href: "./instagram.html", label: "Instagram" },
  { id: "tiktok", href: "./tiktok.html", label: "TikTok" },
  { id: "facebook", href: "./facebook.html", label: "Facebook" },
  { id: "twitter", href: "./twitter.html", label: "Twitter / X" },
  { id: "pinterest", href: "./pinterest.html", label: "Pinterest" },
  { id: "threads", href: "./threads.html", label: "Threads" },
  { id: "douyin", href: "./douyin.html", label: "Douyin" },
  { id: "xiaohongshu", href: "./xiaohongshu.html", label: "Xiaohongshu" },
  { id: "xiaohongshu-profile", href: "./xiaohongshu-profile.html", label: "XHS Profile" },
  { id: "snackvideo", href: "./snackvideo.html", label: "SnackVideo" },
  { id: "cocofun", href: "./cocofun.html", label: "Cocofun" },
  { id: "kuaishou", href: "./kuaishou.html", label: "Kuaishou" },
  { id: "capcut", href: "./capcut.html", label: "CapCut" },
  { id: "gdrive", href: "./gdrive.html", label: "Google Drive" },
  { id: "mediafire", href: "./mediafire.html", label: "MediaFire" },
  { id: "spotify", href: "./spotify.html", label: "Spotify" },
  { id: "soundcloud", href: "./soundcloud.html", label: "SoundCloud" },
  { id: "yts", href: "./yts.html", label: "YouTube Search" },
];

function platformLinkClass(active) {
  return [
    "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition",
    active
      ? "bg-rose-500/15 font-medium text-rose-300"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
  ].join(" ");
}

function docsLinkClass(active, compact = false) {
  return [
    "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
    compact ? "w-full" : "",
    active
      ? "border-rose-400 bg-rose-500 text-white"
      : "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-200",
  ].join(" ");
}

function renderMobileLinks(activeId) {
  return PLATFORMS.map((link) => {
    const current = link.id === activeId;
    return `<a href="${link.href}" class="${platformLinkClass(current)}" ${current ? 'aria-current="page"' : ""}>${link.label}</a>`;
  }).join("");
}

function renderSelectOptions(activeId) {
  return PLATFORMS.map((link) => {
    const selected = link.id === activeId ? "selected" : "";
    return `<option value="${link.href}" ${selected}>${link.label}</option>`;
  }).join("");
}

const headerRoot = document.getElementById("site-header");
if (!headerRoot) {
  throw new Error("Missing #site-header");
}

const activeId = document.body.dataset.platform || "";
const docsActive = activeId === "docs";

document.body.classList.add("flex", "flex-col");
const main = document.querySelector("main");
if (main) main.classList.add("flex-1", "w-full");

headerRoot.innerHTML = `
  <header class="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
      <a href="./index.html" class="shrink-0 text-sm font-semibold tracking-tight text-white">
        Stream saver
      </a>

      <div class="ml-auto hidden items-center gap-3 lg:flex">
        <label class="relative block">
          <span class="sr-only">Choose platform</span>
          <select
            id="platform-select"
            class="min-w-[12.5rem] appearance-none rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-3 pr-10 text-sm text-white outline-none ring-rose-500/40 hover:border-zinc-500 focus:border-rose-500 focus:ring-2"
          >
            ${docsActive ? '<option value="" disabled selected>Select platform</option>' : ""}
            ${renderSelectOptions(activeId)}
          </select>
          <span class="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[20px] text-zinc-400">expand_more</span>
        </label>
        <a
          href="./docs.html"
          class="${docsLinkClass(docsActive)}"
          ${docsActive ? 'aria-current="page"' : ""}
        >
          <span class="material-symbols-outlined text-[18px]">menu_book</span>
          API Reference
        </a>
      </div>

      <button
        id="nav-toggle"
        type="button"
        class="ml-auto inline-flex items-center justify-center rounded-lg p-2 text-zinc-200 hover:bg-zinc-800 lg:hidden"
        aria-expanded="false"
        aria-controls="nav-drawer"
        aria-label="Open menu"
      >
        <span id="nav-toggle-icon" class="material-symbols-outlined text-[22px]">menu</span>
      </button>
    </div>
    <div id="nav-drawer" class="hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
      <nav class="grid grid-cols-2 gap-1 sm:grid-cols-3">
        ${renderMobileLinks(activeId)}
      </nav>
      <a
        href="./docs.html"
        class="${docsLinkClass(docsActive, true)} mt-3"
        ${docsActive ? 'aria-current="page"' : ""}
      >
        <span class="material-symbols-outlined text-[18px]">menu_book</span>
        API Reference
      </a>
    </div>
  </header>
`;

const footer = document.createElement("footer");
footer.className = "relative mt-auto border-t border-zinc-800 bg-zinc-950/90";
footer.innerHTML = `
  <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
    <p class="text-sm text-zinc-400">
      Built by <span class="font-medium text-white">Gift Jacksun</span>
    </p>
    <a
      href="https://github.com/learnwithjacksun"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
    >
      <span class="material-symbols-outlined text-[18px]">code</span>
      @learnwithjacksun
    </a>
  </div>
`;
document.body.append(footer);

const toggle = document.getElementById("nav-toggle");
const drawer = document.getElementById("nav-drawer");
const icon = document.getElementById("nav-toggle-icon");
const platformSelect = document.getElementById("platform-select");

toggle.addEventListener("click", () => {
  const open = drawer.classList.toggle("hidden") === false;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  icon.textContent = open ? "close" : "menu";
});

platformSelect.addEventListener("change", (event) => {
  const href = event.target.value;
  if (href) window.location.href = href;
});
