export function safeFilename(name) {
  return (
    String(name || "download")
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .slice(0, 80) || "download"
  );
}

export async function proxyDownload(res, fileUrl, filename, mimeType) {
  const response = await fetch(fileUrl, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok || !response.body) {
    const error = new Error("Could not download media file");
    error.status = 502;
    throw error;
  }

  const type = mimeType || response.headers.get("content-type") || "application/octet-stream";
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", type);
  const length = response.headers.get("content-length");
  if (length) res.setHeader("Content-Length", length);

  for await (const chunk of response.body) {
    res.write(chunk);
  }
  res.end();
}
