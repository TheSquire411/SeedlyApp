import React, { useEffect, useState } from 'react';
import { X, Check, Star, Loader2 } from 'lucide-react';
import { getOfferings, purchasePackage, restorePurchases } from '../services/revenueCat';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadOfferings();
        }
    }, [isOpen]);

    const loadOfferings = async () => {
        setLoading(true);
        const offerings = await getOfferings();
        if (offerings && offerings.current && offerings.current.availablePackages.length > 0) {
            setPackages(offerings.current.availablePackages);
        }
        setLoading(false);
    };

    const handlePurchase = async (pkg: PurchasesPackage) => {
        setPurchasing(true);
        const success = await purchasePackage(pkg);
        setPurchasing(false);
        if (success) {
            onSuccess();
            onClose();
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        const success = await restorePurchases();
        setPurchasing(false);
        if (success) {
            alert("Purchases restored successfully!");
            onSuccess();
            onClose();
        } else {
            alert("No active subscriptions found to restore.");
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-lime-400 to-emerald-600 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ring-4 ring-white/30">
                        <Star size={40} className="text-yellow-300 fill-yellow-300" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 shadow-black drop-shadow-md">Go Pro</h2>
                    <p className="text-lime-100 font-medium">Unlock the full potential of your garden</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 flex-shrink-0">
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 font-medium">Unlimited Plant Identifications</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 flex-shrink-0">
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 font-medium">Advanced Disease Diagnosis</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 flex-shrink-0">
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 font-medium">Exclusive Gardening Guides</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 flex-shrink-0">
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 font-medium">Priority AI Assistant Support</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={32} className="text-lime-500 animate-spin" />
                        </div>
                    ) : packages.length > 0 ? (
                        <div className="space-y-3">
                            {packages.map((pkg) => (
                                <button
                                    key={pkg.identifier}
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={purchasing}
                                    className="w-full py-4 px-6 bg-lime-500 hover:bg-lime-600 text-white rounded-2xl font-bold shadow-lg shadow-lime-200 active:scale-95 transition-all flex justify-between items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <span>{pkg.product.title}</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                                        {pkg.product.priceString}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-4">
                            No packages available. Please check your configuration.
                        </div>
                    )}

                    <button
                        onClick={handleRestore}
                        className="w-full mt-4 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
                    >
                        Restore Purchases
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;
