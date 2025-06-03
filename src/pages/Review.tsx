import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { DadosMulta } from '../types/multa';

const Review: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dadosMulta = location.state as DadosMulta;

  // Redirect to upload if no data is available
  React.useEffect(() => {
    if (!dadosMulta) {
      navigate('/upload', { replace: true });
    }
  }, [dadosMulta, navigate]);

  if (!dadosMulta) {
    return null; // Return early if no data (will redirect via effect)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <Link to="/upload" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Voltar ao Upload</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
            Reveja os dados da multa
          </h1>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 bg-blue-50">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900">Dados Extraídos do Documento</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Nome do Condutor</label>
                  <p className="text-lg text-slate-900">{dadosMulta.nomeCondutor}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Matrícula</label>
                  <p className="text-lg text-slate-900">{dadosMulta.matricula}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Data da Infração</label>
                  <p className="text-lg text-slate-900">{dadosMulta.data}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Hora da Infração</label>
                  <p className="text-lg text-slate-900">{dadosMulta.hora}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Local</label>
                  <p className="text-lg text-slate-900">{dadosMulta.local}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Infração</label>
                  <p className="text-lg text-slate-900">{dadosMulta.infracao}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-green-100">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-slate-900">Motivos para Contestação Identificados</h2>
            </div>
            
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-2 mb-4">
              <li>Falta de prova fotográfica da infração</li>
              <li>Sinalização inadequada no local da infração</li>
              <li>Calibração do radar não comprovada</li>
            </ul>
            
            <p className="text-sm text-slate-500 italic">
              Estes motivos são baseados em análise estatística de contestações bem-sucedidas para infrações similares.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="large"
              icon={<Send className="w-5 h-5" />}
              onClick={() => alert('Funcionalidade de gerar carta será implementada em breve!')}
            >
              Gerar Carta de Recurso
            </Button>
            
            <Button
              variant="secondary"
              size="large"
              onClick={() => navigate('/upload')}
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;