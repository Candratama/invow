import React from 'react';
import { SITE_NAME } from '../constants';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-stone-200 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-white text-xl">I</span>
                </div>
              <span className="text-2xl font-bold text-stone-900 tracking-tight">
                {SITE_NAME}
              </span>
            </a>
            <p className="text-stone-500 leading-relaxed mb-6">
              Simplifying the way you handle business finances. Secure, fast, and elegant.
            </p>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-gold-500 hover:text-white transition-all duration-300 hover:-translate-y-1">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-stone-900 mb-6">Product</h4>
            <ul className="space-y-4">
              {['Fitur', 'Harga', 'API', 'Integrations'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-stone-500 hover:text-gold-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-stone-900 mb-6">Company</h4>
            <ul className="space-y-4">
              {['Tentang Kami', 'Karir', 'Blog', 'Kontak'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-stone-500 hover:text-gold-600 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold text-stone-900 mb-6">Newsletter</h4>
            <p className="text-stone-500 mb-4 text-sm">
              Dapetin tips bisnis dan update terbaru dari Invow.
            </p>
            <form className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Email kamu" 
                className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
              />
              <button className="bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-800 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-500 text-sm text-center md:text-left flex items-center gap-1">
            &copy; {new Date().getFullYear()} {SITE_NAME}. With <Heart size={12} className="text-red-500 fill-current" /> untuk UMKM Indonesia.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-stone-400 hover:text-stone-900 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-stone-400 hover:text-stone-900 text-sm transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};