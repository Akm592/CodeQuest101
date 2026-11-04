import { Link } from "react-router-dom";
import { Lock } from "lucide-react"; // Using Lock icon

export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-950 text-muted-foreground p-4 w-screen"> {/* Adjusted height and added bg */}
      <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-red-900/30 border border-destructive/50">
                <Lock className="h-10 w-10 text-destructive" /> {/* Adjusted icon and color */}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Access Denied</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Authentication is required to view this page. Please sign in first.
          </p>
          <Link to="/login">
            {/* Use the standard dark theme Button styling */}
            <button className="bg-primary hover:bg-primary text-primary-foreground px-8 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-950">
              Go to Sign In
            </button>
          </Link>
      </div>
    </div>
  );
};