import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Miguel Silva',
    location: 'Lisboa',
    rating: 5,
    text: 'Recebi uma multa por excesso de velocidade e consegui anulá-la com a ajuda deste serviço. O processo foi extremamente fácil e eficaz!',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
  },
  {
    name: 'Ana Ferreira',
    location: 'Porto',
    rating: 5,
    text: 'Fiquei surpresa com a facilidade de utilização. Em menos de 10 minutos tinha o documento pronto a enviar. A multa foi anulada em 3 semanas.',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
  },
  {
    name: 'João Martins',
    location: 'Coimbra',
    rating: 4,
    text: 'Muito útil! Consegui contestar uma multa de estacionamento indevido e tive sucesso. Recomendo a todos que recebam multas injustas.',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
  }
];

const Testimonials: React.FC = () => {
  return (
    <section id="testemunhos" className="py-16 bg-blue-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            O que dizem os nossos utilizadores
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Já ajudámos milhares de portugueses a contestar multas com sucesso.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.location}</div>
                </div>
              </div>
              
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} 
                  />
                ))}
              </div>
              
              <p className="text-slate-700">{testimonial.text}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-white rounded-xl p-8 shadow-md max-w-3xl mx-auto animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">94%</div>
              <div className="text-lg font-medium text-slate-900">Taxa de Satisfação</div>
              <div className="flex mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-slate-700 italic">
                "Mais de 5.000 multas contestadas com sucesso utilizando o nosso serviço. A nossa equipa trabalha constantemente para melhorar o sistema e aumentar as chances de sucesso das contestações."
              </p>
              <div className="mt-4 font-medium text-slate-900">Equipa Não Pagues a Multa</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;