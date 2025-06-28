import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone, FileRejection, Accept } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploaderProps {
  onFileAccepted: (file: File) => void;
  existingImageUrl?: string | null;
  onRemoveImage: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onFileAccepted, 
  existingImageUrl,
  onRemoveImage 
}) => {
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);

  useEffect(() => {
    setPreview(existingImageUrl || null);
  }, [existingImageUrl]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      alert(fileRejections[0].errors[0].message);
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileAccepted(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering the dropzone click
    if (preview) {
        if (preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
    }
    setPreview(null);
    onRemoveImage();
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const renderPreview = () => (
    <div className="relative h-40 w-40 mx-auto" data-cy="image-preview">
      <Image
        src={preview}
        alt="Item preview"
        width={160}
        height={160}
        style={{ objectFit: 'cover' }}
        className="rounded"
        unoptimized={preview.startsWith('blob:')}
      />
      <button
        type="button"
        onClick={handleRemove}
        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 z-10"
        aria-label="Remove image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );

  const renderPlaceholder = () => (
    <>
      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex text-sm text-gray-600">
        <span className="relative font-medium text-blue-600 hover:text-blue-500">
          Upload an image
        </span>
        <p className="pl-1">or drag and drop</p>
      </div>
      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
    </>
  );

  return (
    <div {...getRootProps({ className: 'dropzone' })} data-cy="image-uploader">
      <input {...getInputProps()} />
      {preview ? renderPreview() : renderPlaceholder()}
    </div>
  );
};

export default ImageUploader; 