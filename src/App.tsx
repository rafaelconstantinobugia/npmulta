import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 flex flex-col">
        <Header />
        <Routes>
          <Route path="/" element={
            <main className="flex-grow">
              <Hero />
              <Features />
              <HowItWorks />
              <Testimonials />
              <FAQ />
            </main>
          } />
          <Route path="/upload" element={<Upload />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App