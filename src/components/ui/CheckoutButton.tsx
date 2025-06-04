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

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

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

  return (
    <div className="mt-6">
      <Button
        variant="primary"
        size="large"
        icon={loading ? <Loader className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
        onClick={handlePayment}
        className="w-full"
        disabled={disabled || loading}
      >
        {loading ? 'A processar...' : 'Pagar €9,90 e obter carta'}
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