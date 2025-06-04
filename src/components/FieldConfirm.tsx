import React from 'react';
import { useField } from 'formik';

interface FieldConfirmProps {
  label: string;
  name: string;
  confidence: number;
  helper?: string;
}

const FieldConfirm: React.FC<FieldConfirmProps> = ({ label, name, confidence, helper }) => {
  const [field, meta] = useField(name);
  
  const colors = confidence >= 0.9 
    ? 'bg-green-100 text-green-800' 
    : confidence >= 0.75 
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span 
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors}`}
            title={`Confiança da extração: ${Math.round(confidence * 100)}%`}
          >
            {confidence >= 0.9 ? 'Alta' : confidence >= 0.75 ? 'Verificar' : 'Baixa'}
          </span>
        </div>
        
        <input
          {...field}
          id={name}
          className={`
            pl-20 w-full rounded-md shadow-sm 
            ${meta.error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
            }
            ${confidence < 0.75 ? 'border-red-300' : ''}
          `}
          aria-describedby={`${name}-error`}
        />
      </div>

      {meta.error ? (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`} role="alert">
          {meta.error}
        </p>
      ) : helper ? (
        <p className="mt-1 text-sm text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
};

export default FieldConfirm;