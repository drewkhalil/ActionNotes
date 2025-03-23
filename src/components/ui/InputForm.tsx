import React from 'react';
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Loader2, Crown } from "lucide-react";
import UsageCounter from './UsageCounter';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface InputFormProps {
  title: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
  placeholder: string;
  submitText: string;
  feature: 'recap' | 'teach' | 'quiz';
}

const InputForm: React.FC<InputFormProps> = ({
  title,
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing,
  placeholder,
  submitText,
  feature
}) => {
  const { userPlan, setIsUpgradeOpen } = useSubscription();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {userPlan === 'free' && (
            <Button
              onClick={() => setIsUpgradeOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              size="sm"
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade</span>
            </Button>
          )}
        </div>
        <UsageCounter feature={feature} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-64 mb-4"
          />
          <Button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className={`w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white ${
              isProcessing ? 'opacity-50' : ''
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </div>
            ) : (
              submitText
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default InputForm; 