const PRODUCTION_API = "https://streamsaver-api.orzn.app";
const API_BASE =
  location.protocol === "file:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : PRODUCTION_API;

const form = document.getElementById("search-form");
const queryEl = document.getElementById("q");
const searchButton = document.getElementById("search-button");
const errorEl = document.getElementById("error");
const statusEl = document.getElementById("results-status");
const gridEl = document.getElementById("results-grid");

const overlay = document.getElementById("watch-overlay");
const backdrop = document.getElementById("watch-backdrop");
const closeBtn = document.getElementById("watch-close");
const playerEl = document.getElementById("watch-player");
const titleEl = document.getElementById("watch-title");
const metaEl = document.getElementById("watch-meta");
const watchErrorEl = document.getElementById("watch-error");
const formatEl = document.getElementById("watch-format");
const downloadBtn = document.getElementById("watch-download");

let currentVideo = null;
let infoAbort = null;

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function formatViews(count) {
  const n = Number(count) || 0;
  if (n >= 1_000_000_000) return `${trimNum(n / 1_000_000_000)}B views`;
  if (n >= 1_000_000) return `${trimNum(n / 1_000_000)}M views`;
  if (n >= 1_000) return `${trimNum(n / 1_000)}K views`;
  return `${n} views`;
}

function trimNum(value) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function videoMeta(video) {
  return [video.author?.name, formatViews(video.views), video.ago]
    .filter(Boolean)
    .join(" · ");
}

function skeletonCard() {
  const card = document.createElement("div");
  card.className = "animate-pulse";
  card.innerHTML = `
    <div class="aspect-video rounded-xl bg-zinc-800"></div>
    <div class="mt-3 h-4 w-5/6 rounded bg-zinc-800"></div>
    <div class="mt-2 h-3 w-1/2 rounded bg-zinc-800"></div>
  `;
  return card;
}

function videoCard(video) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "group w-full text-left";
  button.setAttribute("data-video-id", video.videoId);

  const thumbWrap = document.createElement("div");
  thumbWrap.className =
    "relative aspect-video overflow-hidden rounded-xl bg-zinc-900";

  const img = document.createElement("img");
  img.src = video.thumbnail;
  img.alt = video.title;
  img.className =
    "h-full w-full object-cover transition duration-200 group-hover:scale-[1.03] group-hover:brightness-75";

  const play = document.createElement("span");
  play.className =
    "pointer-events-none absolute inset-0 hidden items-center justify-center group-hover:flex";
  play.innerHTML =
    '<span class="material-symbols-outlined text-[56px] text-white drop-shadow">play_circle</span>';

  thumbWrap.append(img, play);

  if (video.timestamp) {
    const duration = document.createElement("span");
    duration.className =
      "absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white";
    duration.textContent = video.timestamp;
    thumbWrap.append(duration);
  }

  const body = document.createElement("div");
  body.className = "mt-3";

  const title = document.createElement("h3");
  title.className = "line-clamp-2 text-sm font-semibold leading-snug text-white";
  title.textContent = video.title;

  const meta = document.createElement("p");
  meta.className = "mt-1 text-xs text-zinc-400";
  meta.textContent = videoMeta(video);

  body.append(title, meta);
  button.append(thumbWrap, body);
  button.addEventListener("click", () => openWatch(video));
  return button;
}

function renderSkeletons() {
  gridEl.replaceChildren(...Array.from({ length: 8 }, skeletonCard));
}

function renderVideos(videos) {
  gridEl.replaceChildren(...videos.map(videoCard));
}

async function runSearch(query, { pushUrl = true } = {}) {
  clearError();
  statusEl.classList.remove("hidden");
  statusEl.textContent = "Searching…";
  searchButton.disabled = true;
  renderSkeletons();

  if (pushUrl) {
    const next = new URL(location.href);
    next.searchParams.set("q", query);
    history.replaceState(null, "", next);
  }

  try {
    const response = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Search failed");
    }
    const videos = data.videos || [];
    statusEl.textContent = `${videos.length} videos for “${data.query}”`;
    renderVideos(videos);
  } catch (error) {
    gridEl.replaceChildren();
    statusEl.classList.add("hidden");
    showError(error.message || "Search failed");
  } finally {
    searchButton.disabled = false;
  }
}

function showWatchError(message) {
  watchErrorEl.textContent = message;
  watchErrorEl.classList.toggle("hidden", !message);
}

function closeWatch() {
  if (infoAbort) infoAbort.abort();
  overlay.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  playerEl.replaceChildren();
  currentVideo = null;
  formatEl.innerHTML = "";
  downloadBtn.disabled = true;
}

function playEmbed(container, video) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=1`;
  iframe.className = "h-full w-full";
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.title = video.title;
  container.replaceChildren(iframe);
}

async function openWatch(video) {
  currentVideo = video;
  overlay.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  titleEl.textContent = video.title;
  metaEl.textContent = videoMeta(video);
  formatEl.innerHTML = "";
  downloadBtn.disabled = true;
  showWatchError("");

  playerEl.replaceChildren();
  const loading = document.createElement("div");
  loading.className =
    "absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-sm text-zinc-300";
  loading.textContent = "Loading stream…";

  const videoEl = document.createElement("video");
  videoEl.controls = true;
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.className = "h-full w-full bg-black object-contain";
  videoEl.poster = video.thumbnail || "";
  playerEl.classList.add("relative");
  playerEl.append(videoEl, loading);

  if (infoAbort) infoAbort.abort();
  infoAbort = new AbortController();

  try {
    const params = new URLSearchParams({
      url: video.url,
      platform: "youtube",
    });
    const response = await fetch(`${API_BASE}/info?${params}`, {
      signal: infoAbort.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Could not load stream");
    }

    loading.remove();

    formatEl.innerHTML = (data.formats || [])
      .map(
        (format) =>
          `<option value="${format.id}">${format.label}</option>`,
      )
      .join("");
    downloadBtn.disabled = !formatEl.value;

    if (data.previewUrl) {
      videoEl.src = data.previewUrl;
      videoEl.addEventListener("error", () => {
        if (!video.videoId || playerEl.querySelector("iframe")) return;
        playEmbed(playerEl, video);
      });
    } else if (video.videoId) {
      playEmbed(playerEl, video);
    } else {
      showWatchError("No stream URL. You can still download this video.");
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    loading.remove();
    showWatchError(error.message || "Could not load stream");
    formatEl.innerHTML = '<option value="mp4">MP4 · video</option>';
    downloadBtn.disabled = false;
    if (video.videoId) playEmbed(playerEl, video);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = queryEl.value.trim();
  if (query) runSearch(query);
});

downloadBtn.addEventListener("click", () => {
  if (!currentVideo?.url || !formatEl.value) return;
  const params = new URLSearchParams({
    url: currentVideo.url,
    id: formatEl.value,
    platform: "youtube",
  });
  window.location.href = `${API_BASE}/download?${params}`;
});

backdrop.addEventListener("click", closeWatch);
closeBtn.addEventListener("click", closeWatch);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
    closeWatch();
  }
});

const initialQuery = new URLSearchParams(location.search).get("q");
if (initialQuery) {
  queryEl.value = initialQuery;
  runSearch(initialQuery, { pushUrl: false });
}
