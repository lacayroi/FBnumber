// Nhận diện số điện thoại di động Việt Nam trong văn bản tự do.
// Dùng chung cho content script (trình duyệt) và test (Node).
(function (root) {
  // 0 hoặc +84/84, theo sau là 9 chữ số, cho phép khoảng trắng, dấu chấm, gạch ngang ở giữa.
  const PHONE_RE = /(?<![\d+])(?:\+?84|0)[\s.\-]?(?:\d[\s.\-]?){8}\d(?![\d])/g;
  const MOBILE_PREFIX = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d)\d{7}$/;

  function normalize(raw) {
    let d = raw.replace(/\D/g, "");
    if (d.startsWith("84")) d = "0" + d.slice(2);
    return d;
  }

  function extractPhones(text) {
    const out = [];
    for (const m of text.matchAll(PHONE_RE)) {
      const phone = normalize(m[0]);
      if (MOBILE_PREFIX.test(phone) && !out.includes(phone)) out.push(phone);
    }
    return out;
  }

  const api = { extractPhones, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PhoneUtils = api;
})(typeof self !== "undefined" ? self : this);
