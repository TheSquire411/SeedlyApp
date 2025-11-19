import React, { useState, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Camera, Upload, X, Loader2, CheckCircle, ScanLine, Plus, Sprout, ShieldCheck } from 'lucide-react';
import { IdentifyResult, DiagnosisResult, Plant, AppContextType } from '../types';
import { identifyPlant, diagnosePlant } from '../services/gemini';

const Scanner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, addPlant, updateUserStats } = useOutletContext<AppContextType>();
  
  // Determine mode based on URL
  const mode = location.pathname.includes('diagnose') ? 'diagnose' : 'identify';
  const isIdentify = mode === 'identify';

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<IdentifyResult | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetScanner = () => {
      setSelectedImage(null);
      setScanResult(null);
      setDiagnosisResult(null);
      setUserPrompt("");
      setIsAnalyzing(false);
  };

  const handleIdentify = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await identifyPlant(selectedImage, user.location);
      setScanResult(result);
      updateUserStats({ plantsIdentified: user.stats.plantsIdentified + 1 });
    } catch (error) {
      alert("Failed to identify plant. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDiagnose = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await diagnosePlant(selectedImage, userPrompt || "Check for any issues");
      setDiagnosisResult(result);
      updateUserStats({ plantsDiagnosed: user.stats.plantsDiagnosed + 1 });
    } catch (error) {
      alert("Diagnosis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToGarden = () => {
    if (scanResult && selectedImage) {
      const newPlant: Plant = {
        id: Date.now().toString(),
        name: scanResult.name,
        scientificName: scanResult.scientificName,
        image: selectedImage,
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
      
      addPlant(newPlant);
      resetScanner();
      navigate('/garden');
    }
  };

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
                <button onClick={resetScanner} className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
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

                    <button onClick={handleAddToGarden} className="w-full bg-lime-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-lime-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
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
                      <Camera size={40} />
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
                      <button onClick={() => fileInputRef.current?.click()} className="flex-[2] bg-lime-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-lime-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
                          <Camera size={28} />
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
          capture="environment"
          className="hidden" 
          onChange={handleFileSelect}
      />
    </div>
  );
};

export default Scanner;
