import React from 'react';
import { Shield, Mail, Phone, MapPin, FacebookIcon, TwitterIcon, InstagramIcon } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-lg mb-4">
              <Shield className="h-6 w-6" />
              <span>Não Pagues a Multa</span>
            </div>
            <p className="text-slate-400 mb-4">
              A solução mais rápida e eficaz para contestar multas de trânsito em Portugal.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <InstagramIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Início</a></li>
              <li><a href="#como-funciona" className="text-slate-400 hover:text-white transition-colors">Como Funciona</a></li>
              <li><a href="#vantagens" className="text-slate-400 hover:text-white transition-colors">Vantagens</a></li>
              <li><a href="#testemunhos" className="text-slate-400 hover:text-white transition-colors">Testemunhos</a></li>
              <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Serviços</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contestação de Multas</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Consultoria Jurídica</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Recursos Administrativos</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Impugnações Judiciais</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Análise de Legislação</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <span className="text-slate-400">info@naopaguesamulta.pt</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <span className="text-slate-400">+351 210 123 456</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <span className="text-slate-400">Av. da Liberdade 245, 1250-143 Lisboa</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 mt-8 text-center md:flex md:justify-between md:text-left">
          <p className="text-slate-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Não Pagues a Multa. Todos os direitos reservados.
          </p>
          <div className="space-x-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Termos e Condições</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;