import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const UpgradeCancelled: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Upgrade Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your upgrade process was cancelled. No charges were made.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You will be redirected to the homepage in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default UpgradeCancelled; 