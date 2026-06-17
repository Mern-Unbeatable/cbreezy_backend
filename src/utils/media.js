const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export const toPublicUploadPath = (filePath) =>
  `/${filePath.split("uploads")[1].replace(/\\/g, "/").replace(/^\//, "uploads/")}`;

export const toAbsoluteMediaUrl = (baseUrl, mediaPath) => {
  if (!mediaPath) {
    return mediaPath;
  }

  if (ABSOLUTE_URL_PATTERN.test(mediaPath)) {
    return mediaPath;
  }

  const normalizedPath = mediaPath.startsWith("/")
    ? mediaPath
    : `/${mediaPath}`;
  return `${baseUrl}${normalizedPath}`;
};

export const getUploadedFileUrl = (file) => {
  if (!file) {
    return undefined;
  }

  if (file.cloudinaryUrl) {
    return file.cloudinaryUrl;
  }

  if (file.path) {
    return toPublicUploadPath(file.path);
  }

  return undefined;
};
