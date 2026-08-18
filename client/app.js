// const API_BASE = "http://localhost:3000";
const API_BASE = "https://youtube-downloader-test-server.orzn.app";

const form = document.getElementById("preview-form");
const previewButton = document.getElementById("preview-button");
const downloadButton = document.getElementById("download-button");
const errorEl = document.getElementById("error");
const previewCard = document.getElementById("preview-card");
const embed = document.getElementById("embed");
const titleEl = document.getElementById("video-title");
const metaEl = document.getElementById("video-meta");
const formatEl = document.getElementById("format");

let currentUrl = "";

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = new FormData(form).get("url")?.toString().trim();
  if (!url) return;

  clearError();
  previewButton.disabled = true;
  previewButton.textContent = "Loading...";
  previewCard.classList.add("hidden");

  try {
    const response = await fetch(
      `${API_BASE}/info?url=${encodeURIComponent(url)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Could not load video info");
    }
    if (!data.formats?.length) {
      throw new Error("No downloadable formats found for this video");
    }

    currentUrl = url;
    embed.src = data.embedUrl;
    titleEl.textContent = data.title;
    metaEl.textContent = [data.author, formatDuration(data.duration)]
      .filter(Boolean)
      .join(" · ");
    formatEl.innerHTML = data.formats
      .map(
        (format) => `<option value="${format.itag}">${format.label}</option>`,
      )
      .join("");
    previewCard.classList.remove("hidden");
  } catch (error) {
    showError(error.message || "Could not load preview");
  } finally {
    previewButton.disabled = false;
    previewButton.textContent = "Preview";
  }
});

downloadButton.addEventListener("click", () => {
  if (!currentUrl || !formatEl.value) return;
  const downloadUrl = `${API_BASE}/download?url=${encodeURIComponent(currentUrl)}&itag=${encodeURIComponent(formatEl.value)}`;
  window.location.href = downloadUrl;
});
