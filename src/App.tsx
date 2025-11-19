
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';
import PlantDetails from './components/PlantDetails';
import Dashboard from './pages/Dashboard';
import Garden from './pages/Garden';
import Scanner from './pages/Scanner';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import { UserProfile, Plant, Achievement, UserStats, AppContextType } from './types';
import { Award, Loader2 } from 'lucide-react';

// Services
import { signInWithGoogle } from './services/authService';
import { getMyGarden, addPlantToGarden, updatePlantInGarden, deletePlantFromGarden } from './services/gardenService';

const INITIAL_USER: UserProfile = {
  name: "Guest Gardener",
  location: "San Francisco, CA", // In a real app, we'd ask for this or use IP
  level: 1,
  xp: 0,
  joinedDate: new Date().toISOString(),
  stats: {
    plantsAdded: 0,
    plantsDiagnosed: 0,
    plantsIdentified: 0,
    wateringTasksCompleted: 0,
  },
  achievements: []
};

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_bloom', title: 'First Bloom', description: 'Add your first plant to the garden', icon: '🌱', xpReward: 100 },
  { id: 'pest_doctor', title: 'Pest Doctor', description: 'Diagnose a plant health issue', icon: '🩺', xpReward: 150 },
  { id: 'consistent_waterer', title: 'Consistent Waterer', description: 'Complete a watering task', icon: '💧', xpReward: 50 },
  { id: 'botanist', title: 'Junior Botanist', description: 'Identify 3 plants using the scanner', icon: '🔍', xpReward: 200 },
  { id: 'garden_guru', title: 'Garden Guru', description: 'Grow your garden to 5 plants', icon: '🏡', xpReward: 300 },
];

const App: React.FC = () => {
  // We use a mock ID for the guest user if auth isn't fully implemented/logged in
  const userId = "guest_user_123"; 

  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data Effect
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Attempt Login (In a real flow, this happens on a Login Screen)
        // For this preview, we'll assume a session or use the mock fallback in authService
        const userProfile = await signInWithGoogle();
        if (userProfile) {
          setUser(userProfile);
        }

        // 2. Fetch Garden Data
        const gardenPlants = await getMyGarden(userId);
        setPlants(gardenPlants);
      } catch (error) {
        console.error("Failed to initialize app data", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // Gamification Logic
  const checkAchievements = (currentStats: typeof user.stats, currentAchievements: Achievement[]) => {
    const unlocked: Achievement[] = [];
    const check = (cond: boolean, id: string) => {
        if (cond && !currentAchievements.find(a => a.id === id)) {
            unlocked.push({ ...ALL_ACHIEVEMENTS.find(a => a.id === id)!, unlockedAt: new Date().toISOString() });
        }
    }

    check(currentStats.plantsAdded >= 1, 'first_bloom');
    check(currentStats.plantsAdded >= 5, 'garden_guru');
    check(currentStats.plantsDiagnosed >= 1, 'pest_doctor');
    check(currentStats.plantsIdentified >= 3, 'botanist');
    check(currentStats.wateringTasksCompleted >= 1, 'consistent_waterer');

    if (unlocked.length > 0) {
        const rewardXP = unlocked.reduce((sum, a) => sum + a.xpReward, 0);
        setUser(prev => ({
            ...prev,
            achievements: [...prev.achievements, ...unlocked],
            xp: prev.xp + rewardXP,
            level: Math.floor((prev.xp + rewardXP) / 500) + 1 
        }));
        setNewAchievement(unlocked[0]); 
    }
  };

  const updateUserStats = (statsDiff: Partial<UserStats>) => {
      setUser(prev => {
          const newStats = { ...prev.stats, ...statsDiff };
          checkAchievements(newStats, prev.achievements);
          return { ...prev, stats: newStats };
      });
  };

  // Service Wrapper Functions

  const addPlant = async (plant: Plant) => {
      // Optimistic Update
      setPlants(prev => [plant, ...prev]);
      
      // Update Backend
      await addPlantToGarden(userId, plant);

      setUser(prev => {
        const newStats = { ...prev.stats, plantsAdded: prev.stats.plantsAdded + 1 };
        const newXP = prev.xp + 50;
        checkAchievements(newStats, prev.achievements);
        return { ...prev, stats: newStats, xp: newXP };
      });
  };

  const updatePlant = async (updatedPlant: Plant) => {
      // Optimistic Update
      setPlants(prev => prev.map(p => p.id === updatedPlant.id ? updatedPlant : p));
      if (selectedPlant?.id === updatedPlant.id) setSelectedPlant(updatedPlant);

      // Update Backend
      await updatePlantInGarden(userId, updatedPlant);
  };

  const removePlant = async (id: string) => {
      if (confirm("Are you sure you want to remove this plant?")) {
          // Optimistic Update
          setPlants(prev => prev.filter(p => p.id !== id));
          setSelectedPlant(null);

          // Update Backend
          await deletePlantFromGarden(userId, id);
      }
  };

  const handleCompleteTask = async (plantId: string, reminderId: string) => {
    // Find the plant to modify
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return;

    const reminder = plant.reminders.find(r => r.id === reminderId);
    const isWatering = reminder?.type === 'water';
    const now = new Date().toISOString();

    const updatedPlant = {
        ...plant,
        wateringHistory: isWatering ? [now, ...plant.wateringHistory] : plant.wateringHistory,
        reminders: plant.reminders.map(r => {
            if (r.id !== reminderId) return r;
            return {
                ...r,
                lastCompleted: now,
                nextDue: new Date(Date.now() + (r.frequencyDays * 24 * 60 * 60 * 1000)).toISOString()
            };
        })
    };

    // Optimistic Update
    setPlants(prevPlants => prevPlants.map(p => p.id === plantId ? updatedPlant : p));
    if (selectedPlant?.id === plantId) setSelectedPlant(updatedPlant);

    // Backend Update
    await updatePlantInGarden(userId, updatedPlant);

    // Gamification
    setUser(prev => {
        const newStats = { ...prev.stats, wateringTasksCompleted: prev.stats.wateringTasksCompleted + 1 };
        checkAchievements(newStats, prev.achievements);
        return { ...prev, stats: newStats };
    });
    
    alert("Task Completed! Great job keeping your plants happy! (+10 XP)");
  };

  // Context values to share with pages
  const contextValue: AppContextType = {
      user,
      plants,
      setPlants,
      updateUserStats,
      addPlant,
      updatePlant,
      removePlant,
      setSelectedPlant
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 size={48} className="text-lime-500 animate-spin" />
                  <p className="text-gray-500 font-medium">Loading your garden...</p>
              </div>
          </div>
      )
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans flex justify-center">
          {/* Global Achievement Modal */}
          {newAchievement && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 shadow-inner ring-8 ring-yellow-50">
                        {newAchievement.icon}
                    </div>
                    
                    <h2 className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-1">Achievement Unlocked</h2>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{newAchievement.title}</h3>
                    <p className="text-gray-500 mb-6">{newAchievement.description}</p>
                    
                    <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-3 mb-6">
                        <Award className="text-purple-500" size={20} />
                        <span className="font-bold text-gray-700">+{newAchievement.xpReward} XP</span>
                    </div>

                    <button 
                        onClick={() => setNewAchievement(null)}
                        className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
          )}
          
          {/* Global Plant Details Overlay */}
          {selectedPlant && (
              <PlantDetails 
                plant={selectedPlant} 
                onClose={() => setSelectedPlant(null)} 
                onUpdatePlant={updatePlant}
                onRemovePlant={removePlant}
                onCompleteTask={handleCompleteTask}
              />
          )}

          {/* Main Content */}
          <div className="w-full max-w-md h-screen overflow-y-auto bg-[#F3F4F6] px-6 pt-6 no-scrollbar">
              <Routes>
                  <Route element={<><Outlet context={contextValue} /></>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/garden" element={<Garden />} />
                    <Route path="/identify" element={<Scanner />} />
                    <Route path="/diagnose" element={<Scanner />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>
              </Routes>
          </div>

          <Navigation />
      </div>
    </HashRouter>
  );
};

export default App;
