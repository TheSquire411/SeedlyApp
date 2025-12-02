import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { UserProfile } from "../types";

// Helper to map the Firebase User format to your App's UserProfile format
const mapUser = (firebaseUser: any): UserProfile => {
    return {
        name: firebaseUser.displayName || "Gardener",
        location: "Unknown", // We'll let the Geo code handle this later
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
};

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
    try {
        // 1. The Native Login Flow
        const result = await FirebaseAuthentication.signInWithGoogle();

        // 2. Success! We have a user.
        const user = result.user;
        console.log("✅ Google Login Success:", user.email);

        // 3. Return mapped profile
        return mapUser(user);

    } catch (error) {
        console.error("❌ Google Login Failed:", error);
        return null;
    }
};

export const signOut = async () => {
    await FirebaseAuthentication.signOut();
    console.log("Signed out");
};

export const getUser = async (): Promise<UserProfile | null> => {
    // Check if user is already logged in when app opens
    const result = await FirebaseAuthentication.getCurrentUser();
    if (result.user) {
        return mapUser(result.user);
    }
    return null;
};