import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, FileText, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ProgressBar';

const Success: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract session_id from URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // If no session_id is present, redirect to home
    if (!sessionId) {
      navigate('/', { replace: true });
      return;
    }

    // Verify payment status
    const verifyPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/.netlify/functions/verifyPayment?session_id=${sessionId}`);
        const data = await response.json();

        if (response.ok && data.paid) {
          setVerified(true);
          // If we have state data in sessionStorage, keep it for PDF generation
        } else {
          throw new Error(data.error || 'Pagamento não confirmado');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Não foi possível verificar o seu pagamento. Por favor, contacte o suporte.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={3} />
          
          <div className="mb-8">
            <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Voltar para a página inicial</span>
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">
            {verified ? 'Pagamento Confirmado' : 'A Verificar Pagamento'}
          </h1>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-lg text-slate-700">A verificar o seu pagamento...</p>
              </div>
            ) : error ? (
              <div className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 text-center mb-4">Ocorreu um Problema</h2>
                <p className="text-slate-700 text-center mb-6">{error}</p>
                <div className="flex justify-center">
                  <Link to="/review">
                    <Button variant="primary">
                      Voltar à Revisão
                    </Button>
                  </Link>
                </div>
              </div>
            ) : verified ? (
              <div className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 text-center mb-4">Pagamento Bem-Sucedido!</h2>
                <p className="text-slate-700 text-center mb-6">
                  O seu pagamento foi confirmado. Já pode descarregar a sua carta de contestação.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/review">
                    <Button
                      variant="primary"
                      size="large"
                      icon={<Download className="w-5 h-5" />}
                    >
                      Descarregar Carta
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button
                      variant="secondary"
                      size="large"
                      icon={<FileText className="w-5 h-5" />}
                    >
                      Nova Contestação
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
          
          {verified && (
            <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-medium text-slate-900 mb-2">Próximos Passos:</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Descarregue a sua carta de contestação</li>
                <li>Imprima o documento</li>
                <li>Assine no local indicado</li>
                <li>Envie por correio registado para a entidade emissora da multa</li>
                <li>Guarde o comprovativo de envio</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Success;