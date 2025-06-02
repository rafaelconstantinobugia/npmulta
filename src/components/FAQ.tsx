import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Quais tipos de multas posso contestar?',
    answer: 'O nosso serviço permite contestar vários tipos de multas de trânsito em Portugal, incluindo excesso de velocidade, estacionamento indevido, utilização do telemóvel, falta de documentação, entre outras. Algumas contraordenações ambientais e municipais também podem ser contestadas.'
  },
  {
    question: 'Qual é a taxa de sucesso das contestações?',
    answer: 'A nossa taxa de sucesso é de aproximadamente 70%. No entanto, isso varia consoante o tipo de infração e as circunstâncias específicas de cada caso. Quanto mais cedo contestar após receber a notificação, maiores são as hipóteses de sucesso.'
  },
  {
    question: 'Quanto tempo demora o processo de contestação?',
    answer: 'A geração da contestação é imediata. Após o envio às autoridades, o tempo de resposta pode variar entre 4 a 12 semanas, dependendo da entidade e da complexidade do caso.'
  },
  {
    question: 'Preciso de conhecimentos jurídicos para usar o serviço?',
    answer: 'Não, o nosso sistema foi desenvolvido para ser utilizado por qualquer pessoa. A interface é intuitiva e guia-o por todo o processo, sem necessidade de conhecimentos jurídicos específicos.'
  },
  {
    question: 'Quanto custa utilizar o serviço?',
    answer: 'O registo e análise inicial são gratuitos. Apenas cobramos uma taxa fixa de processamento se decidir prosseguir com a contestação, significativamente mais económica do que contratar um advogado.'
  },
  {
    question: 'E se a minha contestação não for aceite?',
    answer: 'Se a sua contestação não for aceite, oferecemos orientação sobre os próximos passos possíveis, incluindo recurso administrativo ou judicial. Em alguns casos, oferecemos reembolso parcial da nossa taxa de serviço.'
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tudo o que precisa de saber sobre o nosso serviço de contestação de multas.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="mb-4 border border-slate-200 rounded-lg overflow-hidden animate-fadeInUp"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                className="w-full text-left p-5 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium text-slate-900">{faq.question}</span>
                {openIndex === index ? 
                  <ChevronUp className="w-5 h-5 text-blue-600" /> : 
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                }
              </button>
              
              {openIndex === index && (
                <div className="p-5 bg-white border-t border-slate-200 animate-fadeIn">
                  <p className="text-slate-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center animate-fadeIn">
          <p className="text-slate-700 mb-6">
            Ainda tem dúvidas? Entre em contacto connosco.
          </p>
          <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-6 py-3 rounded-lg transition-all border border-blue-200">
            Contactar Suporte
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;