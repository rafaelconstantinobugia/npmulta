import React from 'react';
import { FileUp, ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-8 animate-fadeInUp">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900 mb-6">
              Contestação fácil de multas rodoviárias em Portugal
            </h1>
            <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed">
              Carregue a sua multa e gere automaticamente uma carta de recurso pronta a enviar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/upload">
                <Button 
                  variant="primary" 
                  size="large"
                  icon={<FileUp className="h-5 w-5" />}
                >
                  Carregar Multa
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                size="large"
                icon={<ArrowRight className="h-5 w-5" />}
              >
                Saber Mais
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-slate-600">
              <div className="flex -space-x-2">
                <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
                <img src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
              </div>
              <span className="text-sm">Mais de 5.000 multas contestadas com sucesso</span>
            </div>
          </div>
          <div className="md:w-1/2 animate-fadeInRight">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white rounded-xl shadow-xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/8396576/pexels-photo-8396576.jpeg?auto=compress&cs=tinysrgb&w=800" 
                  alt="Traffic ticket document" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <div className="font-medium mb-1">Recurso Automático</div>
                    <div className="text-sm text-slate-200">Poupe tempo e dinheiro com o nosso sistema</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;