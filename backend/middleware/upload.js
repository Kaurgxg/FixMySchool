const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { fromFile } = require("file-type");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const VIDEO_TYPES = [".mp4", ".mov", ".webm", ".avi", ".mkv"];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "images") {
    if (IMAGE_TYPES.includes(ext)) return cb(null, true);
    return cb(new Error("Only image files (jpg, jpeg, png, webp, gif) are allowed."));
  }

  if (file.fieldname === "videos") {
    if (VIDEO_TYPES.includes(ext)) return cb(null, true);
    return cb(new Error("Only video files (mp4, mov, webm, avi, mkv) are allowed."));
  }

  return cb(new Error("Unexpected upload field."));
}

// Images capped at 5MB each, videos capped at 50MB each. multer applies
// one ceiling across all fields in a request, so we set it to the larger
// video limit here and re-check the tighter image limit in the controller.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 7 },
});

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Combined upload handler: accepts up to 5 images and up to 2 videos
// in the same multipart form, under the "images" and "videos" field names.
const uploadIssueMedia = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 2 },
]);

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIMES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska"];

// Deletes every file multer wrote for this request. Called whenever a
// later validation step (size, MIME sniffing) rejects the upload, or the
// issue fails to save, so a rejected/failed submission never leaves
// orphaned files sitting in the uploads folder.
function deleteUploadedFiles(req) {
  const files = [...(req.files?.images || []), ...(req.files?.videos || [])];
  for (const f of files) {
    fs.unlink(f.path, (err) => {
      if (err) console.error(`Failed to remove orphaned upload ${f.path}:`, err.message);
    });
  }
}

// The extension-based fileFilter above only checks the filename multer
// receives, which the client controls and can lie about (e.g. renaming a
// script to photo.jpg). This second pass reads the actual file bytes
// (magic numbers) via file-type and rejects anything whose real content
// doesn't match an allowed image/video format, deleting the file either way.
async function validateMediaTypes(req, res, next) {
  try {
    const images = req.files?.images || [];
    const videos = req.files?.videos || [];

    for (const f of images) {
      const detected = await fromFile(f.path);
      if (!detected || !IMAGE_MIMES.includes(detected.mime)) {
        deleteUploadedFiles(req);
        return res.status(400).json({ message: "One of your images doesn't look like a valid image file." });
      }
    }

    for (const f of videos) {
      const detected = await fromFile(f.path);
      if (!detected || !VIDEO_MIMES.includes(detected.mime)) {
        deleteUploadedFiles(req);
        return res.status(400).json({ message: "One of your videos doesn't look like a valid video file." });
      }
    }

    next();
  } catch (err) {
    deleteUploadedFiles(req);
    next(err);
  }
}

// Second-pass validation: multer's `limits.fileSize` applies one ceiling
// across all fields, so we re-check per-type limits here and reject
// oversized images explicitly instead of silently allowing 50MB photos.
// Also re-checks max count per type as a second line of defense.
function validateMediaSizes(req, res, next) {
  const images = req.files?.images || [];
  const videos = req.files?.videos || [];

  if (images.length > 5) {
    deleteUploadedFiles(req);
    return res.status(400).json({ message: "You can upload a maximum of 5 images." });
  }
  if (videos.length > 2) {
    deleteUploadedFiles(req);
    return res.status(400).json({ message: "You can upload a maximum of 2 videos." });
  }

  const oversizedImage = images.find((f) => f.size > MAX_IMAGE_BYTES);
  if (oversizedImage) {
    deleteUploadedFiles(req);
    return res.status(400).json({ message: "Images must be 5MB or smaller." });
  }

  const oversizedVideo = videos.find((f) => f.size > MAX_VIDEO_BYTES);
  if (oversizedVideo) {
    deleteUploadedFiles(req);
    return res.status(400).json({ message: "Videos must be 50MB or smaller." });
  }

  next();
}

module.exports = { upload, uploadIssueMedia, validateMediaSizes, validateMediaTypes, deleteUploadedFiles };
