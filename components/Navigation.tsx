
import React from 'react';
import { Home, Sprout, ScanLine, Stethoscope, User, MessageCircle } from 'lucide-react';
import { View } from '../types';

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: View.DASHBOARD, icon: Home, label: 'Home' },
    { id: View.GARDEN, icon: Sprout, label: 'Garden' },
    { id: View.IDENTIFY, icon: ScanLine, label: 'Scan', isPrimary: true },
    { id: View.DIAGNOSE, icon: Stethoscope, label: 'Dr. Plant' },
    { id: View.CHAT, icon: MessageCircle, label: 'Assistant' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 h-20 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex items-center justify-between px-6 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        if (item.isPrimary) {
          return (
            <div key={item.id} className="relative -top-8">
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive 
                    ? 'bg-lime-500 text-white ring-4 ring-lime-200' 
                    : 'bg-lime-400 text-white'
                }`}
              >
                <Icon size={28} />
              </button>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center w-12 transition-colors ${
              isActive ? 'text-lime-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && <span className="w-1 h-1 bg-lime-600 rounded-full mt-1" />}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
