const PRODUCTION_API = "https://streamsaver-api.orzn.app";
const API_BASE =
  document.querySelector(".api-base")?.textContent.trim() ||
  (location.protocol === "file:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : PRODUCTION_API);

const form = document.getElementById("preview-form");
if (form) {
  const pagePlatform = document.body.dataset.platform || "";
  const previewButton = document.getElementById("preview-button");
  const downloadButton = document.getElementById("download-button");
  const errorEl = document.getElementById("error");
  const previewCard = document.getElementById("preview-card");
  const mediaEl = document.getElementById("preview-media");
  const titleEl = document.getElementById("video-title");
  const metaEl = document.getElementById("video-meta");
  const noteEl = document.getElementById("platform-note");
  const formatEl = document.getElementById("format");

  let currentQuery = "";
  let currentPlatform = pagePlatform;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function renderPreview(data) {
    mediaEl.replaceChildren();
    const url = data.previewUrl;
    const type = data.previewType;

    if (type === "video" && url) {
      const video = document.createElement("video");
      video.controls = true;
      video.className = "h-full w-full bg-black object-contain";
      video.src = url;
      video.poster = data.thumbnail || "";
      mediaEl.append(video);
    } else if (type === "audio" && url) {
      if (data.thumbnail) {
        const img = document.createElement("img");
        img.src = data.thumbnail;
        img.alt = data.title || "Artwork";
        img.className = "h-full w-full object-cover";
        mediaEl.append(img);
      }
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.className =
        "absolute bottom-3 left-3 right-3 w-[calc(100%-1.5rem)]";
      audio.src = url;
      mediaEl.classList.add("relative");
      mediaEl.append(audio);
    } else if (url) {
      const img = document.createElement("img");
      img.src = data.thumbnail || url;
      img.alt = data.title || "Preview";
      img.className = "h-full w-full object-contain bg-black";
      mediaEl.append(img);
    } else {
      mediaEl.classList.add("flex", "items-center", "justify-center");
      mediaEl.textContent = "No visual preview";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = new FormData(form).get("url")?.toString().trim();
    if (!query) return;

    clearError();
    previewButton.disabled = true;
    previewButton.textContent = "Loading...";
    previewCard.classList.add("hidden");

    try {
      const params = new URLSearchParams({ url: query });
      if (pagePlatform && pagePlatform !== "all")
        params.set("platform", pagePlatform);
      const response = await fetch(`${API_BASE}/info?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load media info");
      }
      if (!data.formats?.length) {
        throw new Error("No downloadable formats found");
      }

      currentQuery = query;
      currentPlatform = data.platform || pagePlatform;
      titleEl.textContent = data.title;
      metaEl.textContent = [data.author, data.platform]
        .filter(Boolean)
        .join(" · ");
      if (noteEl) {
        if (
          pagePlatform &&
          pagePlatform !== "all" &&
          data.platform &&
          data.platform !== pagePlatform
        ) {
          noteEl.textContent = `This link was detected as ${data.platform}.`;
          noteEl.classList.remove("hidden");
        } else {
          noteEl.classList.add("hidden");
        }
      }
      formatEl.innerHTML = data.formats
        .map(
          (format) => `<option value="${format.id}">${format.label}</option>`,
        )
        .join("");
      renderPreview(data);
      previewCard.classList.remove("hidden");
    } catch (error) {
      showError(error.message || "Could not load preview");
    } finally {
      previewButton.disabled = false;
      previewButton.textContent = "Preview";
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!currentQuery || !formatEl.value) return;
    const params = new URLSearchParams({
      url: currentQuery,
      id: formatEl.value,
      platform: currentPlatform || pagePlatform,
    });
    window.location.href = `${API_BASE}/download?${params}`;
  });
}
