const PRODUCTION_API = "https://streamsaver-api.orzn.app";

function resolveApiBase() {
  if (
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:3000";
  }
  return PRODUCTION_API;
}

const API_BASE = resolveApiBase();

document.querySelectorAll(".api-base").forEach((el) => {
  el.textContent = API_BASE;
});

document.querySelectorAll("pre code").forEach((el) => {
  el.textContent = el.textContent.replaceAll("http://localhost:3000", API_BASE);
});

document.querySelectorAll(".code-block").forEach((block) => {
  const pre = block.querySelector("pre");
  if (!pre) return;

  block.className =
    "relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950";
  pre.classList.add("overflow-x-auto", "p-4", "text-sm", "font-mono");

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white";
  button.innerHTML =
    '<span class="material-symbols-outlined text-[16px]">content_copy</span>Copy';
  button.addEventListener("click", async () => {
    const text = pre.innerText;
    await navigator.clipboard.writeText(text);
    button.lastChild.textContent = "Copied";
    setTimeout(() => {
      button.lastChild.textContent = "Copy";
    }, 1200);
  });
  block.append(button);
});

if (window.hljs) {
  window.hljs.highlightAll();
}

const tryForm = document.getElementById("try-form");
const tryOutput = document.getElementById("try-output");
const tryStatus = document.getElementById("try-status");
const tryUrl = document.getElementById("try-url");
const tryExamples = document.getElementById("try-examples");

const EXAMPLES = [
  { label: "YouTube", url: "https://youtu.be/dQw4w9WgXcQ" },
  { label: "Instagram", url: "https://www.instagram.com/reel/DKPtUL_S9Nh/" },
  {
    label: "TikTok",
    url: "https://www.tiktok.com/@omagadsus/video/7025456384175017243",
  },
  {
    label: "Facebook",
    url: "https://www.facebook.com/watch/?v=1393572814172251",
  },
  {
    label: "Twitter / X",
    url: "https://twitter.com/gofoodindonesia/status/1229369819511709697",
  },
  {
    label: "SoundCloud",
    url: "https://soundcloud.com/issabella-marchelina/sisa-rasa-mahalini-official-audio",
  },
];

if (tryForm && tryUrl) {
  if (tryExamples) {
    for (const example of EXAMPLES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-rose-400 hover:text-rose-200";
      button.textContent = example.label;
      button.addEventListener("click", () => {
        tryUrl.value = example.url;
        tryUrl.focus();
      });
      tryExamples.append(button);
    }
  }

  tryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = new FormData(tryForm).get("url")?.toString().trim();
    if (!url) return;

    tryStatus.textContent = "Detecting platform…";
    try {
      const response = await fetch(
        `${API_BASE}/info?url=${encodeURIComponent(url)}`,
      );
      const data = await response.json();
      const body = JSON.stringify(data, null, 2);
      tryOutput.textContent = body;
      tryOutput.className = "language-json";
      if (window.hljs) window.hljs.highlightElement(tryOutput);
      const detected = data.platform ? ` · ${data.platform}` : "";
      tryStatus.textContent = `${response.status} ${response.statusText}${detected}`;
    } catch (error) {
      tryOutput.textContent = JSON.stringify(
        { message: error.message || "Request failed" },
        null,
        2,
      );
      tryStatus.textContent = "Request failed";
    }
  });
}
