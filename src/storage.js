export async function loadSettings() {
  const input = document.getElementById("api-token");
  let mergedToken = "";
  try {
    const stored = await chrome.storage.local.get(["api_token", "ipinfo_token"]);
    mergedToken = stored?.api_token || stored?.ipinfo_token || "";
  } catch {
    // ignore
  }

  if (input) {
    input.value = mergedToken || input.value || "";
  }
  return mergedToken ? { api_token: mergedToken } : {};
}

export async function saveSettings() {
  const input = document.getElementById("api-token");
  const token = input ? input.value.trim() : "";
  
  try {
    await chrome.storage.local.set({
      api_token: token,
      ipinfo_token: token
    });
    return { api_token: token };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function getActiveTabUrl() {
  if (!chrome?.tabs?.query) {
    throw new Error("Chrome tabs API is unavailable.");
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || "";
}
