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
    <div className="min-h-screen bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark-text mb-8">
            Upload PDF Documents
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            Upload your PDF documents to extract and store their content.
          </p>
        </div>

        <PdfUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {uploadedPdfs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-dark-text mb-4">
              Uploaded PDFs
            </h2>
            <div className="bg-dark-card shadow overflow-hidden sm:rounded-md border border-dark-border">
              <ul className="divide-y divide-dark-border">
                {uploadedPdfs.map((pdf) => (
                  <li key={pdf.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-dark-text">
                          {pdf.originalName}
                        </p>
                        <p className="text-sm text-gray-400">
                          Uploaded on{" "}
                          {new Date(pdf.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-400">
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
