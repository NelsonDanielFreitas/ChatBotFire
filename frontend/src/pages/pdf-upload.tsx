import { useState } from "react";
import PdfUpload from "../components/PdfUpload";
import { toast } from "react-hot-toast";

export default function PdfUploadPage() {
  const [uploadedPdfs, setUploadedPdfs] = useState<any[]>([]);

  const handleUploadSuccess = (data: any) => {
    setUploadedPdfs((prev) => [...prev, data.data]);
    toast.success("PDF uploaded successfully!");
  };

  const handleUploadError = (error: any) => {
    toast.error(error?.response?.data?.message || "Error uploading PDF");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Upload PDF Documents
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload your PDF documents to extract and store their content.
          </p>
        </div>

        <PdfUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {uploadedPdfs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Uploaded PDFs
            </h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {uploadedPdfs.map((pdf) => (
                  <li key={pdf.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pdf.originalName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Uploaded on{" "}
                          {new Date(pdf.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {(pdf.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
