export const els = {
  domain: document.getElementById("target-host"),
  registrable: document.getElementById("registrable-domain"),
  status: document.getElementById("domain-status"),
  expiry: document.getElementById("domain-expiry"),
  registrar: document.getElementById("domain-registrar"),
  nsList: document.getElementById("ns-list"),
  nsEmpty: document.getElementById("ns-empty"),
  aList: document.getElementById("a-host-list"),
  aEmpty: document.getElementById("a-host-empty"),
  ipInfoIp: document.getElementById("ipinfo-ip"),
  ipInfoOrg: document.getElementById("ipinfo-org"),
  ipInfoCompany: document.getElementById("ipinfo-company"),
  ipInfoAsn: document.getElementById("ipinfo-asn"),
  ipInfoLocation: document.getElementById("ipinfo-location"),
  settingsForm: document.getElementById("settings-form"),
  saveToken: document.getElementById("save-token"),
  tokenStatus: document.getElementById("token-status"),
  error: document.getElementById("error")
};

export function byId(id) {
  return document.getElementById(id);
}
