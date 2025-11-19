
import { db } from "./firebaseConfig";
// Firebase imports removed due to build errors
// import { 
//   collection, 
//   doc, 
//   setDoc, 
//   getDocs, 
//   updateDoc, 
//   deleteDoc, 
//   query, 
//   where 
// } from "firebase/firestore";
import { Plant } from "../types";

// Fallback data for preview/offline mode
const MOCK_PLANTS: Plant[] = [
  {
    id: '1',
    name: 'Peace Lily',
    scientificName: 'Spathiphyllum',
    nickname: 'Spathy',
    image: 'images/peace-lily.jpg',
    care: { water: 'Weekly', sun: 'Partial Shade', temp: '18-24°C', humidity: 'High' },
    reminders: [
        { id: 'r1', type: 'water', title: 'Water', frequencyDays: 7, nextDue: new Date(Date.now() + 86400000).toISOString() },
        { id: 'r2', type: 'fertilize', title: 'Fertilize', frequencyDays: 30, nextDue: new Date(Date.now() + 86400000 * 14).toISOString() }
    ],
    wateringHistory: [
        new Date(Date.now() - 86400000 * 6).toISOString(),
        new Date(Date.now() - 86400000 * 13).toISOString()
    ],
    companions: [
        { name: 'Pothos', benefit: 'Shares humidity needs and tolerates similar light' },
        { name: 'Philodendron', benefit: 'Great structural contrast, same watering schedule' }
    ],
    quickTips: [
        "Keep soil consistently moist but not soggy.",
        "Mist leaves frequently to simulate high humidity.",
        "Keep out of direct sunlight to avoid leaf burn."
    ],
    visualGuides: [
        {
            title: "How to Divide & Repot",
            steps: [
                { title: "Remove from Pot", description: "Gently slide the plant out of its container, supporting the base of the stems." },
                { title: "Tease Roots", description: "Loosen the root ball gently with your fingers to remove old soil." },
                { title: "Divide Clumps", description: "Identify natural separation points and pull the crowns apart, ensuring each has roots." },
                { title: "Pot Up", description: "Place each division into a new pot with fresh, well-draining soil." }
            ]
        }
    ],
    health: 'Good',
    dateAdded: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Monstera',
    scientificName: 'Monstera deliciosa',
    image: 'images/monstera.jpg',
    care: { water: 'Every 1-2 weeks', sun: 'Bright Indirect', temp: '20-30°C', humidity: 'Medium' },
    reminders: [
        { id: 'r3', type: 'water', title: 'Water', frequencyDays: 10, nextDue: new Date(Date.now() - 100000).toISOString() } // Overdue
    ],
    wateringHistory: [
        new Date(Date.now() - 86400000 * 12).toISOString()
    ],
    companions: [
        { name: 'Rubber Plant', benefit: 'Strong structural contrast for aesthetic' },
        { name: 'Schefflera', benefit: 'Repels spider mites that often attack Monstera' }
    ],
    quickTips: [
        "Allow the top 2-3 inches of soil to dry out between waterings.",
        "Wipe dust off leaves regularly for better photosynthesis.",
        "Rotate the plant occasionally for even growth."
    ],
    visualGuides: [
        {
            title: "Pruning & Propagation",
            steps: [
                { title: "Identify Node", description: "Locate a node (a bump on the stem where leaves/roots grow)." },
                { title: "Cut Below Node", description: "Use clean, sharp shears to cut about an inch below the node/aerial root." },
                { title: "Place in Water", description: "Put the cutting in a jar of water, ensuring the node is submerged but leaves are not." },
                { title: "Wait for Roots", description: "Change water weekly. Pot into soil once roots are 2-3 inches long." }
            ]
        }
    ],
    health: 'Good',
    dateAdded: new Date().toISOString()
  }
];

export const addPlantToGarden = async (userId: string, plant: Plant): Promise<void> => {
  console.log("Mock: Added plant to garden", plant.name);
  return;
};

export const getMyGarden = async (userId: string): Promise<Plant[]> => {
  console.log("Mock: Fetching garden");
  return MOCK_PLANTS;
};

export const updatePlantInGarden = async (userId: string, plant: Plant): Promise<void> => {
  console.log("Mock: Updated plant", plant.name);
  return;
};

export const deletePlantFromGarden = async (userId: string, plantId: string): Promise<void> => {
  console.log("Mock: Deleted plant", plantId);
  return;
};
