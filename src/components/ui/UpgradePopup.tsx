import React from 'react';
import { Button } from "./button";
import { X } from "lucide-react";

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'starter' | 'ultimate') => void;
}

const UpgradePopup: React.FC<UpgradePopupProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Upgrade to Premium
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Starter Plan */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-6 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
            <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Starter Plan</h3>
            <div className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              $1.99<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300">
              <li>✓ 30 uses per month</li>
              <li>✓ Access to all services</li>
              <li>✓ Priority support</li>
              <li>✓ No ads</li>
            </ul>
            <Button 
              onClick={() => onUpgrade('starter')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            >
              Get Started
            </Button>
          </div>

          {/* Ultimate Plan */}
          <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-6 bg-gradient-to-b from-blue-100 to-white dark:from-gray-800 dark:to-gray-900 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Ultimate Plan</h3>
            <div className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              $5.99<span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300">
              <li>✓ Unlimited uses</li>
              <li>✓ Access to all services</li>
              <li>✓ Priority support</li>
              <li>✓ No ads</li>
              <li>✓ Advanced features</li>
              <li>✓ Early access to new features</li>
            </ul>
            <Button 
              onClick={() => onUpgrade('ultimate')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            >
              Get Ultimate
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Free plan includes 3 uses per week. Upgrade to get more!</p>
          <p className="mt-2">All plans include a 7-day money-back guarantee</p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePopup; 