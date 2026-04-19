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

      const settings = await saveSettings();
      currentApiToken = settings.api_token || "";
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

let currentHostname = "";
let currentApiToken = "";

function formatDnsRecord(record) {
  const ttl = Number.isFinite(record.ttl) ? `TTL ${record.ttl}s` : "TTL unknown";
  const resolver = record.resolver ? `via ${record.resolver}` : "via DoH";
  return `${record.value} (${ttl}, ${resolver})`;
}

function formatAddressRecordLink(record) {
  return {
    href: `https://ipinfo.io/${encodeURIComponent(record.value)}`,
    label: formatDnsRecord(record)
  };
}

function loadAddressRecords(hostname, apiToken) {
  fetchARecords(hostname)
    .then((records) => {
      renderList(els.aList, els.aEmpty, records, formatAddressRecordLink);

      const firstIp = records[0]?.value;
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

function loadDomainDetails(hostname) {
  findApex(hostname)
    .then(async ({ apex }) => {
      setText(els.registrable, apex);

      loadNsRecords(apex)
        .then((nsList) => renderList(els.nsList, els.nsEmpty, nsList, (record) => {
          const cleanValue = record.value.replace(/\.$/, "");
          return formatDnsRecord({ ...record, value: cleanValue });
        }))
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

function setupRefresh() {
  if (!els.refreshDns) return;

  els.refreshDns.addEventListener("click", () => {
    if (!currentHostname) return;

    els.refreshDns.disabled = true;
    renderList(els.aList, els.aEmpty, []);
    renderList(els.nsList, els.nsEmpty, []);
    setIpInfoMessage("Refreshing DNS...");
    loadAddressRecords(currentHostname, currentApiToken);
    loadDomainDetails(currentHostname);

    setTimeout(() => {
      els.refreshDns.disabled = false;
    }, 1200);
  });
}

async function run() {
  clearError();
  setupSettings();
  setupRefresh();

  const settings = await loadSettings();
  const url = await getActiveTabUrl();
  const hostname = hostFromUrl(url);

  if (!hostname) {
    showError("Could not extract hostname from current tab URL.");
    return;
  }

  const apiToken = settings.api_token || "";
  currentHostname = hostname;
  currentApiToken = apiToken;
  initializePlaceholders(hostname);
  loadAddressRecords(hostname, apiToken);
  loadDomainDetails(hostname);
}

run().catch((error) => showError(error instanceof Error ? error.message : String(error)));
