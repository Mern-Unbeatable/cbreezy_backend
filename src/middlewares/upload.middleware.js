import fs from "fs";
import path from "path";
import multer from "multer";
import {
  isCloudinaryConfigured,
  withCloudinaryUpload,
} from "../utils/cloudinaryUpload.js";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
const serviceImagesDir = path.join(uploadsRoot, "services", "images");
const serviceGalleryDir = path.join(uploadsRoot, "services", "gallery");
const eventImagesDir = path.join(uploadsRoot, "events", "images");
const eventGalleryDir = path.join(uploadsRoot, "events", "gallery");
const categoryImagesDir = path.join(uploadsRoot, "categories", "images");
const profileImagesDir = path.join(uploadsRoot, "users", "profiles");

if (!isCloudinaryConfigured) {
  for (const directory of [
    uploadsRoot,
    serviceImagesDir,
    serviceGalleryDir,
    eventImagesDir,
    eventGalleryDir,
    categoryImagesDir,
    profileImagesDir,
  ]) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

const diskStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (file.fieldname === "profileImage") {
      callback(null, profileImagesDir);
      return;
    }

    if (file.fieldname === "image") {
      callback(null, categoryImagesDir);
      return;
    }

    if (["eventGallery"].includes(file.fieldname)) {
      callback(null, eventGalleryDir);
      return;
    }

    if (["eventImage", "eventImages"].includes(file.fieldname)) {
      callback(null, eventImagesDir);
      return;
    }

    if (["serviceGallery", "gallery"].includes(file.fieldname)) {
      callback(null, serviceGalleryDir);
      return;
    }

    callback(null, serviceImagesDir);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const sanitizedBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    callback(
      null,
      `${Date.now()}-${sanitizedBaseName}${extension.toLowerCase()}`,
    );
  },
});

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image files are allowed"));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage: isCloudinaryConfigured ? memoryStorage : diskStorage,
  fileFilter,
});

export const serviceListingUpload = withCloudinaryUpload(
  upload.fields([
    { name: "serviceImages", maxCount: 10 },
    { name: "serviceImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
    { name: "serviceGallery", maxCount: 20 },
    { name: "gallery", maxCount: 20 },
  ]),
);

export const eventListingUpload = withCloudinaryUpload(
  upload.fields([
    { name: "eventImages", maxCount: 10 },
    { name: "eventImage", maxCount: 1 },
    { name: "mainImage", maxCount: 1 },
    { name: "eventGallery", maxCount: 20 },
    { name: "gallery", maxCount: 20 },
  ]),
);

export const categoryImageUpload = withCloudinaryUpload(upload.single("image"));
export const profileImageUpload = withCloudinaryUpload(
  upload.single("profileImage"),
);
