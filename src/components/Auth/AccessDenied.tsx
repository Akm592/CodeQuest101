import { Link } from "react-router-dom";
import { Lock } from "lucide-react"; // Using Lock icon

export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-950 text-gray-300 p-4 w-screen"> {/* Adjusted height and added bg */}
      <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-red-900/30 border border-red-500/50">
                <Lock className="h-10 w-10 text-red-400" /> {/* Adjusted icon and color */}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-3">Access Denied</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Authentication is required to view this page. Please sign in first.
          </p>
          <Link to="/login">
            {/* Use the standard dark theme Button styling */}
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-950">
              Go to Sign In
            </button>
          </Link>
      </div>
    </div>
  );
};