// Quét phần văn bản đang hiển thị trên trang, tìm SĐT kèm tên người đăng (nếu xác định được).
(function () {
  if (window.__phoneCollectorLoaded) return;
  window.__phoneCollectorLoaded = true;

  const { extractPhones } = window.PhoneUtils;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (min, max) => min + Math.random() * (max - min);

  // Facebook gắn role="article" cho bài viết/bình luận, aria-label dạng "Bình luận của X" / "Comment by X".
  function authorOf(block) {
    const label = block.getAttribute("aria-label") || "";
    const m = label.match(/^(?:Bình luận của|Phản hồi của|Comment by|Reply by)\s+(.+?)(?:\s+(?:vào|\d|about|on)\b.*)?$/i);
    if (m) return m[1].trim();
    const link = block.querySelector('a[role="link"] span, h2 a, h3 a, strong a, a strong');
    return link ? link.textContent.trim() : "";
  }

  function blocks() {
    const articles = [...document.querySelectorAll('[role="article"]')];
    // Chỉ lấy khối trong cùng để không gán SĐT của bình luận con cho bài viết cha.
    const leaves = articles.filter((a) => !a.querySelector('[role="article"]'));
    return leaves.length ? leaves : [document.body];
  }

  // keepAll=true: giữ cả comment không có số (để có đủ danh sách tương tác).
  function scan(keepAll) {
    const results = [];
    for (const block of blocks()) {
      const text = (block.innerText || "").replace(/\s+/g, " ").trim();
      const phones = extractPhones(text);
      if (!phones.length) {
        if (keepAll && block !== document.body) {
          results.push({ phone: "", phone2: "", author: authorOf(block), context: text.slice(0, 200) });
        }
        continue;
      }
      results.push({
        phone: phones[0],
        phone2: phones[1] || "", // số thứ hai nếu xuất hiện trong cùng comment
        author: block === document.body ? "" : authorOf(block),
        context: text.slice(0, 200),
      });
    }
    return results;
  }

  // Bấm các nút "Xem thêm bình luận" / "View more comments" / "Xem các phản hồi" đang hiển thị.
  const EXPAND_RE = /^(Xem thêm bình luận|Xem thêm \d+ bình luận|Xem \d+ phản hồi|Xem tất cả \d+ phản hồi|Xem các câu trả lời trước|View more comments|View \d+ (more )?repl(y|ies)|View all \d+ replies|View previous comments)/i;
  function expandComments() {
    let clicked = 0;
    document.querySelectorAll('[role="button"], span').forEach((el) => {
      if (EXPAND_RE.test((el.textContent || "").trim()) && el.offsetParent !== null) {
        el.click();
        clicked++;
      }
    });
    return clicked;
  }

  // Tự động cuộn để tải hết comment, có tiết chế (đợi ngẫu nhiên, tạm dừng sau N lần cuộn).
  // opts: { maxScrolls, waitMin, waitMax, pauseEvery, pauseMs, bottomGraceMs }
  let scrolling = false;
  async function autoScroll(opts, onProgress) {
    if (scrolling) return { stopped: true, reason: "already-running" };
    scrolling = true;
    const o = Object.assign(
      { maxScrolls: 50, waitMin: 1500, waitMax: 3000, pauseEvery: 0, pauseMs: 60000, bottomGraceMs: 4000 },
      opts || {}
    );
    let i = 0;
    let lastHeight = 0;
    let stuck = 0;
    try {
      for (i = 0; i < o.maxScrolls && scrolling; i++) {
        expandComments();
        window.scrollTo(0, document.body.scrollHeight);
        onProgress && onProgress(i + 1, o.maxScrolls);
        await sleep(rand(o.waitMin, o.waitMax));

        const h = document.body.scrollHeight;
        if (h <= lastHeight) {
          // Có thể đã chạm đáy: chờ thêm rồi thử lần nữa trước khi dừng hẳn.
          stuck++;
          await sleep(o.bottomGraceMs);
          if (document.body.scrollHeight <= lastHeight && stuck >= 2) break;
        } else {
          stuck = 0;
        }
        lastHeight = h;

        if (o.pauseEvery > 0 && (i + 1) % o.pauseEvery === 0) await sleep(o.pauseMs);
      }
    } finally {
      scrolling = false;
    }
    return { stopped: !scrolling, scrolls: i };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "scan") {
      sendResponse({ results: scan(msg.keepAll), url: location.href });
    } else if (msg.type === "expand") {
      sendResponse({ clicked: expandComments() });
    } else if (msg.type === "autoscroll") {
      autoScroll(msg.opts, (n, total) => {
        chrome.runtime.sendMessage({ type: "scroll-progress", n, total }).catch(() => {});
      }).then((r) => sendResponse(r));
      return true; // async response
    } else if (msg.type === "stop-scroll") {
      scrolling = false;
      sendResponse({ stopped: true });
    }
  });
})();
