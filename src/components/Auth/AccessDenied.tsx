// ../../../src/components/Auth/AccessDenied.tsx
// Code for the AccessDenied component
import { Link } from "react-router-dom";

export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-5xl font-bold text-red-500 mb-4">🔒</div>
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        You need to be signed in to access this page. Please sign in to
        continue.
      </p>
      <Link to="/login">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
          Sign In
        </button>
      </Link>
    </div>
  );
};
