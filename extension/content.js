// Quét phần văn bản đang hiển thị trên trang, tìm SĐT kèm tên người đăng (nếu xác định được).
(function () {
  if (window.__phoneCollectorLoaded) return;
  window.__phoneCollectorLoaded = true;

  const { extractPhones } = window.PhoneUtils;

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

  function scan() {
    const results = [];
    for (const block of blocks()) {
      const text = block.innerText || "";
      for (const phone of extractPhones(text)) {
        results.push({
          phone,
          author: block === document.body ? "" : authorOf(block),
          context: text.replace(/\s+/g, " ").trim().slice(0, 200),
        });
      }
    }
    return results;
  }

  // Bấm các nút "Xem thêm bình luận" / "View more comments" đang hiển thị.
  function expandComments() {
    const re = /^(Xem thêm bình luận|Xem thêm \d+ bình luận|Xem \d+ phản hồi|Xem tất cả \d+ phản hồi|View more comments|View \d+ (more )?repl(y|ies)|View all \d+ replies)/i;
    let clicked = 0;
    document.querySelectorAll('[role="button"], span').forEach((el) => {
      if (re.test((el.textContent || "").trim()) && el.offsetParent !== null) {
        el.click();
        clicked++;
      }
    });
    return clicked;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "scan") sendResponse({ results: scan(), url: location.href });
    else if (msg.type === "expand") sendResponse({ clicked: expandComments() });
  });
})();
