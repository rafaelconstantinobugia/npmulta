import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  currentStep: 1 | 2 | 3;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Upload' },
    { number: 2, label: 'Review' },
    { number: 3, label: 'Download Letter' },
  ];

  return (
    <div className="w-full py-6 mb-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-center justify-between">
          {/* Connecting Lines */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-slate-200 z-0"></div>
          
          {steps.map((step, index) => {
            // Determine step status
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            
            // Calculate styles based on status
            let circleClasses = "relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all";
            let textClasses = "mt-2 text-sm font-medium transition-colors";
            
            if (isCompleted) {
              circleClasses += " bg-blue-600 text-white";
              textClasses += " text-blue-600";
            } else if (isActive) {
              circleClasses += " bg-blue-600 text-white";
              textClasses += " text-blue-600";
            } else {
              circleClasses += " bg-slate-200 text-slate-500";
              textClasses += " text-slate-500";
            }
            
            return (
              <div key={step.number} className="flex flex-col items-center">
                <div className={circleClasses}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className={textClasses}>{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;