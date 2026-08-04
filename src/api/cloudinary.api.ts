import axiosInstance from './axios';
import axiosRaw from 'axios';
export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

// ✅ cache per upload batch
let signaturePromise: Promise<CloudinarySignature> | null = null;

const normalizeSignatureResponse = (payload: unknown): CloudinarySignature => {
  if (payload && typeof payload === 'object') {
    const maybeEnvelope = payload as { data?: unknown };
    const candidate = maybeEnvelope.data ?? payload;

    if (
      candidate &&
      typeof candidate === 'object' &&
      'signature' in candidate &&
      'timestamp' in candidate &&
      'cloudName' in candidate &&
      'apiKey' in candidate
    ) {
      const normalized = candidate as Partial<CloudinarySignature>;

      if (
        typeof normalized.signature === 'string' &&
        typeof normalized.timestamp === 'number' &&
        typeof normalized.cloudName === 'string' &&
        typeof normalized.apiKey === 'string'
      ) {
        return normalized as CloudinarySignature;
      }
    }
  }

  throw new Error('Invalid Cloudinary signature response');
};

export const getUploadSignature = async (): Promise<CloudinarySignature> => {
  if (!signaturePromise) {
    signaturePromise = axiosInstance
      .get('/cloudinary/signature')
      .then((res) => normalizeSignatureResponse(res.data))
      .catch((err) => {
        signaturePromise = null;
        throw err;
      });
  }
  return signaturePromise;
};

// ✅ reset after upload batch finishes
export const resetCloudinarySignature = () => {
  signaturePromise = null;
};
export const uploadImageToCloudinary = async (file: File, onProgress?: (progress: number) => void): Promise<{
  url: string;
  publicId: string;
}> => {
  const signatureData = await getUploadSignature(); // 🔥 REQUIRED

  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signatureData.signature);
  formData.append('timestamp', signatureData.timestamp.toString());
  formData.append('api_key', signatureData.apiKey);
  formData.append('folder', signatureData.folder || 'kangaroo/properties');
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

  const response = await axiosRaw.post(cloudinaryUrl, formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

  return {
    url: response.data.secure_url,
    publicId: response.data.public_id,
  }
};