import { Purchases, LOG_LEVEL, PurchasesPackage, PurchasesOfferings } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// ---------------------------------------------------------
// 👇 CONFIGURATION
// ---------------------------------------------------------
const API_KEYS = {
    ios: "appl_PLACEHOLDER_FOR_LATER", // Will need this for iPhone
    android: "goog_qhQJaPigGmncWDpkEARfecKmbmv", // <--- PASTE YOUR KEY HERE
};
// ---------------------------------------------------------

export const initializeRevenueCat = async () => {
    try {
        const platform = Capacitor.getPlatform();

        // 1. SAFETY CHECK: Don't run on web
        if (platform === 'web') {
            console.log("RevenueCat skipped (Web Platform)");
            return;
        }

        // 2. PLATFORM CHECK: Pick the right key
        let apiKey = "";
        if (platform === 'ios') apiKey = API_KEYS.ios;
        else if (platform === 'android') apiKey = API_KEYS.android;

        if (!apiKey) {
            console.warn("RevenueCat skipped: No API Key for platform", platform);
            return;
        }

        // 3. INITIALIZE
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey });
        console.log(`💰 RevenueCat initialized for ${platform}`);

    } catch (error) {
        console.error("Failed to initialize RevenueCat", error);
    }
};

// --- HELPER FUNCTIONS (From Agent) ---

export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null) {
            return offerings; // <--- FIX: Return the WHOLE object, not just .current
        }
        return null;
    } catch (error) {
        console.error("Error getting offerings", error);
        return null;
    }
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
    try {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
            console.log("User is now PRO");
            return true;
        }
    } catch (error: any) {
        if (error.userCancelled) {
            console.log("User cancelled purchase");
        } else {
            console.error("Purchase error", error);
        }
    }
    return false;
};

export const checkSubscriptionStatus = async (): Promise<boolean> => {
    try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
            return true;
        }
    } catch (error) {
        console.error("Error checking subscription status", error);
    }
    return false;
};

export const restorePurchases = async (): Promise<boolean> => {
    try {
        const { customerInfo } = await Purchases.restorePurchases();
        if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
            return true;
        }
    } catch (error) {
        console.error("Error restoring purchases", error);
    }
    return false;
}