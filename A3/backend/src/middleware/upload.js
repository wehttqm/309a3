const multer = require("multer");
const path = require("path");
const fs = require("fs");

const IMAGE_TYPES = ["image/png", "image/jpeg"];
const DOCUMENT_TYPES = ["application/pdf"];

function createUploadMiddleware({ allowedTypes, getDestination, getFilename }) {
  const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new Error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`),
        );
      }
      cb(null, true);
    },
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = getDestination(req, file);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        cb(null, getFilename(req, file));
      },
    }),
  });

  return (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return res
          .status(400)
          .json({ error: err.message || "Invalid file upload." });
      }
      next();
    });
  };
}

const uploadUserAvatar = createUploadMiddleware({
  allowedTypes: IMAGE_TYPES,
  getDestination: (req) =>
    path.join("uploads", "users", String(req.auth.id), "avatar"),
  getFilename: (req, file) =>
    file.mimetype === "image/png" ? "avatar.png" : "avatar.jpg",
});

const uploadBusinessAvatar = createUploadMiddleware({
  allowedTypes: IMAGE_TYPES,
  getDestination: (req) =>
    path.join("uploads", "businesses", String(req.auth.id), "avatar"),
  getFilename: (req, file) =>
    file.mimetype === "image/png" ? "avatar.png" : "avatar.jpg",
});

const uploadUserResume = createUploadMiddleware({
  allowedTypes: DOCUMENT_TYPES,
  getDestination: (req) =>
    path.join("uploads", "users", String(req.auth.id), "resume"),
  getFilename: () => "resume.pdf",
});

const uploadQualificationDocument = createUploadMiddleware({
  allowedTypes: DOCUMENT_TYPES,
  getDestination: (req) =>
    path.join(
      "uploads",
      "users",
      String(req.auth.id),
      "qualifications",
      String(req.params.qualificationId),
    ),
  getFilename: () => "document.pdf",
});

module.exports = {
  uploadUserAvatar,
  uploadBusinessAvatar,
  uploadUserResume,
  uploadQualificationDocument,
};
