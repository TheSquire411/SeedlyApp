import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import SubscriptionModal from './components/SubscriptionModal';
import PlantCard from './components/PlantCard';
import WeatherCard from './components/WeatherCard';
import WebLanding from './components/WebLanding';
import { View, Plant, UserProfile, IdentifyResult, DiagnosisResult, Achievement, Reminder, ReminderType, ChatMessage } from './types';
import { identifyPlant, diagnosePlant, createGardenChat } from './services/gemini';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { initializeRevenueCat, checkSubscriptionStatus, getOfferings, purchasePackage } from './services/revenueCat';
import { signInWithGoogle, getUser } from './services/authService';

// 👇 THESE ARE THE CRITICAL FIREBASE IMPORTS
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
    getMyGarden,
    addPlantToGarden,
    updatePlantInGarden,
    deletePlantFromGarden
} from './services/gardenService';

// Icon Imports (Renaming Camera to avoid conflict with Capacitor Camera)
import {
    Plus, Search, Bell, MapPin, Camera as CameraIcon, Upload, X, Loader2,
    CheckCircle, Leaf, AlertTriangle, ScanLine, Trophy, Award, Droplet,
    Star, ChevronLeft, Calendar, Sparkles, CloudRain, RefreshCw, Clock,
    Trash2, History, Users, Lightbulb, ShieldCheck, Sprout, Layers,
    Scissors, Shovel, Send, Bot, MessageCircle, Crown
} from 'lucide-react';

// --- Gamification Data ---

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
    { id: 'first_bloom', title: 'First Bloom', description: 'Add your first plant to the garden', icon: '🌱', xpReward: 100 },
    { id: 'pest_doctor', title: 'Pest Doctor', description: 'Diagnose a plant health issue', icon: '🩺', xpReward: 150 },
    { id: 'consistent_waterer', title: 'Consistent Waterer', description: 'Complete a watering task', icon: '💧', xpReward: 50 },
    { id: 'botanist', title: 'Junior Botanist', description: 'Identify 3 plants using the scanner', icon: '🔍', xpReward: 200 },
    { id: 'garden_guru', title: 'Garden Guru', description: 'Grow your garden to 5 plants', icon: '🏡', xpReward: 300 },
];

// Initial Mock Data
const INITIAL_USER: UserProfile = {
    name: "Guest",
    location: "Detecting location...",
    level: 1,
    xp: 0,
    joinedDate: "2023-01-15",
    stats: {
        plantsAdded: 0,
        plantsDiagnosed: 0,
        plantsIdentified: 0,
        wateringTasksCompleted: 0,
    },
    achievements: []
};

const INITIAL_PLANTS: Plant[] = [];

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [user, setUser] = useState<UserProfile>(INITIAL_USER);
    const [plants, setPlants] = useState<Plant[]>(INITIAL_PLANTS);
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showLanding, setShowLanding] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setIsLoadingData(true);
            if (currentUser) {
                console.log("✅ Firebase User Detected:", currentUser.uid);
                setUid(currentUser.uid);

                // Fetch Data
                try {
                    const dbPlants = await getMyGarden(currentUser.uid);
                    if (dbPlants.length > 0) {
                        setPlants(dbPlants);
                    }
                } catch (error) {
                    console.error("Error loading garden:", error);
                }
            } else {
                console.log("⚠️ No Firebase User - Signing in Anonymously...");
                // 👇 THIS IS THE MAGIC FIX
                signInAnonymously(auth).catch((error) => {
                    console.error("Auto-login failed:", error);
                });
            }
            setIsLoadingData(false);
        });

        return () => unsubscribe();
    }, []);




    // Identify/Diagnose State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanResult, setScanResult] = useState<IdentifyResult | null>(null);
    const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
    const [userPrompt, setUserPrompt] = useState("");

    // Reminder Form State
    const [showReminderForm, setShowReminderForm] = useState(false);
    const [newReminderConfig, setNewReminderConfig] = useState<{ type: ReminderType, title: string, freq: number }>({
        type: 'custom',
        title: '',
        freq: 7
    });

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hi! I\'m Seedly. Ask me anything about your garden or gardening in general! 🌿', timestamp: new Date() }
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isChatTyping, setIsChatTyping] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Gamification State
    const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECTS ---

    // 1. Init RevenueCat & Check Subscription
    useEffect(() => {
        const init = async () => {
            await initializeRevenueCat();
            const isSubscribed = await checkSubscriptionStatus();
            setIsPro(isSubscribed);
        };
        init();
    }, []);

    // Platform check for Web Landing
    useEffect(() => {
        if (!Capacitor.isNativePlatform() && user.name === "Guest") {
            setShowLanding(true);
        } else {
            setShowLanding(false);
        }
    }, [user.name]);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                // Check permissions first
                const permission = await Geolocation.checkPermissions();

                if (permission.location !== 'granted') {
                    const request = await Geolocation.requestPermissions();
                    if (request.location !== 'granted') return;
                }

                // Get position
                const position = await Geolocation.getCurrentPosition();

                // Reverse Geocoding (Coordinates -> City Name)
                // We use a free OpenStreetMap API for this demo to convert coords to city
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                );
                const data = await response.json();

                // Extract city/suburb and country
                const city = data.address.city || data.address.town || data.address.suburb || "Unknown City";
                const country = data.address.country || "";
                const locationString = `${city}, ${country}`;

                console.log("📍 Updated Location:", locationString);

                // Update User State
                setUser(prev => ({ ...prev, location: locationString }));

            } catch (error) {
                console.error("Error getting location:", error);
                // Fallback if GPS fails
                setUser(prev => ({ ...prev, location: "Australia" }));
            }
        };

        fetchLocation();
    }, []);
    // 2. Check Google Session
    useEffect(() => {
        const checkSession = async () => {
            const loggedInUser = await getUser();
            if (loggedInUser) {
                console.log("Restoring session for:", loggedInUser.name);
                setUser(loggedInUser);
            }
        };
        checkSession();
    }, []);

    // 3. Get Location
    useEffect(() => {
        const getUserLocation = async () => {
            try {
                const permission = await Geolocation.checkPermissions();
                if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
                    await Geolocation.requestPermissions();
                }

                const position = await Geolocation.getCurrentPosition();
                const { latitude, longitude } = position.coords;

                // Convert to City Name using BigDataCloud (Free API)
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();

                const city = data.city || data.locality || "Unknown City";
                const region = data.principalSubdivision || data.countryName;
                const locationString = `${city}, ${region}`;

                setUser(prev => ({ ...prev, location: locationString }));
                console.log("📍 Location updated:", locationString);

            } catch (error) {
                console.error("Error getting location", error);
            }
        };

        getUserLocation();
    }, []);

    // 4. Chat Session
    useEffect(() => {
        if (currentView === View.CHAT && !chatSession.current) {
            chatSession.current = createGardenChat(plants, user.location);
        }
    }, [currentView, plants, user.location]);

    // 5. Chat Scroll
    useEffect(() => {
        if (currentView === View.CHAT) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, currentView]);

    // --- Freemium Usage Limit Logic ---
    const checkUsageLimit = (): boolean => {
        // Pro users have unlimited access
        if (isPro) return true;

        // Get today's date string (e.g., "2024-12-10")
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `usage_count_${today}`;

        // Get current usage count
        const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);

        if (currentCount < 3) {
            // Increment usage and allow
            localStorage.setItem(storageKey, (currentCount + 1).toString());
            return true;
        } else {
            // Limit reached, show upgrade modal
            setShowUpgradeModal(true);
            return false;
        }
    };

    // --- Gamification Logic ---

    const checkAchievements = (currentStats: typeof user.stats, currentAchievements: Achievement[]) => {
        const unlocked: Achievement[] = [];

        // Check specific conditions
        if (currentStats.plantsAdded >= 1 && !currentAchievements.find(a => a.id === 'first_bloom')) {
            unlocked.push({ ...ALL_ACHIEVEMENTS.find(a => a.id === 'first_bloom')!, unlockedAt: new Date().toISOString() });
        }
        if (currentStats.plantsAdded >= 5 && !currentAchievements.find(a => a.id === 'garden_guru')) {
            unlocked.push({ ...ALL_ACHIEVEMENTS.find(a => a.id === 'garden_guru')!, unlockedAt: new Date().toISOString() });
        }
        if (currentStats.plantsDiagnosed >= 1 && !currentAchievements.find(a => a.id === 'pest_doctor')) {
            unlocked.push({ ...ALL_ACHIEVEMENTS.find(a => a.id === 'pest_doctor')!, unlockedAt: new Date().toISOString() });
        }
        if (currentStats.plantsIdentified >= 3 && !currentAchievements.find(a => a.id === 'botanist')) {
            unlocked.push({ ...ALL_ACHIEVEMENTS.find(a => a.id === 'botanist')!, unlockedAt: new Date().toISOString() });
        }
        if (currentStats.wateringTasksCompleted >= 1 && !currentAchievements.find(a => a.id === 'consistent_waterer')) {
            unlocked.push({ ...ALL_ACHIEVEMENTS.find(a => a.id === 'consistent_waterer')!, unlockedAt: new Date().toISOString() });
        }

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

    const handleCompleteTask = (plantId: string, reminderId: string) => {
        setPlants(prevPlants => prevPlants.map(p => {
            if (p.id !== plantId) return p;

            const reminder = p.reminders.find(r => r.id === reminderId);
            const isWatering = reminder?.type === 'water';
            const now = new Date().toISOString();

            if (selectedPlant && selectedPlant.id === plantId) {
                const updatedLocal = {
                    ...p,
                    wateringHistory: isWatering ? [now, ...p.wateringHistory] : p.wateringHistory,
                    reminders: p.reminders.map(r => {
                        if (r.id !== reminderId) return r;
                        return {
                            ...r,
                            lastCompleted: now,
                            nextDue: new Date(Date.now() + (r.frequencyDays * 24 * 60 * 60 * 1000)).toISOString()
                        };
                    })
                };
                setSelectedPlant(updatedLocal);
            }

            return {
                ...p,
                wateringHistory: isWatering ? [now, ...p.wateringHistory] : p.wateringHistory,
                reminders: p.reminders.map(r => {
                    if (r.id !== reminderId) return r;
                    return {
                        ...r,
                        lastCompleted: now,
                        nextDue: new Date(Date.now() + (r.frequencyDays * 24 * 60 * 60 * 1000)).toISOString()
                    };
                })
            };
        }));

        setUser(prev => {
            const newStats = { ...prev.stats, wateringTasksCompleted: prev.stats.wateringTasksCompleted + 1 };
            checkAchievements(newStats, prev.achievements);
            return { ...prev, stats: newStats };
        });

        alert("Task Completed! Great job keeping your plants happy! (+10 XP)");
    };

    const handleAddReminder = () => {
        if (!selectedPlant) return;
        if (!newReminderConfig.title) {
            alert("Please enter a title for the reminder");
            return;
        }
        const newReminder: Reminder = {
            id: Date.now().toString(),
            type: newReminderConfig.type,
            title: newReminderConfig.title,
            frequencyDays: newReminderConfig.freq,
            nextDue: new Date(Date.now() + (newReminderConfig.freq * 24 * 60 * 60 * 1000)).toISOString()
        };

        const updatedPlant = {
            ...selectedPlant,
            reminders: [...selectedPlant.reminders, newReminder]
        };

        setPlants(prev => prev.map(p => p.id === selectedPlant.id ? updatedPlant : p));
        setSelectedPlant(updatedPlant);
        setShowReminderForm(false);
        setNewReminderConfig({ type: 'custom', title: '', freq: 7 });
    };

    const handleDeleteReminder = (reminderId: string) => {
        if (!selectedPlant) return;
        if (!confirm("Are you sure you want to delete this reminder?")) return;

        const updatedPlant = {
            ...selectedPlant,
            reminders: selectedPlant.reminders.filter(r => r.id !== reminderId)
        };

        setPlants(prev => prev.map(p => p.id === selectedPlant.id ? updatedPlant : p));
        setSelectedPlant(updatedPlant);
    };

    const handleSendMessage = async () => {
        if (!checkUsageLimit()) return;
        if (!inputMessage.trim() || !chatSession.current) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage("");
        setIsChatTyping(true);

        try {
            const response: GenerateContentResponse = await chatSession.current.sendMessage({ message: userMsg.text });

            const modelMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, modelMsg]);
        } catch (error) {
            console.error("Chat error", error);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I'm having trouble connecting to the garden network. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsChatTyping(false);
        }
    }

    // --- Helper Functions ---

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTakePhoto = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera
            });

            if (image.dataUrl) {
                setSelectedImage(image.dataUrl);
            }
        } catch (error) {
            console.log("User cancelled or camera error", error);
        }
    };

    const handleIdentify = async () => {
        if (!checkUsageLimit()) return;
        if (!selectedImage) return;
        setIsAnalyzing(true);
        try {
            const result = await identifyPlant(selectedImage, user.location);
            setScanResult(result);

            setUser(prev => {
                const newStats = { ...prev.stats, plantsIdentified: prev.stats.plantsIdentified + 1 };
                checkAchievements(newStats, prev.achievements);
                return { ...prev, stats: newStats };
            });

        } catch (error) {
            alert("Failed to identify plant. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDiagnose = async () => {
        if (!checkUsageLimit()) return;
        if (!selectedImage) return;
        setIsAnalyzing(true);
        try {
            const result = await diagnosePlant(selectedImage, userPrompt || "Check for any issues");
            setDiagnosisResult(result);

            setUser(prev => {
                const newStats = { ...prev.stats, plantsDiagnosed: prev.stats.plantsDiagnosed + 1 };
                checkAchievements(newStats, prev.achievements);
                return { ...prev, stats: newStats };
            });

        } catch (error) {
            alert("Diagnosis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const addToGarden = async () => {
        if (scanResult && selectedImage) {

            // 👇 HELPER: Compresses image if it's too big
            const compressImage = (base64Str: string): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = base64Str;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800; // Shrink to 800px width
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                        // Convert to JPEG with 0.7 (70%) quality
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                });
            };

            // Check size and compress if needed
            let finalImage = selectedImage;
            if (selectedImage.length > 500000) { // If > ~500KB
                console.log("⚠️ Image too large, compressing...");
                finalImage = await compressImage(selectedImage);
                console.log("✅ Image compressed!");
            }

            const newPlant: Plant = {
                id: Date.now().toString(),
                name: scanResult.name,
                scientificName: scanResult.scientificName,
                image: finalImage, // 👈 Using the compressed image here
                care: scanResult.care,
                reminders: [
                    { id: `r-${Date.now()}`, type: 'water', title: 'Water', frequencyDays: 7, nextDue: new Date(Date.now() + 86400000).toISOString() }
                ],
                wateringHistory: [],
                companions: scanResult.companions || [],
                quickTips: scanResult.quickTips || [],
                visualGuides: scanResult.visualGuides || [],
                health: 'Good',
                dateAdded: new Date().toISOString()
            };

            // 1. Update Local State
            setPlants([newPlant, ...plants]);

            // 2. Database Save Logic
            if (uid) {
                try {
                    await addPlantToGarden(uid, newPlant);
                    console.log("Plant saved to DB!");
                } catch (e) {
                    console.error("Failed to save plant to cloud:", e);
                    alert("Failed to save plant to cloud. It may disappear on restart.");
                }
            } else {
                alert("CRITICAL ERROR: No User ID! You are not logged in.");
                console.error("❌ Add aborted: uid is null");
            }

            // 3. Update Stats
            setUser(prev => {
                const newStats = { ...prev.stats, plantsAdded: prev.stats.plantsAdded + 1 };
                const newXP = prev.xp + 50;
                checkAchievements(newStats, prev.achievements);
                return { ...prev, stats: newStats, xp: newXP };
            });

            // 4. Reset View
            chatSession.current = null;
            resetScanner();
            setCurrentView(View.GARDEN);
        }
    };

    const resetScanner = () => {
        setSelectedImage(null);
        setScanResult(null);
        setDiagnosisResult(null);
        setUserPrompt("");
        setIsAnalyzing(false);
    };

    // --- Web Login Handler ---
    const handleWebLogin = async () => {
        try {
            const loggedInUser = await signInWithGoogle();
            if (loggedInUser) {
                setUser(loggedInUser);
                setShowLanding(false);
            }
        } catch (error) {
            console.error("Web login failed:", error);
        }
    };

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

    // --- Views ---

    const renderDashboard = () => (
        <div className="space-y-8 pb-40">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView(View.PROFILE)}>
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                        <img src="https://picsum.photos/200" alt="Profile" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Welcome back,</p>
                        <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                    </div>
                </div>
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
                    <button onClick={() => setCurrentView(View.GARDEN)} className="text-lime-600 font-semibold text-sm">View All</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {plants.slice(0, 2).map(plant => (
                        <PlantCard key={plant.id} plant={plant} onClick={() => setSelectedPlant(plant)} />
                    ))}
                </div>
            </div>
        </div>
    );

    const renderGarden = () => (
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
                <button onClick={() => setCurrentView(View.IDENTIFY)} className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-2 min-h-[220px] active:scale-95 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <Plus size={24} />
                    </div>
                    <span className="text-gray-500 font-medium">Add Plant</span>
                </button>
                {plants.map(plant => (
                    <PlantCard key={plant.id} plant={plant} onClick={() => setSelectedPlant(plant)} />
                ))}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="min-h-full flex flex-col pb-32 relative">
            <div className="sticky top-0 bg-[#F3F4F6] z-10 pb-4 pt-2">
                <h1 className="text-3xl font-bold text-gray-800">Garden Assistant</h1>
                <p className="text-gray-500">Ask me anything about your plants!</p>
            </div>

            <div className="flex-1 space-y-4 pb-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white mr-2 flex-shrink-0">
                                <Bot size={18} />
                            </div>
                        )}
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                            ? 'bg-lime-500 text-white rounded-br-none shadow-lg shadow-lime-200'
                            : 'bg-white text-gray-700 rounded-bl-none shadow-sm border border-gray-100'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isChatTyping && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white mr-2">
                            <Bot size={18} />
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1 items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="fixed bottom-28 left-4 right-4">
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask about your garden..."
                        className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isChatTyping}
                        className="w-12 h-12 bg-lime-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:bg-gray-300 disabled:shadow-none"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderPlantDetails = () => {
        if (!selectedPlant) return null;

        return (
            <div className="fixed inset-0 z-50 bg-[#F3F4F6] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
                {/* Header Image */}
                <div className="relative h-80 w-full">
                    <img src={selectedPlant.image} alt={selectedPlant.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#F3F4F6]"></div>

                    <button
                        onClick={() => setSelectedPlant(null)}
                        className="absolute top-14 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-50"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="absolute bottom-8 left-6 right-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-lime-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                {selectedPlant.health === 'Good' ? 'Healthy 🌿' : 'Check Me ⚠️'}
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                                Indoor
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-white shadow-black drop-shadow-md">{selectedPlant.nickname || selectedPlant.name}</h1>
                        <p className="text-white/90 italic font-medium">{selectedPlant.scientificName}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 -mt-6 relative z-10 pb-40">

                    {/* Reminder Section */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-100/50 mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Clock className="text-lime-500" size={24} />
                                Care Schedule
                            </h2>
                            <button
                                onClick={() => setShowReminderForm(true)}
                                className="bg-gray-100 hover:bg-lime-50 text-lime-600 p-2 rounded-xl transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Reminder Form Modal */}
                        {showReminderForm && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
                                <h3 className="font-bold text-gray-700 mb-3">Add New Reminder</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Type</label>
                                        <div className="flex gap-2 mt-1 overflow-x-auto pb-2 no-scrollbar">
                                            {[
                                                { id: 'water', icon: Droplet, label: 'Water' },
                                                { id: 'fertilize', icon: Sparkles, label: 'Feed' },
                                                { id: 'mist', icon: CloudRain, label: 'Mist' },
                                                { id: 'repot', icon: RefreshCw, label: 'Repot' },
                                                { id: 'custom', icon: Bell, label: 'Other' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setNewReminderConfig({ ...newReminderConfig, type: opt.id as ReminderType, title: opt.id === 'custom' ? '' : opt.label })}
                                                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border whitespace-nowrap transition-all ${newReminderConfig.type === opt.id
                                                        ? 'bg-lime-500 text-white border-lime-500 shadow-md'
                                                        : 'bg-white text-gray-600 border-gray-200'
                                                        }`}
                                                >
                                                    <opt.icon size={14} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Title</label>
                                        <input
                                            type="text"
                                            value={newReminderConfig.title}
                                            onChange={(e) => setNewReminderConfig({ ...newReminderConfig, title: e.target.value })}
                                            placeholder="e.g., Trim Leaves"
                                            className="w-full mt-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Frequency (Days)</label>
                                        <div className="flex items-center gap-4 mt-1 bg-white p-2 rounded-xl border border-gray-200">
                                            <input
                                                type="range"
                                                min="1"
                                                max="60"
                                                value={newReminderConfig.freq}
                                                onChange={(e) => setNewReminderConfig({ ...newReminderConfig, freq: parseInt(e.target.value) })}
                                                className="flex-1 accent-lime-500"
                                            />
                                            <span className="font-bold text-gray-700 w-12 text-right">{newReminderConfig.freq}d</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => setShowReminderForm(false)} className="flex-1 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                        <button onClick={handleAddReminder} className="flex-1 py-3 rounded-xl bg-lime-500 text-white font-bold shadow-lg shadow-lime-200 hover:bg-lime-600 transition-colors">Save Reminder</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {selectedPlant.reminders.sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()).map(reminder => {
                                const Icon = {
                                    water: Droplet,
                                    fertilize: Sparkles,
                                    mist: CloudRain,
                                    repot: RefreshCw,
                                    custom: Bell
                                }[reminder.type] || Bell;

                                const isDue = new Date(reminder.nextDue) <= new Date();
                                const daysUntil = Math.ceil((new Date(reminder.nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                                return (
                                    <div key={reminder.id} className={`flex items-center p-4 rounded-2xl border transition-all ${isDue ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 ${isDue ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold ${isDue ? 'text-blue-900' : 'text-gray-700'}`}>{reminder.title}</h4>
                                            <p className={`text-xs font-medium ${isDue ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {isDue ? 'Due Today' : `Due in ${daysUntil} days`} • Every {reminder.frequencyDays} days
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isDue ? (
                                                <button
                                                    onClick={() => handleCompleteTask(selectedPlant.id, reminder.id)}
                                                    className="p-2 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDeleteReminder(reminder.id)}
                                                    className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {selectedPlant.reminders.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No reminders set. Add one to keep your plant happy!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Care Tips Section */}
                    {selectedPlant.quickTips && selectedPlant.quickTips.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Lightbulb className="text-yellow-400 fill-yellow-400" size={20} />
                                Quick Care Tips
                            </h3>
                            <ul className="space-y-3">
                                {selectedPlant.quickTips.map((tip, i) => (
                                    <li key={i} className="flex gap-3 items-start">
                                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-2 flex-shrink-0" />
                                        <span className="text-gray-600 text-sm leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Visual Guides Section */}
                    {selectedPlant.visualGuides && selectedPlant.visualGuides.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Layers className="text-indigo-500" size={20} />
                                Visual Guides
                            </h3>
                            <div className="space-y-6">
                                {selectedPlant.visualGuides.map((guide, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                {guide.title.toLowerCase().includes('prun') ? <Scissors size={16} /> :
                                                    guide.title.toLowerCase().includes('repot') ? <Shovel size={16} /> :
                                                        <Sprout size={16} />}
                                            </div>
                                            <h4 className="font-bold text-gray-700">{guide.title}</h4>
                                        </div>

                                        <div className="relative pl-4">
                                            {/* Vertical Line */}
                                            <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-indigo-100"></div>

                                            <div className="space-y-6">
                                                {guide.steps.map((step, stepIdx) => (
                                                    <div key={stepIdx} className="relative flex gap-4">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                                                            {/* Dot */}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-sm text-gray-800">{step.title}</h5>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Care Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-3">
                                <Droplet size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Water</span>
                            <p className="font-medium text-gray-800 text-sm leading-tight">{selectedPlant.care.water}</p>
                        </div>
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-3">
                                <Star size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Light</span>
                            <p className="font-medium text-gray-800 text-sm leading-tight">{selectedPlant.care.sun}</p>
                        </div>
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-3">
                                <Leaf size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Temperature</span>
                            <p className="font-medium text-gray-800 text-sm leading-tight">{selectedPlant.care.temp}</p>
                        </div>
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-3">
                                <CloudRain size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Humidity</span>
                            <p className="font-medium text-gray-800 text-sm leading-tight">{selectedPlant.care.humidity}</p>
                        </div>
                    </div>

                    {/* Companions Section */}
                    {selectedPlant.companions && selectedPlant.companions.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 shadow-sm border border-emerald-100 mb-6">
                            <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                <Users size={20} className="text-emerald-600" />
                                Best Companions
                            </h3>
                            <div className="grid gap-3">
                                {selectedPlant.companions.map((companion, i) => (
                                    <div key={i} className="flex flex-col gap-2 bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 font-bold text-sm">
                                                {companion.name.charAt(0)}
                                            </div>
                                            <h4 className="font-bold text-gray-800 text-base">{companion.name}</h4>
                                        </div>

                                        <div className="flex items-start gap-2 mt-1">
                                            <ShieldCheck size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-gray-600 leading-snug">{companion.benefit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Watering History */}
                    {selectedPlant.wateringHistory.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <History size={20} className="text-blue-500" />
                                Watering History
                            </h3>
                            <div className="space-y-3">
                                {selectedPlant.wateringHistory.slice(0, 5).map((date, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                        <span className="text-gray-600 font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-full">
                                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl border border-red-100 mb-12">
                        Remove Plant
                    </button>
                </div>
            </div>
        )
    }

    const renderScanner = (mode: 'identify' | 'diagnose') => {
        const isIdentify = mode === 'identify';

        if (isAnalyzing) {
            return (
                <div className="flex flex-col items-center justify-center min-h-full pb-40 animate-pulse">
                    <div className="relative w-32 h-32">
                        <div className="absolute inset-0 border-4 border-lime-500 rounded-full animate-ping opacity-20"></div>
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl z-10 relative">
                            <Loader2 size={48} className="text-lime-600 animate-spin" />
                        </div>
                    </div>
                    <h2 className="mt-8 text-2xl font-bold text-gray-800">Consulting Gemini...</h2>
                    <p className="text-gray-500 mt-2">Analyzing your plant's unique features</p>
                </div>
            )
        }

        if ((isIdentify && scanResult) || (!isIdentify && diagnosisResult)) {
            return (
                <div className="pb-40 pt-4">
                    <div className="relative rounded-3xl overflow-hidden h-64 shadow-lg mb-6">
                        <img src={selectedImage!} alt="Captured" className="w-full h-full object-cover" />
                        <button onClick={resetScanner} className="absolute top-14 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {isIdentify && scanResult ? (
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800">{scanResult.name}</h2>
                                        <p className="text-gray-500 italic">{scanResult.scientificName}</p>
                                    </div>
                                    <div className="bg-lime-100 text-lime-700 px-3 py-1 rounded-full text-sm font-semibold">
                                        98% Match
                                    </div>
                                </div>
                                <p className="mt-4 text-gray-600 leading-relaxed">{scanResult.description}</p>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 p-3 rounded-xl">
                                        <p className="text-xs text-blue-500 font-bold uppercase">Water</p>
                                        <p className="text-sm text-blue-900 font-medium mt-1">{scanResult.care.water}</p>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-xl">
                                        <p className="text-xs text-amber-500 font-bold uppercase">Light</p>
                                        <p className="text-sm text-amber-900 font-medium mt-1">{scanResult.care.sun}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-xl">
                                        <p className="text-xs text-red-500 font-bold uppercase">Temp</p>
                                        <p className="text-sm text-red-900 font-medium mt-1">{scanResult.care.temp}</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl">
                                        <p className="text-xs text-green-500 font-bold uppercase">Humidity</p>
                                        <p className="text-sm text-green-900 font-medium mt-1">{scanResult.care.humidity}</p>
                                    </div>
                                </div>
                            </div>

                            {/* New Companion Plants Card */}
                            {scanResult.companions && scanResult.companions.length > 0 && (
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100">
                                    <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                                        <Sprout size={20} />
                                        Garden Companions
                                    </h3>
                                    <div className="space-y-3">
                                        {scanResult.companions.map((comp, idx) => (
                                            <div key={idx} className="bg-white/80 p-4 rounded-2xl flex flex-col gap-1 border border-emerald-100/50">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-emerald-900 text-base">{comp.name}</span>
                                                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Recommended</div>
                                                </div>
                                                <div className="flex items-start gap-2 mt-1">
                                                    <ShieldCheck size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-emerald-800/80 leading-snug">{comp.benefit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
                                <h3 className="font-bold text-purple-900 mb-2">Did you know?</h3>
                                <p className="text-purple-800 text-sm">{scanResult.funFact}</p>
                            </div>

                            <button onClick={addToGarden} className="w-full bg-lime-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-lime-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <Plus size={20} />
                                Add to Garden <span className="text-lime-200 text-sm">(+50 XP)</span>
                            </button>
                        </div>
                    ) : diagnosisResult ? (
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border-l-4 border-red-400">
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">Diagnosis Report</h2>
                                <p className="text-red-500 font-semibold text-lg">{diagnosisResult.issue}</p>
                                <p className="mt-3 text-gray-600">{diagnosisResult.description}</p>
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle className="text-lime-500" size={20} />
                                    Treatment Plan
                                </h3>
                                <ul className="space-y-3">
                                    {diagnosisResult.treatment.map((step, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-gray-600">
                                            <span className="w-6 h-6 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-500">{i + 1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-blue-50 rounded-3xl p-6">
                                <h3 className="font-bold text-blue-800 mb-2 text-sm uppercase">Prevention</h3>
                                <p className="text-blue-700 text-sm">{diagnosisResult.prevention}</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            );
        }

        return (
            <div className="min-h-full flex flex-col relative pb-40">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 pt-4">{isIdentify ? 'Identify Plant' : 'Dr. Plant'}</h1>
                <p className="text-gray-500 mb-8">{isIdentify ? 'Snap a photo to get care tips.' : 'Take a photo of the issue.'}</p>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {selectedImage ? (
                        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-black mb-6 shadow-2xl">
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-90" />

                            {!isIdentify && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <input
                                        type="text"
                                        value={userPrompt}
                                        onChange={(e) => setUserPrompt(e.target.value)}
                                        placeholder="Describe the issue (optional)..."
                                        className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:bg-white/30"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-4 bg-gray-50 mb-6">
                            <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center text-lime-600">
                                <CameraIcon size={40} />
                            </div>
                            <p className="text-gray-400 font-medium">No image selected</p>
                        </div>
                    )}

                    <div className="flex gap-4 w-full">
                        {selectedImage ? (
                            <div className="flex w-full gap-4">
                                <button onClick={() => setSelectedImage(null)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl active:scale-95 transition-transform">
                                    Retake
                                </button>
                                <button
                                    onClick={isIdentify ? handleIdentify : handleDiagnose}
                                    className="flex-[2] bg-lime-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-lime-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <ScanLine size={20} />
                                    {isIdentify ? 'Identify' : 'Diagnose'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white border-2 border-gray-100 text-gray-600 font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform">
                                    <Upload size={24} />
                                    <span className="text-xs">Upload</span>
                                </button>
                                <button onClick={handleTakePhoto} className="flex-[2] bg-lime-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-lime-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
                                    <CameraIcon size={28} />
                                    <span className="text-xs">Take Photo</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>
        );
    };

    const renderProfile = () => (
        <div className="space-y-8 pb-40 pt-4">
            {/* Profile Header & Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-lime-100 to-transparent"></div>
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden z-10 mb-4 bg-gray-200">
                    <img src="https://picsum.photos/200" alt="Profile" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 z-10">{user.name}</h2>
                <div className="flex items-center gap-1 text-gray-500 z-10 mt-1 mb-4">
                    <MapPin size={16} />
                    <span>{user.location}</span>
                </div>

                {/* Sign In Button */}
                <button
                    onClick={async () => {
                        const googleUser = await signInWithGoogle();
                        if (googleUser) {
                            setUser(googleUser);
                            alert(`Welcome, ${googleUser.name}!`);
                        }
                    }}
                    className="z-10 flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-xl shadow-sm active:scale-95 transition-transform mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>

                <div className="w-full mt-2 grid grid-cols-3 gap-4 border-t pt-6">
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

            {/* Upgrade Button */}
            <div className="bg-gradient-to-r from-lime-500 to-green-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-xl mb-1">Go Pro</h3>
                    <p className="text-lime-100 text-sm mb-4">Unlock unlimited AI diagnosis</p>
                    <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-white text-lime-600 font-bold py-3 px-6 rounded-xl shadow-md active:scale-95 transition-transform w-full"
                    >
                        Upgrade for $4.99
                    </button>
                </div>
                <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
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
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${isUnlocked
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

            {/* Settings Section */}
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

    // Conditional render: WebLanding for web guests, App for native/logged-in users
    if (showLanding) {
        return <WebLanding onLogin={handleWebLogin} />;
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] text-gray-800 font-sans flex justify-center">
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

            {renderPlantDetails()}

            <div className="w-full max-w-md h-screen overflow-y-auto bg-[#F3F4F6] px-6 pt-6">
                {currentView === View.DASHBOARD && renderDashboard()}
                {currentView === View.GARDEN && renderGarden()}
                {currentView === View.IDENTIFY && renderScanner('identify')}
                {currentView === View.DIAGNOSE && renderScanner('diagnose')}
                {currentView === View.PROFILE && renderProfile()}
                {currentView === View.CHAT && renderChat()}
            </div>
            <Navigation currentView={currentView} onNavigate={(view) => {
                resetScanner();
                setCurrentView(view);
            }}
                onUpgrade={() => setCurrentView(View.PROFILE)}
            />
            <SubscriptionModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onSuccess={() => {
                    setIsPro(true);
                    setShowUpgradeModal(false);
                }}
            />
        </div>
    );
};

export default App;