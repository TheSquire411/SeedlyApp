import React, { useState } from 'react';
import { Plant, Reminder, ReminderType } from '../types';
import { ChevronLeft, Clock, Plus, Droplet, Sparkles, CloudRain, RefreshCw, Bell, CheckCircle, Trash2, Lightbulb, Layers, Scissors, Shovel, Sprout, Star, Leaf, Users, ShieldCheck, History } from 'lucide-react';

interface PlantDetailsProps {
  plant: Plant;
  onClose: () => void;
  onUpdatePlant: (plant: Plant) => void;
  onRemovePlant: (id: string) => void;
  onCompleteTask: (plantId: string, reminderId: string) => void;
}

const PlantDetails: React.FC<PlantDetailsProps> = ({ plant, onClose, onUpdatePlant, onRemovePlant, onCompleteTask }) => {
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminderConfig, setNewReminderConfig] = useState<{type: ReminderType, title: string, freq: number}>({
      type: 'custom',
      title: '',
      freq: 7
  });

  const handleAddReminder = () => {
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
          ...plant,
          reminders: [...plant.reminders, newReminder]
      };

      onUpdatePlant(updatedPlant);
      setShowReminderForm(false);
      setNewReminderConfig({ type: 'custom', title: '', freq: 7 });
  };

  const handleDeleteReminder = (reminderId: string) => {
      if (!confirm("Are you sure you want to delete this reminder?")) return;

      const updatedPlant = {
          ...plant,
          reminders: plant.reminders.filter(r => r.id !== reminderId)
      };
      onUpdatePlant(updatedPlant);
  };

  return (
      <div className="fixed inset-0 z-50 bg-[#F3F4F6] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
          {/* Header Image */}
          <div className="relative h-80 w-full">
              <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#F3F4F6]"></div>
              
              <button 
                onClick={onClose}
                className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-50"
              >
                  <ChevronLeft size={24} />
              </button>
              
              <div className="absolute bottom-8 left-6 right-6">
                   <div className="flex items-center gap-2 mb-2">
                        <span className="bg-lime-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {plant.health === 'Good' ? 'Healthy 🌿' : 'Check Me ⚠️'}
                        </span>
                        <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                            Indoor
                        </span>
                   </div>
                   <h1 className="text-4xl font-bold text-white shadow-black drop-shadow-md">{plant.nickname || plant.name}</h1>
                   <p className="text-white/90 italic font-medium">{plant.scientificName}</p>
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
                                          {id: 'water', icon: Droplet, label: 'Water'},
                                          {id: 'fertilize', icon: Sparkles, label: 'Feed'},
                                          {id: 'mist', icon: CloudRain, label: 'Mist'},
                                          {id: 'repot', icon: RefreshCw, label: 'Repot'},
                                          {id: 'custom', icon: Bell, label: 'Other'},
                                      ].map((opt) => (
                                          <button 
                                            key={opt.id}
                                            onClick={() => setNewReminderConfig({...newReminderConfig, type: opt.id as ReminderType, title: opt.id === 'custom' ? '' : opt.label})}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border whitespace-nowrap transition-all ${
                                                newReminderConfig.type === opt.id 
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
                                    onChange={(e) => setNewReminderConfig({...newReminderConfig, title: e.target.value})}
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
                                        onChange={(e) => setNewReminderConfig({...newReminderConfig, freq: parseInt(e.target.value)})}
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
                      {plant.reminders.sort((a,b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()).map(reminder => {
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
                                            onClick={() => onCompleteTask(plant.id, reminder.id)}
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
                      {plant.reminders.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                              No reminders set. Add one to keep your plant happy!
                          </div>
                      )}
                  </div>
              </div>

              {/* Quick Care Tips Section */}
              {plant.quickTips && plant.quickTips.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Lightbulb className="text-yellow-400 fill-yellow-400" size={20} />
                          Quick Care Tips
                      </h3>
                      <ul className="space-y-3">
                          {plant.quickTips.map((tip, i) => (
                              <li key={i} className="flex gap-3 items-start">
                                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 mt-2 flex-shrink-0" />
                                  <span className="text-gray-600 text-sm leading-relaxed">{tip}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
              
              {/* Visual Guides Section */}
              {plant.visualGuides && plant.visualGuides.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Layers className="text-indigo-500" size={20} />
                          Visual Guides
                      </h3>
                      <div className="space-y-6">
                        {plant.visualGuides.map((guide, idx) => (
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
                        <p className="font-medium text-gray-800 text-sm leading-tight">{plant.care.water}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-3">
                            <Star size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Light</span>
                        <p className="font-medium text-gray-800 text-sm leading-tight">{plant.care.sun}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-3">
                            <Leaf size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Temperature</span>
                        <p className="font-medium text-gray-800 text-sm leading-tight">{plant.care.temp}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-3">
                            <CloudRain size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Humidity</span>
                        <p className="font-medium text-gray-800 text-sm leading-tight">{plant.care.humidity}</p>
                    </div>
              </div>
              
              {/* Companions Section */}
              {plant.companions && plant.companions.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 shadow-sm border border-emerald-100 mb-6">
                      <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                          <Users size={20} className="text-emerald-600" />
                          Best Companions
                      </h3>
                      <div className="grid gap-3">
                          {plant.companions.map((companion, i) => (
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
              {plant.wateringHistory.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <History size={20} className="text-blue-500" />
                          Watering History
                      </h3>
                      <div className="space-y-3">
                          {plant.wateringHistory.slice(0, 5).map((date, i) => (
                              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                  <span className="text-gray-600 font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-full">
                                      {new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <button onClick={() => onRemovePlant(plant.id)} className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl border border-red-100 mb-12">
                  Remove Plant
              </button>
          </div>
      </div>
  )
}

export default PlantDetails;
