import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import PlantCard from '../components/PlantCard';
import { AppContextType } from '../types';

const Garden: React.FC = () => {
  const { plants, setSelectedPlant } = useOutletContext<AppContextType>();

  return (
    <div className="min-h-full pb-40">
        <div className="sticky top-0 bg-[#F3F4F6] z-10 pb-4 pt-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">My Garden</h1>
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search plants..." 
                    className="w-full bg-white h-12 rounded-2xl pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
            </div>
            
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
                {['All', 'Indoor', 'Outdoor', 'Succulents'].map((tag, i) => (
                    <button key={tag} className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap ${i === 0 ? 'bg-lime-500 text-white shadow-md shadow-lime-200' : 'bg-white text-gray-600 border border-gray-100'}`}>
                        {tag}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <Link to="/identify" className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-2 min-h-[220px] active:scale-95 transition-transform">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <Plus size={24} />
                </div>
                <span className="text-gray-500 font-medium">Add Plant</span>
             </Link>
            {plants.map(plant => (
                <PlantCard key={plant.id} plant={plant} onClick={() => setSelectedPlant(plant)} />
            ))}
        </div>
    </div>
  );
};

export default Garden;
