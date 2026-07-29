const crypto = require("crypto");

function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const a = Buffer.from(String(candidate || ""));
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

module.exports = { checkPassword };
