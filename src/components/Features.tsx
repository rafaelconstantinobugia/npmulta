import React from 'react';
import { Clock, ShieldCheck, Sparkles, Ban, Scale, Award } from 'lucide-react';

const features = [
  {
    icon: <Clock className="w-6 h-6 text-blue-600" />,
    title: 'Poupança de Tempo',
    description: 'Gere uma contestação em menos de 5 minutos, sem pesquisar legislação ou consultar advogados.'
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: 'Baseado na Legislação',
    description: 'Todas as contestações são fundamentadas na legislação portuguesa mais recente.'
  },
  {
    icon: <Sparkles className="w-6 h-6 text-blue-600" />,
    title: 'Fácil de Usar',
    description: 'Interface intuitiva que qualquer pessoa pode utilizar, sem conhecimentos técnicos ou jurídicos.'
  },
  {
    icon: <Ban className="w-6 h-6 text-blue-600" />,
    title: 'Sem Custos Iniciais',
    description: 'Comece a usar gratuitamente. Só paga se decidir enviar a contestação.'
  },
  {
    icon: <Scale className="w-6 h-6 text-blue-600" />,
    title: 'Legalmente Válido',
    description: 'Documentos prontos para enviar às autoridades competentes, com todos os requisitos legais.'
  },
  {
    icon: <Award className="w-6 h-6 text-blue-600" />,
    title: 'Alta Taxa de Sucesso',
    description: 'Mais de 70% das contestações geradas pelo nosso sistema são aceites pelas autoridades.'
  }
];

const Features: React.FC = () => {
  return (
    <section id="vantagens\" className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Porque usar o nosso serviço?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Oferecemos uma solução completa para contestar multas de trânsito de forma rápida, eficaz e fundamentada na lei.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-slate-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-blue-50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;