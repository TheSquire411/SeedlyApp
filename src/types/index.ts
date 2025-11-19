export type ReminderType = 'water' | 'fertilize' | 'repot' | 'mist' | 'custom';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  frequencyDays: number;
  lastCompleted?: string;
  nextDue: string; // ISO Date
}

export interface CompanionPlant {
  name: string;
  benefit: string;
}

export interface GuideStep {
  title: string;
  description: string;
}

export interface VisualGuide {
  title: string;
  steps: GuideStep[];
}

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  nickname?: string;
  image: string;
  care: {
    water: string;
    sun: string;
    temp: string;
    humidity: string;
  };
  reminders: Reminder[];
  wateringHistory: string[];
  companions: CompanionPlant[];
  quickTips?: string[];
  visualGuides?: VisualGuide[];
  health: 'Good' | 'Needs Attention' | 'Critical';
  diagnosis?: DiagnosisResult;
  dateAdded: string;
}

export interface DiagnosisResult {
  issue: string;
  description: string;
  treatment: string[];
  prevention: string;
  confidence: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
}

export interface UserStats {
  plantsAdded: number;
  plantsDiagnosed: number;
  plantsIdentified: number;
  wateringTasksCompleted: number;
}

export interface UserProfile {
  name: string;
  location: string;
  level: number;
  xp: number;
  joinedDate: string;
  stats: UserStats;
  achievements: Achievement[];
}

export interface IdentifyResult {
  name: string;
  scientificName: string;
  care: {
    water: string;
    sun: string;
    temp: string;
    humidity: string;
  };
  companions: CompanionPlant[];
  quickTips?: string[];
  visualGuides?: VisualGuide[];
  description: string;
  funFact: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  icon: string;
  advice: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// App Context Interface for useOutletContext
export interface AppContextType {
  user: UserProfile;
  plants: Plant[];
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  updateUserStats: (stats: Partial<UserStats>) => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (plant: Plant) => void;
  removePlant: (id: string) => void;
  setSelectedPlant: (plant: Plant | null) => void;
}
