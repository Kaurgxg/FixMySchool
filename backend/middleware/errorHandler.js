function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  if (err.message && (err.message.includes("Only image files") || err.message.includes("Only video files") || err.message.includes("Unexpected upload field"))) {
    return res.status(400).json({ message: err.message });
  }

  // Multer errors (e.g. LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE)
  if (err.name === "MulterError") {
    const friendly = {
      LIMIT_FILE_SIZE: "One of your files is too large.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field in upload.",
    };
    return res.status(400).json({ message: friendly[err.code] || "File upload failed." });
  }

  // Any other error is unexpected (a bug, DB failure, etc.) - never leak its
  // raw message or stack trace to the client, since it can contain internal
  // paths, driver details, or other sensitive information. Deliberate,
  // client-safe errors are handled by the explicit branches above; anything
  // else always gets a generic message here.
  const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
  const message = status < 500 ? err.message : "Something went wrong on the server. Please try again.";
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
