const DNSLT_CONTEXT_MENU_ID = "open-dnslt-domain";
const DNSLT_BASE_URL = "https://dnslt.com/";
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const IPV4_PATTERN = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_PATTERN = /^(?:[a-f0-9]{1,4}:){2,}[a-f0-9:]{1,}$/i;

setupContextMenu();

chrome.runtime.onInstalled.addListener(setupContextMenu);
chrome.runtime.onStartup.addListener(setupContextMenu);

function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: DNSLT_CONTEXT_MENU_ID,
      title: "Open in DNSLT",
      contexts: ["selection"],
      visible: false
    });
  });
}

chrome.contextMenus.onShown.addListener((info) => {
  const target = normalizeSelectedTarget(info.selectionText || "");

  chrome.contextMenus.update(DNSLT_CONTEXT_MENU_ID, {
    title: target ? `Open ${target} in DNSLT` : "Open in DNSLT",
    visible: Boolean(target)
  });
  chrome.contextMenus.refresh();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== DNSLT_CONTEXT_MENU_ID) return;

  const target = normalizeSelectedTarget(info.selectionText || "");

  if (!target) return;

  chrome.tabs.create({
    url: `${DNSLT_BASE_URL}${encodeURIComponent(target)}`
  });
});

function normalizeSelectedTarget(value) {
  const cleaned = cleanSelectedText(value);
  if (!cleaned) return "";

  const fromUrl = hostnameFromUrl(cleaned);
  const candidate = fromUrl || cleaned.replace(/\.$/, "");

  if (isValidDnsltTarget(candidate)) {
    return candidate.toLowerCase();
  }

  return "";
}

function cleanSelectedText(value) {
  return value
    .trim()
    .replace(/^[<({["']+/, "")
    .replace(/[>)}\]"',;:]+$/, "");
}

function hostnameFromUrl(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function isValidDnsltTarget(value) {
  return DOMAIN_PATTERN.test(value) || IPV4_PATTERN.test(value) || IPV6_PATTERN.test(value);
}
