(function () {
    'use strict';

    const INPUT_SEL = `div.tawk-message-input[contenteditable="true"]:not([style*="display: none"])`;
    const TMPL_URL  = "https://raw.githubusercontent.com/ebnazmul/userscripts/refs/heads/master/tawk-to-and-anychat-helper/templates.js";

    let templates = [];
    let lang      = "en";
    let open      = false;

    // ── parse "hi_en" → { prefix:"hi", lang:"en" } ──────────────────────────
    function parseName(name) {
        const m = name.match(/^(.+)_(en|bn)$/);
        return m ? { prefix: m[1], lang: m[2] } : null;
    }

    // ── filter + group ───────────────────────────────────────────────────────
    function getGrouped(query = "") {
        const q = query.trim().toLowerCase();
        const filtered = templates.filter(t => {
            const p = parseName(t.name);
            if (!p) return false;
            if (lang !== "all" && p.lang !== lang) return false;
            if (q) return (t.label + t.value + t.group).toLowerCase().includes(q);
            return true;
        });

        const groups = {};
        for (const t of filtered) {
            const g = t.group ?? "Other";
            (groups[g] ??= []).push(t);
        }
        return groups;
    }

    // ── render button list ───────────────────────────────────────────────────
    function renderList(query = "") {
        const list = document.getElementById("qr-list");
        if (!list) return;

        const grouped = getGrouped(query);

        if (!Object.keys(grouped).length) {
            list.innerHTML = `<div style="font-size:11px;color:#6b7280;text-align:center;padding:10px 0;">No match</div>`;
            return;
        }

        list.innerHTML = Object.entries(grouped).map(([g, items]) => `
            <div style="font-size:9px;color:#4b5563;letter-spacing:.8px;text-transform:uppercase;margin:8px 0 3px;">${g}</div>
            ${items.map(t => {
                const p = parseName(t.name);
                return `<button data-name="${t.name}" title="${t.value.replace(/"/g,"&quot;")}" style="
                    display:block;width:100%;text-align:left;
                    background:${t.color}18;color:${t.color};border:1px solid ${t.color}40;
                    border-radius:6px;padding:6px 9px;font-size:11.5px;
                    cursor:pointer;margin-bottom:4px;line-height:1.3;
                ">${t.icon ?? "💬"} ${t.label ?? t.name}${lang === "all" ? ` <span style="opacity:.45;font-size:10px;">${p?.lang.toUpperCase()}</span>` : ""}</button>`;
            }).join("")}
        `).join("");
    }

    // ── fill tawk input ──────────────────────────────────────────────────────
    function fillInput(text) {
        const el = document.querySelector(INPUT_SEL);
        if (!el) return;
        el.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, text);
    }

    // ── build panel ──────────────────────────────────────────────────────────
    function buildPanel() {
        const panel = document.createElement("div");
        panel.id = "qr-panel";
        Object.assign(panel.style, {
            position:"fixed", bottom:"78px", right:"20px",
            background:"#1a1b23", border:"1px solid #2e3040",
            borderRadius:"14px", padding:"14px", zIndex:"999999",
            boxShadow:"0 8px 32px rgba(0,0,0,0.35)", width:"230px",
            fontFamily:"system-ui,sans-serif", display:"none",
            maxHeight:"80vh", overflowY:"auto"
        });

        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Quick Replies</span>
                <div style="display:flex;gap:5px;align-items:center;">
                    <div id="qr-lang" style="display:flex;background:#2a2b35;border-radius:6px;padding:2px;gap:2px;">
                        ${["en","bn","all"].map(l => `
                            <button data-lang="${l}" style="
                                padding:3px 7px;border-radius:4px;border:none;font-size:10px;cursor:pointer;
                                background:${l==="en"?"#4f46e5":"transparent"};
                                color:${l==="en"?"white":"#9ca3af"};
                            ">${l === "bn" ? "বাং" : l.toUpperCase()}</button>
                        `).join("")}
                    </div>
                    <button id="qr-close" style="background:none;border:none;color:#6b7280;font-size:14px;cursor:pointer;">✕</button>
                </div>
            </div>
            <input id="qr-search" placeholder="Search…" style="
                width:100%;background:#2a2b35;border:1px solid #3e4050;border-radius:7px;
                padding:5px 9px;font-size:11px;color:#e5e7eb;
                box-sizing:border-box;margin-bottom:2px;outline:none;
            "/>
            <div id="qr-list"></div>
        `;

        panel.querySelector("#qr-close").addEventListener("click", toggle);

        panel.querySelector("#qr-lang").addEventListener("click", e => {
            const btn = e.target.closest("[data-lang]");
            if (!btn) return;
            lang = btn.dataset.lang;
            panel.querySelectorAll("[data-lang]").forEach(b => {
                b.style.background = b.dataset.lang === lang ? "#4f46e5" : "transparent";
                b.style.color      = b.dataset.lang === lang ? "white"   : "#9ca3af";
            });
            renderList(panel.querySelector("#qr-search").value);
        });

        panel.querySelector("#qr-search").addEventListener("input", e => renderList(e.target.value));

        panel.querySelector("#qr-list").addEventListener("click", e => {
            const btn = e.target.closest("[data-name]");
            if (!btn) return;
            const t = templates.find(x => x.name === btn.dataset.name);
            if (t) fillInput(t.value);
        });

        document.body.appendChild(panel);
        return panel;
    }

    // ── build FAB ────────────────────────────────────────────────────────────
    function buildFab() {
        const fab = document.createElement("button");
        fab.id = "qr-fab";
        fab.textContent = "💬";
        fab.title = "Quick Replies";
        Object.assign(fab.style, {
            position:"fixed", bottom:"24px", right:"24px",
            width:"44px", height:"44px", borderRadius:"50%",
            background:"#4f46e5", border:"none", color:"white",
            fontSize:"20px", cursor:"pointer", zIndex:"999999",
            boxShadow:"0 4px 16px rgba(0,0,0,0.35)"
        });
        fab.addEventListener("click", toggle);
        document.body.appendChild(fab);
    }

    function toggle() {
        const panel = document.getElementById("qr-panel");
        if (!panel) return;
        open = !open;
        panel.style.display = open ? "block" : "none";
        if (open) {
            const s = panel.querySelector("#qr-search");
            s.value = "";
            renderList();
            s.focus();
        }
    }

    function inject() {
        if (document.getElementById("qr-fab")) return;
        buildFab();
        buildPanel();
        renderList();
    }

    // ── SPA-safe re-injection ────────────────────────────────────────────────
    let debounce;
    new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            if (!document.getElementById("qr-fab")) inject();
        }, 400);
    }).observe(document.body, { childList: true, subtree: false });

    // ── boot ─────────────────────────────────────────────────────────────────
    fetch(TMPL_URL + "?t=" + Date.now())
        .then(r => r.json())
        .then(data => {
            templates = data;
            const check = setInterval(() => {
                if (document.querySelector(INPUT_SEL)) {
                    clearInterval(check);
                    inject();
                }
            }, 500);
        })
        .catch(e => console.error("[QR]", e));

})();
