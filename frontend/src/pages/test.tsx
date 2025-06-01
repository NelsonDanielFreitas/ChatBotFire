import { NextPage } from "next";

const TestPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-primary-600 mb-4">
          Tailwind Test
        </h1>
        <p className="text-gray-600 mb-4">
          This is a test page to verify if Tailwind CSS is working properly.
        </p>
        <button className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestPage;
