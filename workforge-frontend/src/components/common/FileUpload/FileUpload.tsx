import React, { useCallback, useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';
import { Spinner } from '@components/ui/Spinner';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  label?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = 'image/*,.pdf',
  maxSize = 5,
  multiple = false,
  label = 'Upload file',
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const mimeType = type.replace('*', '');
          return file.type.startsWith(mimeType);
        }
        return type === file.type || type === `.${file.name.split('.').pop()}`;
      });

      if (!isValidType) {
        setError(`File type not accepted. Accepted types: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      if (!validateFile(file)) continue;
      
      try {
        setIsUploading(true);
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    }
  }, [onUpload, validateFile]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (!validateFile(file)) continue;
      
      try {
        setIsUploading(true);
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <label
        className={cn(
          'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50 bg-bg-primary-900/20'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 bg-border-gray-600 bg-bg-gray-800 bg-hover:bg-gray-700',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <>
              <Spinner size="md" />
              <p className="mt-2 text-sm text-gray-500 bg-text-gray-400">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="w-8 h-8 mb-2 text-gray-500 bg-text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 bg-text-gray-400">
                <span className="font-semibold">{label}</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 bg-text-gray-400">
                {accept} (Max: {maxSize}MB)
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={isUploading}
        />
      </label>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 bg-text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};