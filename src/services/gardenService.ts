import { db } from './firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Plant, Reminder } from '../types';

const COLLECTION_NAME = 'gardens';

// Helper to convert Firestore data to Plant type
const convertDocToPlant = (docId: string, data: any): Plant => {
    return {
        ...data,
        id: docId,
        dateAdded: data.dateAdded instanceof Timestamp ? data.dateAdded.toDate().toISOString() : data.dateAdded,
        wateringHistory: Array.isArray(data.wateringHistory)
            ? data.wateringHistory.map((d: any) => d instanceof Timestamp ? d.toDate().toISOString() : d)
            : [],
        reminders: Array.isArray(data.reminders)
            ? data.reminders.map((r: any) => ({
                ...r,
                nextDue: r.nextDue instanceof Timestamp ? r.nextDue.toDate().toISOString() : r.nextDue,
                lastCompleted: r.lastCompleted instanceof Timestamp ? r.lastCompleted.toDate().toISOString() : r.lastCompleted
            }))
            : []
    } as Plant;
};

// Helper to prepare Plant object for Firestore (converting dates to Timestamps)
const preparePlantForFirestore = (plant: Plant) => {
    const data: any = { ...plant };

    if (plant.dateAdded) {
        data.dateAdded = Timestamp.fromDate(new Date(plant.dateAdded));
    }

    if (plant.wateringHistory) {
        data.wateringHistory = plant.wateringHistory.map((d) => Timestamp.fromDate(new Date(d)));
    }

    if (plant.reminders) {
        data.reminders = plant.reminders.map((r) => {
            const rem: any = { ...r };
            if (rem.nextDue) rem.nextDue = Timestamp.fromDate(new Date(rem.nextDue));
            if (rem.lastCompleted) {
                rem.lastCompleted = Timestamp.fromDate(new Date(rem.lastCompleted));
            } else {
                delete rem.lastCompleted; // Remove undefined
            }
            return rem;
        });
    }

    return data;
};

export const getMyGarden = async (userId: string): Promise<Plant[]> => {
    try {
        const plantsRef = collection(db, COLLECTION_NAME, userId, 'plants');
        const snapshot = await getDocs(plantsRef);
        return snapshot.docs.map(doc => convertDocToPlant(doc.id, doc.data()));
    } catch (error) {
        console.error("Error fetching garden:", error);
        throw error;
    }
};

export const addPlantToGarden = async (userId: string, plant: Plant): Promise<void> => {
    try {
        const plantRef = doc(db, COLLECTION_NAME, userId, 'plants', plant.id);
        const data = preparePlantForFirestore(plant);
        await setDoc(plantRef, data);
    } catch (error) {
        console.error("Error adding plant:", error);
        throw error;
    }
};

export const updatePlantInGarden = async (userId: string, plant: Plant): Promise<void> => {
    try {
        const plantRef = doc(db, COLLECTION_NAME, userId, 'plants', plant.id);
        const data = preparePlantForFirestore(plant);
        await updateDoc(plantRef, data);
    } catch (error) {
        console.error("Error updating plant:", error);
        throw error;
    }
};

export const deletePlantFromGarden = async (userId: string, plantId: string): Promise<void> => {
    try {
        const plantRef = doc(db, COLLECTION_NAME, userId, 'plants', plantId);
        await deleteDoc(plantRef);
    } catch (error) {
        console.error("Error deleting plant:", error);
        throw error;
    }
};

/**
 * Increments the daily usage counter in Firestore and checks if the free limit is exceeded.
 * @param userId - The Firebase user ID
 * @returns true if usage is allowed, false if limit reached
 */
export const incrementAndCheckFreeUsage = async (userId: string): Promise<boolean> => {
    const FREE_LIMIT = 3;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
        const userRef = doc(db, COLLECTION_NAME, userId);
        const userDoc = await getDoc(userRef);
        const data = userDoc.data();

        let currentCount = 0;
        // If the document exists and lastUsageDate is today, use the existing count
        if (userDoc.exists() && data?.lastUsageDate === today) {
            currentCount = data.dailyUsageCount || 0;
        }
        // Otherwise, it's a new day or new user, so count resets to 0

        if (currentCount < FREE_LIMIT) {
            // Increment and update
            await setDoc(userRef, {
                lastUsageDate: today,
                dailyUsageCount: currentCount + 1
            }, { merge: true });
            return true;
        }

        // Limit reached
        return false;
    } catch (error) {
        console.error("Error checking free usage limit:", error);
        // On error, allow usage to avoid blocking legitimate users
        return true;
    }
};
