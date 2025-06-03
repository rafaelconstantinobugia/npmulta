import React from 'react';
import { FileUp, FileText, Send, ThumbsUp } from 'lucide-react';

const steps = [
  {
    icon: <FileUp className="w-8 h-8 text-white" />,
    title: 'Carregue a sua multa',
    description: 'Faça upload da notificação que recebeu por carta ou email.'
  },
  {
    icon: <FileText className="w-8 h-8 text-white" />,
    title: 'Analisamos o documento',
    description: 'O nosso sistema analisa os dados e encontra potenciais falhas para contestação.'
  },
  {
    icon: <Send className="w-8 h-8 text-white" />,
    title: 'Obtenha a sua contestação',
    description: 'Receba um documento personalizado pronto a enviar para as autoridades.'
  },
  {
    icon: <ThumbsUp className="w-8 h-8 text-white" />,
    title: 'Envie e aguarde resposta',
    description: 'Envie o documento e espere pela decisão das autoridades competentes.'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona\" className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Um processo simples e rápido para contestar a sua multa em poucos passos.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/4 left-full w-full h-0.5 bg-blue-200 z-0 transform -translate-y-1/2">
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-blue-200"></div>
                </div>
              )}
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Link to="/upload" className="mt-16 text-center block">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Carregar Multa Agora
          </button>
        </Link>
      </div>
    </section>
};

export default HowItWorks;