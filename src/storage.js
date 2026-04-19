import { LEGACY_TOKEN_KEYS, SETTINGS_FIELDS } from "./config.js";
import { byId } from "./dom.js";

const settingsInputs = Object.fromEntries(
  SETTINGS_FIELDS.map((field) => [field.key, byId(field.elementId)])
);

function extensionApi() {
  return globalThis.chrome;
}

function getStorageAreas() {
  const chromeApi = extensionApi();
  const areas = [];

  if (chromeApi?.storage?.sync) {
    areas.push({ type: "chrome", area: chromeApi.storage.sync });
  }

  if (chromeApi?.storage?.local) {
    areas.push({ type: "chrome", area: chromeApi.storage.local });
  }

  if (typeof localStorage !== "undefined") {
    areas.push({ type: "localStorage" });
  }

  return areas;
}

function storageGet(storageArea, keys) {
  return new Promise((resolve, reject) => {
    if (storageArea.type === "localStorage") {
      try {
        const result = {};
        for (const key of keys) {
          result[key] = localStorage.getItem(key) || "";
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
      return;
    }

    try {
      storageArea.area.get(keys, (result) => {
        const error = extensionApi()?.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(result || {});
      });
    } catch (error) {
      reject(error);
    }
  });
}

function storageSet(storageArea, payload) {
  return new Promise((resolve, reject) => {
    if (storageArea.type === "localStorage") {
      try {
        for (const [key, value] of Object.entries(payload)) {
          localStorage.setItem(key, value ?? "");
        }
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }

    try {
      storageArea.area.set(payload, () => {
        const error = extensionApi()?.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function loadSettings() {
  const keys = SETTINGS_FIELDS.map((field) => field.key);
  const areas = getStorageAreas();

  for (const area of areas) {
    try {
      const stored = await storageGet(area, keys);
      const legacy = await storageGet(area, LEGACY_TOKEN_KEYS);
      const mergedToken = stored?.api_token || legacy?.ipinfo_token || "";

      for (const field of SETTINGS_FIELDS) {
        const input = settingsInputs[field.key];
        if (input) {
          input.value = mergedToken || input.value || "";
        }
      }

      if (mergedToken) {
        return { api_token: mergedToken };
      }
    } catch {
      // Try the next storage area.
    }
  }

  return {};
}

export async function saveSettings() {
  const payload = {};
  const areas = getStorageAreas();

  for (const field of SETTINGS_FIELDS) {
    const input = settingsInputs[field.key];
    payload[field.key] = input ? input.value.trim() : "";
  }

  let saved = false;
  let lastErrorMessage = "No storage area available";

  for (const area of areas) {
    try {
      await storageSet(area, {
        api_token: payload.api_token,
        ipinfo_token: payload.api_token
      });
      saved = true;
    } catch (error) {
      lastErrorMessage = error instanceof Error ? error.message : String(error);
    }
  }

  if (!saved) {
    throw new Error(lastErrorMessage);
  }

  return payload;
}

export async function getActiveTabUrl() {
  const chromeApi = extensionApi();
  if (!chromeApi?.tabs?.query) {
    throw new Error("Chrome tabs API is unavailable.");
  }

  const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
  return tab?.url || "";
}
