import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Send, Download, Eye, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import { DadosMulta } from '../types/multa';
import { generateLetter } from '../utils/generateLetter';
import ProgressBar from '../components/ProgressBar';
import CheckoutButton from '../components/ui/CheckoutButton';
import { Purchases } from '@revenuecat/purchases-js';

const Review: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state as DadosMulta;
  const [formData, setFormData] = useState<DadosMulta & { justificativa?: string }>(
    { ...initialData, justificativa: '' }
  );
  
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  
  const isFree = import.meta.env.VITE_FREE_MODE === 'true';

  // Check if user has already paid
  useEffect(() => {
    const checkEntitlement = async () => {
      try {
        if (isFree) {
          setHasPaid(true);
          return;
        }
        
        const info = await Purchases.getCustomerInfo();
        if (info.entitlements.active.carta_pdf) {
          setHasPaid(true);
        }
      } catch (error) {
        console.error('Error checking entitlement:', error);
      }
    };
    
    checkEntitlement();
  }, [isFree]);

  // Store form data in localStorage for access after payment
  useEffect(() => {
    if (initialData) {
      localStorage.setItem('multa_data', JSON.stringify(formData));
    }
  }, [formData, initialData]);

  // Redirect to upload if no data is available
  useEffect(() => {
    if (!initialData) {
      navigate('/upload', { replace: true });
    }
  }, [initialData, navigate]);

  if (!initialData) {
    return null; // Return early if no data (will redirect via effect)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateLetter = async () => {
    try {
      setGenerating(true);
      const pdfBlob = await generateLetter(formData);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setGenerating(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGenerating(false);
      alert('Ocorreu um erro ao gerar a carta. Por favor, tente novamente.');
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', `contestacao-${formData.matricula}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      setEmailError('Por favor, insira um endereço de email válido.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Por favor, insira um endereço de email válido.');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError(null);

      const response = await fetch('/.netlify/functions/sendLetter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          pdf: 'simulated-pdf-content' // In a real app, you might want to send the actual PDF data
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setSendingEmail(false);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailError('Ocorreu um erro ao enviar o email. Por favor, tente novamente.');
      setSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={pdfUrl ? 3 : 2} />
          
          <div className="flex items-center mb-6">
            <Link to="/upload" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Voltar ao Upload</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
            {pdfUrl ? 'Contestação Gerada' : 'Edite os dados da contestação'}
          </h1>
          
          {!pdfUrl && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 bg-blue-50">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-slate-900">Dados para a Contestação</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="nomeCondutor" className="block text-sm font-medium text-slate-700 mb-1">
                      Nome do Condutor
                    </label>
                    <input 
                      type="text" 
                      id="nomeCondutor" 
                      name="nomeCondutor" 
                      value={formData.nomeCondutor} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="matricula" className="block text-sm font-medium text-slate-700 mb-1">
                      Matrícula
                    </label>
                    <input 
                      type="text" 
                      id="matricula" 
                      name="matricula" 
                      value={formData.matricula} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="data" className="block text-sm font-medium text-slate-700 mb-1">
                      Data da Infração
                    </label>
                    <input 
                      type="text" 
                      id="data" 
                      name="data" 
                      value={formData.data} 
                      onChange={handleInputChange}
                      placeholder="DD-MM-YYYY"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="hora" className="block text-sm font-medium text-slate-700 mb-1">
                      Hora da Infração
                    </label>
                    <input 
                      type="text" 
                      id="hora" 
                      name="hora" 
                      value={formData.hora} 
                      onChange={handleInputChange}
                      placeholder="HH:MM"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="local" className="block text-sm font-medium text-slate-700 mb-1">
                      Local
                    </label>
                    <input 
                      type="text" 
                      id="local" 
                      name="local" 
                      value={formData.local} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="infracao" className="block text-sm font-medium text-slate-700 mb-1">
                      Infração
                    </label>
                    <input 
                      type="text" 
                      id="infracao" 
                      name="infracao" 
                      value={formData.infracao} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="justificativa" className="block text-sm font-medium text-slate-700 mb-1">
                    Justificativa da Contestação
                  </label>
                  <textarea
                    id="justificativa"
                    name="justificativa"
                    rows={6}
                    value={formData.justificativa}
                    onChange={handleInputChange}
                    placeholder="Descreva os motivos da sua contestação..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                  <p className="mt-1 text-sm text-slate-500">
                    Se deixar em branco, serão usados argumentos padrão.
                  </p>
                </div>
              </div>
              
              {!isFree && (
                <div className="px-6 pb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                    <h3 className="font-medium text-slate-900 mb-2">Pagar para Obter a Carta</h3>
                    <p className="text-slate-700 text-sm">
                      Para gerar e descarregar a carta de contestação personalizada, é necessário efetuar o pagamento único de €9,90.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email para receber confirmação
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="seu-email@exemplo.com"
                    />
                  </div>
                  
                  <CheckoutButton email={email} disabled={!email} />
                </div>
              )}
            </div>
          )}
          
          {pdfUrl ? (
            <div className="bg-green-50 rounded-xl shadow-md p-6 mb-8 border border-green-200">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900">Carta de Contestação Gerada!</h2>
              </div>
              
              <p className="text-slate-700 mb-6">
                A sua carta de contestação foi gerada com sucesso. Pode agora descarregá-la ou visualizá-la no seu navegador.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <Button
                  variant="primary"
                  size="large"
                  icon={<Download className="w-5 h-5" />}
                  onClick={handleDownloadPdf}
                >
                  Descarregar PDF
                </Button>
                
                <Button
                  variant="secondary"
                  size="large"
                  icon={<Eye className="w-5 h-5" />}
                  onClick={handleViewPdf}
                >
                  Visualizar PDF
                </Button>
              </div>

              <div className="mt-8 border-t border-green-200 pt-6">
                <div className="flex items-center mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={sendViaEmail}
                      onChange={(e) => setSendViaEmail(e.target.checked)}
                    />
                    <span className="ml-2 text-slate-700">Enviar carta por email</span>
                  </label>
                </div>

                {sendViaEmail && (
                  <div className="animate-fadeIn">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                        Endereço de email
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`w-full px-3 py-2 border ${emailError ? 'border-red-300' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="seu-email@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={emailSent}
                      />
                      {emailError && (
                        <p className="mt-1 text-sm text-red-600">{emailError}</p>
                      )}
                    </div>
                    
                    {emailSent ? (
                      <div className="flex items-center text-green-600 mb-4">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span>Email enviado com sucesso!</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        icon={<Mail className="w-5 h-5" />}
                        onClick={handleSendEmail}
                        className={sendingEmail ? "opacity-75 cursor-not-allowed" : ""}
                        disabled={sendingEmail || !email}
                      >
                        {sendingEmail ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            A Enviar...
                          </>
                        ) : (
                          "Enviar por Email"
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : hasPaid || isFree ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="primary"
                size="large"
                icon={<Send className="w-5 h-5" />}
                onClick={handleGenerateLetter}
                className={generating ? "opacity-75 cursor-not-allowed" : ""}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    A Gerar Carta...
                  </>
                ) : (
                  isFree ? "Gerar Carta (Modo Teste)" : "Gerar Carta de Recurso"
                )}
              </Button>
              
              <Button
                variant="secondary"
                size="large"
                onClick={() => navigate('/upload')}
                disabled={generating}
              >
                Voltar
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Review;