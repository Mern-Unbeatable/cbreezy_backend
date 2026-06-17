import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

const getCloudinaryFolder = (fieldname) => {
  if (fieldname === "profileImage") {
    return "sidegurus/users/profiles";
  }

  if (fieldname === "image") {
    return "sidegurus/categories";
  }

  if (["eventGallery"].includes(fieldname)) {
    return "sidegurus/events/gallery";
  }

  if (["eventImage", "eventImages"].includes(fieldname)) {
    return "sidegurus/events";
  }

  if (["serviceGallery", "gallery"].includes(fieldname)) {
    return "sidegurus/services/gallery";
  }

  return "sidegurus/services";
};

export const uploadBufferToCloudinary = async (file, folder) => {
  if (!file?.buffer) {
    throw new Error("Uploaded file buffer is missing");
  }

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });

  return result.secure_url;
};

export const processCloudinaryUploads = async (req) => {
  if (!isCloudinaryConfigured) {
    return;
  }

  const uploadSingle = async (file) => {
    if (!file?.buffer) {
      return;
    }

    try {
      file.cloudinaryUrl = await uploadBufferToCloudinary(
        file,
        getCloudinaryFolder(file.fieldname),
      );
    } catch (err) {
      // Fallback: save file to local uploads directory so previous behavior remains.
      // Map fieldname to local upload folder (mirrors middleware paths)
      const uploadsRoot = path.resolve(process.cwd(), "uploads");
      const mapping = {
        profileImage: path.join(uploadsRoot, "users", "profiles"),
        image: path.join(uploadsRoot, "categories", "images"),
        eventGallery: path.join(uploadsRoot, "events", "gallery"),
        eventImage: path.join(uploadsRoot, "events", "images"),
        eventImages: path.join(uploadsRoot, "events", "images"),
        serviceGallery: path.join(uploadsRoot, "services", "gallery"),
        gallery: path.join(uploadsRoot, "services", "gallery")
      };

      const folder = mapping[file.fieldname] || path.join(uploadsRoot, "services", "images");
      fs.mkdirSync(folder, { recursive: true });

      const extension = path.extname(file.originalname) || ".jpg";
      const sanitizedBaseName = path
        .basename(file.originalname, extension)
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
      const filename = `${Date.now()}-${sanitizedBaseName}${extension.toLowerCase()}`;
      const savedPath = path.join(folder, filename);

      try {
        fs.writeFileSync(savedPath, file.buffer);
        // set file.path so other parts of the app can use the local path
        file.path = savedPath;
        file.cloudinaryUrl = null;
      } catch (fsErr) {
        // If even local write fails, rethrow the original cloudinary error for visibility
        throw err;
      }
    }
  };

  if (req.file) {
    await uploadSingle(req.file);
    return;
  }

  if (!req.files) {
    return;
  }

  const files = Object.values(req.files).flat();
  await Promise.all(files.map(uploadSingle));
};

const withCloudinaryUpload = (multerHandler) => (req, res, next) => {
  multerHandler(req, res, async (error) => {
    if (error) {
      next(error);
      return;
    }

    if (!isCloudinaryConfigured) {
      next();
      return;
    }

    try {
      await processCloudinaryUploads(req);
      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
};

export { withCloudinaryUpload, isCloudinaryConfigured };
