import { cloudinary } from "../config/cloudinary.js";

export function uploadBuffer({ buffer, filename, folder, resourceType = "auto" }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
        resource_type: resourceType
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function uploadFromUrl({ url, filename, folder, resourceType = "image" }) {
  return cloudinary.uploader.upload(url, {
    folder,
    public_id: filename || undefined,
    resource_type: resourceType,
    overwrite: true
  });
}

export async function deleteFile(publicId, resourceType = "raw") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
