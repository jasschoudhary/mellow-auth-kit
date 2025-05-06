
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Determine if this is likely an API error
  const isApiPath = location.pathname.startsWith('/api/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          {isApiPath ? "API Endpoint Not Found" : "Oops! Page not found"}
        </p>
        
        {isApiPath && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 text-left">
            <h2 className="font-bold text-amber-800 mb-2">API Server Error</h2>
            <p className="text-amber-700 mb-3">
              The API endpoint <code className="bg-amber-100 px-1 rounded">{location.pathname}</code> could not be found.
            </p>
            <p className="text-sm text-amber-600">
              This typically means that either:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-600 mt-1">
              <li>The server is not running (check your terminal)</li>
              <li>The API endpoint path is incorrect</li>
              <li>CORS settings are preventing the request</li>
            </ul>
          </div>
        )}
        
        <Link to="/">
          <Button className="bg-blue-500 hover:bg-blue-600">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
