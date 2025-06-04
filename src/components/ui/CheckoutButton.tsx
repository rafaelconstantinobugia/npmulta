import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Button from './Button';
import { CreditCard, Loader } from 'lucide-react';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB!);

interface CheckoutButtonProps {
  email: string;
  disabled?: boolean;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ email, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!email) {
      setError('Por favor, forneça um endereço de email válido.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create checkout session
      const response = await fetch('/.netlify/functions/createCheckout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar sessão de pagamento');
      }

      const { id: sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
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
        Pagamento seguro processado por Stripe. As suas informações de pagamento nunca são armazenadas nos nossos servidores.
      </p>
    </div>
  );
};

export default CheckoutButton;