const DNSLT_CONTEXT_MENU_ID = "open-dnslt-domain";
const DNSLT_BASE_URL = "https://dnslt.com/";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: DNSLT_CONTEXT_MENU_ID,
    title: "Open domain in DNSLT",
    contexts: ["page", "link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== DNSLT_CONTEXT_MENU_ID) return;

  const sourceUrl = info.linkUrl || info.pageUrl || tab?.url || "";
  const hostname = hostnameFromUrl(sourceUrl);

  if (!hostname) return;

  chrome.tabs.create({
    url: `${DNSLT_BASE_URL}${encodeURIComponent(hostname)}`
  });
});

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
