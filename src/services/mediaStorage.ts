import { supabase } from './supabase';

export async function uploadStoreMedia(file: File): Promise<string> {
  if (!supabase) throw new Error('Media uploads require Supabase configuration.');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // 1. Yahan bucket ka naam 'ak-mala-media' karein
  const { error: uploadError } = await supabase.storage
    .from('ak-mala-media')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Yahan bhi bucket ka naam 'ak-mala-media' karein
  const { data } = supabase.storage
    .from('ak-mala-media')
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Failed to get public URL.');
  }

  return data.publicUrl;
}

export async function uploadStoreMediaWithAdminToken(file: File, adminToken: string): Promise<string> {
  const prepareResponse = await fetch('/api/admin/media/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ contentType: file.type, size: file.size })
  });
  const uploadDetails = (await prepareResponse.json()) as {
    uploadUrl?: string;
    publicUrl?: string;
    error?: string;
  };
  if (!prepareResponse.ok || !uploadDetails.uploadUrl || !uploadDetails.publicUrl) {
    throw new Error(uploadDetails.error || 'Could not prepare media upload.');
  }

  const uploadResponse = await fetch(uploadDetails.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  if (!uploadResponse.ok) {
    throw new Error('Media upload failed. Please try again.');
  }

  return uploadDetails.publicUrl;
}
