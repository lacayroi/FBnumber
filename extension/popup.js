const $ = (id) => document.getElementById(id);
let entries = []; // { date, phone, phone2, author, context, url }

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
    for (const v of [e.date, e.phone, e.phone2, e.author, e.context]) {
      const td = document.createElement("td");
      td.textContent = v || "";
      td.title = v || "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  const withPhone = entries.filter((e) => e.phone).length;
  $("status").textContent = `${withPhone} số điện thoại · ${entries.length} dòng`;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["phone.js", "content.js"] });
  return tab;
}

// Gộp kết quả quét vào lịch sử, bỏ trùng theo (phone|author+context).
function merge(results, url) {
  const key = (r) => (r.phone ? r.phone : "noph:" + r.author + "|" + r.context);
  const known = new Set(entries.map(key));
  const date = new Date().toISOString().slice(0, 10);
  let added = 0;
  for (const r of results) {
    if (known.has(key(r))) continue;
    known.add(key(r));
    entries.push({ date, phone2: "", ...r, url });
    added++;
  }
  return added;
}

async function scan() {
  try {
    const tab = await activeTab();
    const { results, url } = await chrome.tabs.sendMessage(tab.id, { type: "scan", keepAll: $("keepAll").checked });
    const added = merge(results, url);
    await save();
    render();
    $("status").textContent += ` (thêm mới ${added})`;
  } catch (err) {
    $("status").textContent = "Không quét được trang này: " + err.message;
  }
}

function scrollOpts() {
  return {
    keepAll: $("keepAll").checked,
    maxScrolls: Math.max(1, +$("maxScrolls").value || 50),
    waitMin: Math.max(0, (+$("waitMin").value || 0) * 1000),
    waitMax: Math.max(0, (+$("waitMax").value || 0) * 1000),
    pauseEvery: Math.max(0, +$("pauseEvery").value || 0),
    pauseMs: Math.max(0, (+$("pauseMin").value || 0) * 60000),
  };
}

async function autoScrollScan() {
  try {
    const tab = await activeTab();
    const o = scrollOpts();
    if (o.waitMax < o.waitMin) o.waitMax = o.waitMin;
    $("autoscroll").hidden = true;
    $("stop").hidden = false;
    $("status").textContent = "Đang cuộn để tải bình luận...";
    const r = await chrome.tabs.sendMessage(tab.id, { type: "autoscroll", opts: o });
    $("status").textContent = `Đã cuộn ${r.scrolls} lần, đang quét...`;
    // Quét theo tùy chọn keepAll sau khi đã tải xong.
    const { results, url } = await chrome.tabs.sendMessage(tab.id, { type: "scan", keepAll: o.keepAll });
    const added = merge(results, url);
    await save();
    render();
    $("status").textContent += ` (thêm mới ${added})`;
  } catch (err) {
    $("status").textContent = "Lỗi: " + err.message;
  } finally {
    $("autoscroll").hidden = false;
    $("stop").hidden = true;
  }
}

async function stopScroll() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "stop-scroll" });
  } catch {}
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "scroll-progress") $("status").textContent = `Đang cuộn ${msg.n}/${msg.total}...`;
});

function csvCell(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function exportCsv() {
  const head = ["Ngày", "SĐT", "SĐT2", "Người đăng", "Nội dung", "URL"];
  const lines = [head.map(csvCell).join(",")];
  for (const e of entries) {
    lines.push([e.date, e.phone, e.phone2, e.author, e.context, e.url].map(csvCell).join(","));
  }
  // BOM để Excel đọc đúng tiếng Việt.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `so-dien-thoai-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

$("scan").onclick = scan;
$("autoscroll").onclick = autoScrollScan;
$("stop").onclick = stopScroll;
$("csv").onclick = exportCsv;
$("copy").onclick = async () => {
  const phones = entries.filter((e) => e.phone).map((e) => e.phone);
  await navigator.clipboard.writeText(phones.join("\n"));
  $("status").textContent = `Đã sao chép ${phones.length} số`;
};
$("clear").onclick = async () => {
  entries = [];
  await save();
  render();
};

load();
