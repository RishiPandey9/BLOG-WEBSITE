/**
 * Cloudinary — server-only
 * Used exclusively in API routes for image uploads.
 * NEVER import this in client components.
 */

import { v2 as cloudinary } from 'cloudinary';

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    configured = true;
  }
  return cloudinary;
}

/** Returns true if all Cloudinary env vars are present. */
export function cloudinaryAvailable(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a Buffer to Cloudinary.
 * @param buffer  — raw file bytes
 * @param folder  — Cloudinary folder (e.g. "blog-covers", "avatars")
 * @param mimeType — e.g. "image/jpeg"
 * @returns secure HTTPS URL of the uploaded asset
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  mimeType: string,
): Promise<string> {
  const cld = getCloudinary();
  if (!cld) throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.');

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: mimeType === 'image/webp' ? 'webp' : undefined,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('Cloudinary returned no URL'));
        resolve(result.secure_url);
      },
    );
    uploadStream.end(buffer);
  });
}
