import React from 'react';
import { Plant } from '../types';
import { Droplets, Sun, Thermometer } from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer"
    >
      <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-gray-100">
        <img 
          src={plant.image} 
          alt={plant.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full text-xs font-semibold text-lime-700">
          {plant.health === 'Good' ? 'Healthy 🌿' : 'Check Me ⚠️'}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-gray-800 leading-tight">{plant.nickname || plant.name}</h3>
        <p className="text-xs text-gray-400 italic truncate">{plant.scientificName}</p>
      </div>

      <div className="flex justify-between items-center mt-1">
        <div className="flex gap-2">
          <div className="flex flex-col items-center bg-blue-50 p-1.5 rounded-xl min-w-[40px]">
            <Droplets size={14} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-medium text-blue-700">Water</span>
          </div>
          <div className="flex flex-col items-center bg-amber-50 p-1.5 rounded-xl min-w-[40px]">
            <Sun size={14} className="text-amber-500 mb-1" />
            <span className="text-[10px] font-medium text-amber-700">Light</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center text-lime-600">
            <span className="text-lg leading-none">→</span>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;