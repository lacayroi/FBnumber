const $ = (id) => document.getElementById(id);
let entries = []; // { phone, author, context, url }

async function load() {
  ({ entries = [] } = await chrome.storage.local.get("entries"));
  render();
}

function save() {
  return chrome.storage.local.set({ entries });
}

function render() {
  const tbody = $("rows");
  tbody.textContent = "";
  for (const e of entries) {
    const tr = document.createElement("tr");
    for (const v of [e.phone, e.author, e.context]) {
      const td = document.createElement("td");
      td.textContent = v;
      td.title = v;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  $("status").textContent = `${entries.length} số điện thoại`;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["phone.js", "content.js"] });
  return tab;
}

async function scan() {
  try {
    const tab = await activeTab();
    const { results, url } = await chrome.tabs.sendMessage(tab.id, { type: "scan" });
    const known = new Set(entries.map((e) => e.phone));
    let added = 0;
    for (const r of results) {
      if (known.has(r.phone)) continue;
      known.add(r.phone);
      entries.push({ ...r, url });
      added++;
    }
    await save();
    render();
    $("status").textContent += ` (thêm mới ${added})`;
  } catch (err) {
    $("status").textContent = "Không quét được trang này: " + err.message;
  }
}

async function expand() {
  try {
    const tab = await activeTab();
    const { clicked } = await chrome.tabs.sendMessage(tab.id, { type: "expand" });
    $("status").textContent = `Đã mở ${clicked} mục, đang chờ tải...`;
    setTimeout(scan, 2500);
  } catch (err) {
    $("status").textContent = "Lỗi: " + err.message;
  }
}

function csvCell(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function exportCsv() {
  const lines = [["SĐT", "Người đăng", "Nội dung", "URL"].map(csvCell).join(",")];
  for (const e of entries) lines.push([e.phone, e.author, e.context, e.url].map(csvCell).join(","));
  // BOM để Excel đọc đúng tiếng Việt.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `so-dien-thoai-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

$("scan").onclick = scan;
$("expand").onclick = expand;
$("csv").onclick = exportCsv;
$("copy").onclick = async () => {
  await navigator.clipboard.writeText(entries.map((e) => e.phone).join("\n"));
  $("status").textContent = `Đã sao chép ${entries.length} số`;
};
$("clear").onclick = async () => {
  entries = [];
  await save();
  render();
};

load();
