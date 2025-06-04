import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, FileText, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ProgressBar';
import { DadosMulta } from '../types/multa';
import { generateLetter } from '../utils/generateLetter';

const Success: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const generatePdf = async () => {
      try {
        setLoading(true);
        
        // Get stored data from localStorage
        const storedData = localStorage.getItem('multa_data');
        if (storedData) {
          const parsedData: DadosMulta = JSON.parse(storedData);
          
          // Generate the letter PDF
          const pdfBlob = await generateLetter(parsedData);
          const url = URL.createObjectURL(pdfBlob);
          setPdfUrl(url);
          
          // Auto-download the PDF
          const a = document.createElement('a');
          a.href = url;
          a.download = `contestacao-${parsedData.matricula || 'multa'}.pdf`;
          a.click();
        } else {
          setError('Não foi possível encontrar os dados da multa. Por favor, volte à página de revisão.');
        }
      } catch (err) {
        console.error('Error generating PDF:', err);
        setError('Ocorreu um erro ao gerar o documento. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    generatePdf();
  }, [navigate]);

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', 'carta-de-recurso.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
            Contestação Gerada
          </h1>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-lg text-slate-700">
                  A gerar a sua carta...
                </p>
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
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 text-center mb-4">
                  Carta Gerada com Sucesso!
                </h2>
                <p className="text-slate-700 text-center mb-6">
                  A sua carta de contestação foi gerada. O download já foi iniciado automaticamente.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    variant="primary"
                    size="large"
                    icon={<Download className="w-5 h-5" />}
                    onClick={handleDownloadPdf}
                  >
                    Descarregar Novamente
                  </Button>
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
            )}
          </div>
          
          {!loading && !error && (
            <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-medium text-slate-900 mb-2">Próximos Passos:</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Imprima a sua carta de contestação</li>
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