import React, { useState } from 'react';
import { Purchases } from '@revenuecat/purchases-js';
import Button from './Button';
import { CreditCard, Loader } from 'lucide-react';

interface CheckoutButtonProps {
  email?: string;
  disabled?: boolean;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ email, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // If in free mode, don't render the component at all
  if (import.meta.env.VITE_FREE_MODE === 'true') return null;

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Store email in localStorage for later use
      if (email) {
        localStorage.setItem('user_email', email);
      }

      const { customerInfo } = await Purchases.purchasePackageWith({
        packageIdentifier: 'carta_pdf',
      });

      if (customerInfo.entitlements.active.carta_pdf) {
        window.location.href = '/success';
      } else {
        throw new Error('O pagamento não foi concluído');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError('Por favor, insira um código de desconto válido.');
      return;
    }

    // Simulate checking discount code - in a real app this would be an API call
    if (discountCode.toUpperCase() === 'PRIMEIRO10' || discountCode.toUpperCase() === 'WELCOME20') {
      setDiscountApplied(true);
      setDiscountError(null);
    } else {
      setDiscountError('Código de desconto inválido. Por favor, tente outro código.');
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Código de desconto"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            disabled={discountApplied}
          />
          <button
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
            onClick={applyDiscount}
            disabled={discountApplied}
          >
            Aplicar
          </button>
        </div>
        {discountError && (
          <div className="mt-1 text-sm text-red-600">{discountError}</div>
        )}
        {discountApplied && (
          <div className="mt-1 text-sm text-green-600">Desconto aplicado com sucesso!</div>
        )}
      </div>

      <Button
        variant="primary"
        size="large"
        icon={loading ? <Loader className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        onClick={handlePayment}
        className="w-full"
        disabled={disabled || loading}
      >
        {loading ? 'A processar...' : discountApplied ? 'Pagar €7,90 e obter carta' : 'Pagar €9,90 e obter carta'}
      </Button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
      
      <p className="mt-2 text-xs text-slate-500 text-center">
        Pagamento seguro processado por RevenueCat. As suas informações de pagamento nunca são armazenadas nos nossos servidores.
      </p>
    </div>
  );
};

export default CheckoutButton;