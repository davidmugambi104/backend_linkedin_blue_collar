import { axiosClient } from '@lib/axios';
import { ENV } from '@config/env';

interface SignedUploadUrlResponse {
  url: string;
  fields: Record<string, string>;
}

export class UploadService {
  private static instance: UploadService;
  private uploadQueue: Map<string, Promise<string>> = new Map();

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }

    return UploadService.instance;
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;

    if (this.uploadQueue.has(fileId)) {
      return this.uploadQueue.get(fileId)!;
    }

    const uploadPromise = this.performUpload(file, onProgress);
    this.uploadQueue.set(fileId, uploadPromise);

    try {
      return await uploadPromise;
    } finally {
      this.uploadQueue.delete(fileId);
    }
  }

  private async performUpload(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { url, fields } = await this.getSignedUploadUrl(file.name, file.type);

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    const uploadPromise = new Promise<string>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress((event.loaded / event.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const key = fields.key || file.name;
          const cdnBase = ENV.VITE_CDN_URL || ENV.VITE_API_URL;
          resolve(`${cdnBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`);
          return;
        }

        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    });

    xhr.open('POST', url);
    xhr.send(formData);

    return uploadPromise;
  }

  private async getSignedUploadUrl(fileName: string, fileType: string): Promise<SignedUploadUrlResponse> {
    return axiosClient.post<SignedUploadUrlResponse>('/uploads/signed-url', {
      fileName,
      fileType,
    });
  }
}

export const uploadService = UploadService.getInstance();
