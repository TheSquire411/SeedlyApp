
import { auth } from "./firebaseConfig";
// Firebase imports removed due to build errors
// import { 
//   signInWithPopup, 
//   GoogleAuthProvider, 
//   signOut as firebaseSignOut, 
//   onAuthStateChanged, 
//   User 
// } from "firebase/auth";
import { UserProfile } from "../types";

// Mock User type to replace Firebase User
type User = any;

// Mock User for preview purposes
const MOCK_USER: UserProfile = {
  name: "Alex (Offline)",
  location: "San Francisco, CA",
  level: 3,
  xp: 340,
  joinedDate: "2023-01-15",
  stats: {
    plantsAdded: 2,
    plantsDiagnosed: 0,
    plantsIdentified: 0,
    wateringTasksCompleted: 0,
  },
  achievements: []
};

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  console.warn("Auth service not initialized. Using Mock login.");
  // Return mock user immediately
  return MOCK_USER;
};

export const signOut = async () => {
  console.log("Mock: Signed out");
};

export const getUser = (): Promise<User | null> => {
  return Promise.resolve(null);
};
