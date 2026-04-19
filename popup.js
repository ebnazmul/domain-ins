import { fetchDomainStatus, fetchIpInfo } from "./src/api.js";
import { fetchARecords, findApex, hostFromUrl, loadNsRecords } from "./src/domain.js";
import { els } from "./src/dom.js";
import {
  clearError,
  initializePlaceholders,
  renderIpInfo,
  renderList,
  setIpInfoMessage,
  setText,
  showError,
  showTokenStatus
} from "./src/render.js";
import { getActiveTabUrl, loadSettings, saveSettings } from "./src/storage.js";

function setupSettings() {
  if (!els.settingsForm) return;

  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      if (els.saveToken) {
        els.saveToken.disabled = true;
      }

      await saveSettings();
      showTokenStatus("Saved");
      clearError();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save API settings.";
      showTokenStatus("Save failed", true);
      showError(`Could not save API settings: ${message}`);
    } finally {
      if (els.saveToken) {
        els.saveToken.disabled = false;
      }
    }
  });
}

function loadAddressRecords(hostname, apiToken) {
  fetchARecords(hostname, apiToken)
    .then((records) => {
      renderList(els.aList, els.aEmpty, records);

      const firstIp = records[0];
      if (!firstIp) {
        setIpInfoMessage("No A record found.");
        return;
      }

      setText(els.ipInfoIp, firstIp);
      setText(els.ipInfoOrg, "Loading...");
      setText(els.ipInfoCompany, "Loading...");
      setText(els.ipInfoAsn, "Loading...");
      setText(els.ipInfoLocation, "Loading...");

      fetchIpInfo(firstIp, apiToken)
        .then((info) => renderIpInfo(info, firstIp))
        .catch((error) => {
          setText(els.ipInfoIp, firstIp);
          setText(els.ipInfoOrg, "Unavailable");
          setText(els.ipInfoCompany, "Unavailable");
          setText(els.ipInfoAsn, "Unavailable");
          setText(els.ipInfoLocation, error.message);
        });
    })
    .catch((error) => {
      renderList(els.aList, els.aEmpty, []);
      setIpInfoMessage("Unavailable");
      showError(error.message);
    });
}

function loadDomainDetails(hostname, apiToken) {
  findApex(hostname)
    .then(async ({ apex }) => {
      setText(els.registrable, apex);

      loadNsRecords(apex, apiToken)
        .then((nsList) => renderList(els.nsList, els.nsEmpty, nsList, (value) => value.replace(/\.$/, "")))
        .catch((error) => {
          renderList(els.nsList, els.nsEmpty, []);
          showError(error.message);
        });

      return fetchDomainStatus(apex)
        .then((domainInfo) => {
          setText(els.status, domainInfo.status);
          setText(els.expiry, domainInfo.expiry);
          setText(els.registrar, domainInfo.registrar);
        })
        .catch((error) => {
          setText(els.status, "Unavailable");
          setText(els.expiry, "Unavailable");
          setText(els.registrar, "Unavailable");
          showError(error.message);
        });
    })
    .catch((error) => {
      setText(els.registrable, "Unavailable");
      renderList(els.nsList, els.nsEmpty, []);
      setText(els.status, "Unavailable");
      setText(els.expiry, "Unavailable");
      setText(els.registrar, "Unavailable");
      showError(error.message);
    });
}

async function run() {
  clearError();
  setupSettings();

  const settings = await loadSettings();
  const url = await getActiveTabUrl();
  const hostname = hostFromUrl(url);

  if (!hostname) {
    showError("Could not extract hostname from current tab URL.");
    return;
  }

  const apiToken = settings.api_token || "";
  initializePlaceholders(hostname);
  loadAddressRecords(hostname, apiToken);
  loadDomainDetails(hostname, apiToken);
}

run().catch((error) => showError(error instanceof Error ? error.message : String(error)));
