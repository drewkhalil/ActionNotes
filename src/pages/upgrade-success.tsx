import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const UpgradeSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Verify the session with your backend
        const response = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify subscription');
        }

        // Wait for 3 seconds to show success message
        await new Promise(resolve => setTimeout(resolve, 3000));
        navigate('/');
      } catch (error) {
        console.error('Error verifying subscription:', error);
        navigate('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Thank you for upgrading!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {isVerifying
            ? 'Verifying your subscription...'
            : 'Your subscription has been activated successfully.'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You will be redirected to the homepage in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default UpgradeSuccess; 