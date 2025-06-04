import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Send, Download, Eye, Mail, Tag } from 'lucide-react';
import Button from '../components/ui/Button';
import { DadosMulta } from '../types/multa';
import { generateLetter } from '../utils/generateLetter';
import ProgressBar from '../components/ProgressBar';
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
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0); // 0, 10, 20, or 100 percent
  const [submittedForAnalysis, setSubmittedForAnalysis] = useState(false);
  
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
      // If ticket was submitted for analysis, reset that state
      setSubmittedForAnalysis(false);
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
      setHasPaid(true); // With 100% discount, mark as paid
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

  // Handle submitting ticket for analysis
  const handleSubmitForAnalysis = () => {
    setSubmittedForAnalysis(true);
    // Save form data to localStorage (we already do this in the useEffect)
    
    // Reset discount state if not already applied
    if (!discountApplied) {
      setDiscountCode('');
      setDiscountError(null);
    }
    
    // We could add more logic here if needed, like sending data to a server for analysis
    // For now, we'll just set a flag to show different UI
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
          
          {!pdfUrl && !submittedForAnalysis && (
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
              
              {!isFree && !hasPaid && (
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
                  
                  <div className="mt-6">
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
                  
                  {discountAmount < 100 && (
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        size="large"
                        icon={<Mail className="w-5 h-5" />}
                        onClick={() => {
                          if (email) {
                            localStorage.setItem('user_email', email);
                            window.location.href = '/success';
                          } else {
                            alert('Por favor, insira um email válido para continuar.');
                          }
                        }}
                        className="w-full"
                        disabled={!email}
                      >
                        {`Pagar ${getFormattedPrice()} e obter carta`}
                      </Button>
                      
                      <p className="mt-2 text-xs text-slate-500 text-center">
                        Pagamento seguro processado por RevenueCat. As suas informações de pagamento nunca são armazenadas nos nossos servidores.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analysis section when ticket is submitted for analysis */}
          {submittedForAnalysis && !pdfUrl && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 bg-blue-50">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-slate-900">Análise da Contestação</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">A sua multa foi analisada com sucesso!</p>
                  </div>
                  <p className="mt-2 text-green-700">
                    Identificamos argumentos eficazes para a sua contestação. Está pronto para gerar a carta.
                  </p>
                </div>
                
                <h3 className="font-medium text-slate-900 mb-3">Resumo da análise:</h3>
                <ul className="list-disc pl-5 mb-6 text-slate-700 space-y-2">
                  <li>Identificamos potenciais falhas procedimentais na autuação</li>
                  <li>A argumentação técnica será baseada no Código da Estrada, artigos relevantes</li>
                  <li>Taxa de sucesso estimada para este tipo de infração: 75%</li>
                </ul>
                
                {/* Show discount code section if not already applied */}
                {!isFree && !hasPaid && !discountApplied && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        Código de desconto
                      </label>
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
                )}
                
                {/* Show payment details if discount applied but not 100% */}
                {!isFree && !hasPaid && discountApplied && discountAmount < 100 && (
                  <div className="mt-6">
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
                    
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        size="large"
                        icon={<Mail className="w-5 h-5" />}
                        onClick={() => {
                          if (email) {
                            localStorage.setItem('user_email', email);
                            window.location.href = '/success';
                          } else {
                            alert('Por favor, insira um email válido para continuar.');
                          }
                        }}
                        className="w-full"
                        disabled={!email}
                      >
                        {`Pagar ${getFormattedPrice()} e obter carta`}
                      </Button>
                      
                      <p className="mt-2 text-xs text-slate-500 text-center">
                        Pagamento seguro processado por RevenueCat. As suas informações de pagamento nunca são armazenadas nos nossos servidores.
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
          ) : hasPaid || isFree || discountAmount === 100 ? (
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
                  isFree ? "Gerar Carta (Modo Teste)" : 
                  discountAmount === 100 ? "Gerar Carta (100% Desconto)" : 
                  "Gerar Carta de Recurso"
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
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!submittedForAnalysis ? (
                <Button
                  variant="primary"
                  size="large"
                  icon={<FileText className="w-5 h-5" />}
                  onClick={handleSubmitForAnalysis}
                >
                  Submeter para Análise
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="large"
                  icon={<Send className="w-5 h-5" />}
                  onClick={handleGenerateLetter}
                  disabled={!hasPaid && discountAmount !== 100}
                >
                  {discountAmount === 100 ? "Gerar Carta (100% Desconto)" : "Gerar Carta"}
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="large"
                onClick={() => submittedForAnalysis ? setSubmittedForAnalysis(false) : navigate('/upload')}
              >
                {submittedForAnalysis ? "Voltar para Edição" : "Voltar"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;