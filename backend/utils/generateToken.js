const jwt = require("jsonwebtoken");

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// A separate, narrowly-scoped, short-lived token used only for loading
// protected media (photos/videos) via plain <img>/<video>/<a> URLs, which
// can't send an Authorization header. Unlike the main 7-day session token,
// this expires in 2 minutes and is only ever accepted by the /uploads
// route - even if it leaked (browser history, referrer headers, a shared
// screenshot of a URL), it's useless within minutes and can't be used to
// call any other API endpoint.
function generateMediaToken(userId) {
  return jwt.sign({ id: userId, scope: "media" }, process.env.JWT_SECRET, { expiresIn: "2m" });
}

module.exports = generateToken;
module.exports.generateMediaToken = generateMediaToken;
