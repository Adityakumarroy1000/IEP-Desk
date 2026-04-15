import multer from "multer";

const storage = multer.memoryStorage();

const allowed = ["application/pdf", "image/png", "image/jpg", "image/jpeg"];

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});
