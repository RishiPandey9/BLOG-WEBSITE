/**
 * POST /api/upload
 * Uploads a file to Cloudinary and returns the secure public URL.
 * Firebase is used for auth/db only; all media goes through Cloudinary.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cloudinaryAvailable, uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!cloudinaryAvailable()) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local.' },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) ?? 'blog-uploads';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP, and GIF images are allowed.' },
      { status: 400 }
    );
  }

  // Validate file size (max 10 MB — Cloudinary free tier allows up to 10 MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 10 MB.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const url = await uploadToCloudinary(buffer, folder, file.type);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    console.error('[Upload/Cloudinary] Error:', err);
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
