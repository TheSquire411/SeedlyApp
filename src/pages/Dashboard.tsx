
import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Bell, Star, Calendar, AlertTriangle } from 'lucide-react';
import WeatherCard from '../components/WeatherCard';
import PlantCard from '../components/PlantCard';
import { AppContextType } from '../types';

const Dashboard: React.FC = () => {
  const { user, plants, setSelectedPlant } = useOutletContext<AppContextType>();

  const getDueTasksCount = () => {
    const now = new Date();
    let count = 0;
    plants.forEach(p => {
        p.reminders.forEach(r => {
            if (new Date(r.nextDue) <= now) count++;
        });
    });
    return count;
  };

  return (
    <div className="space-y-8 pb-40">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link to="/profile" className="flex items-center gap-3 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
            <img src="images/profile.jpg" alt="Profile" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
          </div>
        </Link>
        <div className="flex gap-2">
            <div className="bg-white px-3 py-2 rounded-full shadow-sm flex items-center gap-2 border border-gray-100">
                <Star className="text-yellow-400 fill-yellow-400" size={16} />
                <span className="font-bold text-gray-700 text-sm">{user.level}</span>
            </div>
            <button className="p-2 bg-white rounded-full shadow-sm text-gray-600 relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
        </div>
      </div>

      {/* Weather */}
      <WeatherCard location={user.location} />

      {/* Tasks / Status */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Tasks</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          <button onClick={() => alert('Check your garden to see tasks!')} className="min-w-[160px] bg-blue-50 rounded-3xl p-5 flex flex-col justify-between h-40 text-left active:scale-95 transition-transform border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 shadow-sm">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-3xl font-bold text-blue-900">{getDueTasksCount()}</span>
              <p className="text-sm text-blue-700 font-medium">Pending Actions</p>
            </div>
          </button>
          <div className="min-w-[160px] bg-amber-50 rounded-3xl p-5 flex flex-col justify-between h-40 border border-amber-100">
             <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2 shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-3xl font-bold text-amber-900">0</span>
              <p className="text-sm text-amber-700 font-medium">Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Plants */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-gray-800">Your Garden</h2>
          <Link to="/garden" className="text-lime-600 font-semibold text-sm">View All</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
            {plants.slice(0, 2).map(plant => (
                <PlantCard key={plant.id} plant={plant} onClick={() => setSelectedPlant(plant)} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
