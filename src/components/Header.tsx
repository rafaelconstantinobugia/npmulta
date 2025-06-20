import React, { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      window.location.href = `/${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8 flex justify-between items-center">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-blue-600 font-bold text-lg md:text-xl"
          onClick={() => window.scrollTo(0, 0)}
        >
          <Shield className="h-6 w-6" />
          <span>Não Pagues a Multa</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('como-funciona')} className="text-slate-700 hover:text-blue-600 transition-colors">Como Funciona</button>
          <button onClick={() => scrollToSection('vantagens')} className="text-slate-700 hover:text-blue-600 transition-colors">Vantagens</button>
          <button onClick={() => scrollToSection('testemunhos')} className="text-slate-700 hover:text-blue-600 transition-colors">Testemunhos</button>
          <button onClick={() => scrollToSection('faq')} className="text-slate-700 hover:text-blue-600 transition-colors">FAQ</button>
          <Link 
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Carregar Multa
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-slate-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white absolute w-full py-4 shadow-md animate-fadeIn">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            <button 
              onClick={() => scrollToSection('como-funciona')}
              className="text-slate-700 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              Como Funciona
            </button>
            <button 
              onClick={() => scrollToSection('vantagens')}
              className="text-slate-700 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              Vantagens
            </button>
            <button 
              onClick={() => scrollToSection('testemunhos')}
              className="text-slate-700 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              Testemunhos
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-slate-700 hover:text-blue-600 transition-colors py-2 border-b border-slate-100"
            >
              FAQ
            </button>
            <Link
              to="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-lg transition-all shadow-md hover:shadow-lg w-full mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Carregar Multa
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;