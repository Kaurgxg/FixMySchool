const express = require("express");
const { serveUploadedFile } = require("../controllers/fileController");

const router = express.Router();

// Intentionally NOT behind the shared `protect` middleware, because that
// only reads the Authorization header - this route also needs to accept
// a `?token=` query param so plain <img>/<video> tags can load files.
// Authorization is fully enforced inside serveUploadedFile itself.
router.get("/:filename", serveUploadedFile);

module.exports = router;
