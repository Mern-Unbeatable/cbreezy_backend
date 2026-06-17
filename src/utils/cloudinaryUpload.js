import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

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

    file.cloudinaryUrl = await uploadBufferToCloudinary(
      file,
      getCloudinaryFolder(file.fieldname),
    );
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
