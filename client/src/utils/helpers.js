export function generateVisitorId() {
  return (
    "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
}

export function getVisitorId() {
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num) {
  if (num === null || num === undefined) return 0;
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toLocaleString();
}

export function getWatchedChapters() {
  const data = localStorage.getItem("watchedChapters");
  return data ? JSON.parse(data) : {};
}

export function markChapterWatched(chapterId) {
  const watched = getWatchedChapters();
  watched[chapterId] = Date.now();
  localStorage.setItem("watchedChapters", JSON.stringify(watched));
  return watched;
}

export function isChapterWatched(chapterId) {
  const watched = getWatchedChapters();
  return !!watched[chapterId];
}

export function getLastChapter() {
  return localStorage.getItem("lastChapter");
}

export function setLastChapter(chapterId) {
  localStorage.setItem("lastChapter", chapterId);
}
