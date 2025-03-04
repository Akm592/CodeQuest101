
import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 w-screen">
            <div className="flex flex-col items-center">
                <Frown size={64} className="text-gray-600 mb-4" />
                <h1 className="text-5xl font-bold text-gray-800 mb-2">404</h1>
                <p className="text-lg text-gray-600 mb-6">
                    Oops! The page you are looking for doesn't exist.
                </p>
                <Link
                    to="/"
                    className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
