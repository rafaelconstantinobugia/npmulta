import React, { useState } from 'react';
import { Purchases } from '@revenuecat/purchases-js';
import Button from './Button';
import { CreditCard, Loader, Tag } from 'lucide-react';

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
  const [discountAmount, setDiscountAmount] = useState(0); // 0, 10, 20, or 100 percent

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

      // If 100% discount, redirect to success page without payment
      if (discountAmount === 100) {
        window.location.href = '/success';
        return;
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

    // Normalize discount code (uppercase and trim)
    const normalizedCode = discountCode.toUpperCase().trim();

    // Check for valid discount codes
    if (normalizedCode === 'PRIMEIRO10' || normalizedCode === 'WELCOME10' || normalizedCode === 'LANCAMENTO10' || normalizedCode === 'LANÇAMENTO10') {
      setDiscountApplied(true);
      setDiscountAmount(10);
      setDiscountError(null);
    } else if (normalizedCode === 'WELCOME20' || normalizedCode === 'ESTUDANTE20') {
      setDiscountApplied(true);
      setDiscountAmount(20);
      setDiscountError(null);
    } else if (normalizedCode === 'TEST100') {
      setDiscountApplied(true);
      setDiscountAmount(100);
      setDiscountError(null);
    } else {
      setDiscountError('Código de desconto inválido. Por favor, tente outro código.');
    }
  };

  // Calculate the discounted price
  const getPrice = () => {
    const originalPrice = 990; // €9.90 in cents
    if (discountAmount === 100) return 0;
    return originalPrice - (originalPrice * discountAmount / 100);
  };

  // Format price for display (€9.90 or €0.00)
  const getFormattedPrice = () => {
    const priceInCents = getPrice();
    return `€${(priceInCents / 100).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="mt-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            Código de desconto
          </label>
          {discountApplied && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {discountAmount === 100 ? '100% desconto!' : `${discountAmount}% desconto`}
            </span>
          )}
        </div>
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
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50"
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
          <div className="mt-1 text-sm text-green-600">
            {discountAmount === 100 ? 
              'Desconto de 100% aplicado! A carta será gratuita.' :
              `Desconto de ${discountAmount}% aplicado!`}
          </div>
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
        {loading ? 'A processar...' : 
          discountAmount === 100 ? 'Obter carta gratuitamente' : 
          `Pagar ${getFormattedPrice()} e obter carta`}
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