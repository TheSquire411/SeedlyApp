
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin, Trophy, Award } from 'lucide-react';
import { AppContextType } from '../types';

// This needs to be imported or defined here if not shared
const ALL_ACHIEVEMENTS = [
  { id: 'first_bloom', title: 'First Bloom', description: 'Add your first plant to the garden', icon: '🌱', xpReward: 100 },
  { id: 'pest_doctor', title: 'Pest Doctor', description: 'Diagnose a plant health issue', icon: '🩺', xpReward: 150 },
  { id: 'consistent_waterer', title: 'Consistent Waterer', description: 'Complete a watering task', icon: '💧', xpReward: 50 },
  { id: 'botanist', title: 'Junior Botanist', description: 'Identify 3 plants using the scanner', icon: '🔍', xpReward: 200 },
  { id: 'garden_guru', title: 'Garden Guru', description: 'Grow your garden to 5 plants', icon: '🏡', xpReward: 300 },
];

const Profile: React.FC = () => {
  const { user, plants } = useOutletContext<AppContextType>();

  return (
    <div className="space-y-8 pb-40 pt-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-lime-100 to-transparent"></div>
             <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden z-10 mb-4 bg-gray-200">
                <img src="images/profile.jpg" alt="Profile" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 z-10">{user.name}</h2>
             <div className="flex items-center gap-1 text-gray-500 z-10 mt-1">
                <MapPin size={16} />
                <span>{user.location}</span>
             </div>
             
             <div className="w-full mt-6 grid grid-cols-3 gap-4 border-t pt-6">
                <div>
                    <span className="block text-2xl font-bold text-gray-800">{user.level}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">Level</span>
                </div>
                <div>
                    <span className="block text-2xl font-bold text-lime-600">{plants.length}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">Plants</span>
                </div>
                <div>
                    <span className="block text-2xl font-bold text-gray-800">{user.xp}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold">XP</span>
                </div>
             </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    Achievements
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {user.achievements.length} / {ALL_ACHIEVEMENTS.length}
                </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {ALL_ACHIEVEMENTS.map((ach) => {
                    const isUnlocked = user.achievements.some(a => a.id === ach.id);
                    return (
                        <div key={ach.id} className="flex flex-col items-center gap-1" onClick={() => !isUnlocked && alert(`Locked: ${ach.description}`)}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                                isUnlocked 
                                ? 'bg-yellow-50 border-yellow-200 shadow-md scale-100' 
                                : 'bg-gray-50 border-gray-100 grayscale opacity-40 scale-95'
                            }`}>
                                {ach.icon}
                            </div>
                            <span className={`text-[10px] text-center leading-tight font-medium ${isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                                {ach.title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Settings</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Notifications</span>
                    <div className="w-12 h-6 bg-lime-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Location Service</span>
                    <span className="text-lime-600 font-medium text-sm">Always On</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
