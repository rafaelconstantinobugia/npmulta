import React from 'react';
import Button from './Button';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CheckoutButtonProps {
  email?: string;
  disabled?: boolean;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ disabled = false }) => {
  // Store the form data in localStorage when proceeding
  const handleContinue = () => {
    // Data is already stored in localStorage in the Review component
  };

  return (
    <div className="mt-6">
      <Link to="/success" onClick={handleContinue}>
        <Button
          variant="primary"
          size="large"
          icon={<FileText className="w-5 h-5" />}
          className="w-full"
          disabled={disabled}
        >
          Obter carta gratuitamente
        </Button>
      </Link>
      
      <p className="mt-2 text-xs text-slate-500 text-center">
        O serviço é completamente gratuito para uso pessoal.
      </p>
    </div>
  );
};

export default CheckoutButton;