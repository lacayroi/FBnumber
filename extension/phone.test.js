const assert = require("assert");
const { extractPhones } = require("./phone.js");

const cases = [
  ["Chốt đơn 0912345678 nhé", ["0912345678"]],
  ["sđt: 0912.345.678", ["0912345678"]],
  ["0912 345 678 hoặc +84 987654321", ["0912345678", "0987654321"]],
  ["84-33-123-4567", ["0331234567"]],
  ["mã đơn 123091234567890", []],
  ["số bàn 0212345678", []],
  ["0912345678 và lại 0912345678", ["0912345678"]],
];
for (const [input, expected] of cases) assert.deepStrictEqual(extractPhones(input), expected, input);
console.log(`ok - ${cases.length} cases`);
