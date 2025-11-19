import React from 'react';
import { Home, Sprout, ScanLine, Stethoscope, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/garden', icon: Sprout, label: 'Garden' },
    { path: '/identify', icon: ScanLine, label: 'Scan', isPrimary: true },
    { path: '/diagnose', icon: Stethoscope, label: 'Dr. Plant' },
    { path: '/chat', icon: MessageCircle, label: 'Assistant' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 h-20 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex items-center justify-between px-6 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

        if (item.isPrimary) {
          return (
            <div key={item.path} className="relative -top-8">
              <Link
                to={item.path}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive 
                    ? 'bg-lime-500 text-white ring-4 ring-lime-200' 
                    : 'bg-lime-400 text-white'
                }`}
              >
                <Icon size={28} />
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-12 transition-colors ${
              isActive ? 'text-lime-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && <span className="w-1 h-1 bg-lime-600 rounded-full mt-1" />}
          </Link>
        );
      })}
    </div>
  );
};

export default Navigation;
