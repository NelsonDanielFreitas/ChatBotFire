import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface PdfUploadProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: any) => void;
}

const PdfUpload = ({ onUploadSuccess, onUploadError }: PdfUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        onUploadError?.("Please upload a PDF file");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("pdf", file);

      try {
        const response = await axios.post(
          "http://localhost:5000/api/pdfs/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0;
              setUploadProgress(progress);
            },
          }
        );

        onUploadSuccess?.(response.data);
      } catch (error) {
        onUploadError?.(error);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="space-y-4">
          <div className="text-4xl mb-4">📄</div>
          {isUploading ? (
            <div className="space-y-2">
              <p className="text-gray-600">Uploading PDF...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive
                  ? "Drop the PDF here"
                  : "Drag & drop a PDF file here"}
              </p>
              <p className="text-sm text-gray-500">or click to select a file</p>
              <p className="text-xs text-gray-400">
                Only PDF files are accepted
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
