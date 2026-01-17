import React, { useEffect, useState } from 'react';
import { WeatherData } from '../types';
import { getWeatherAdvice } from '../services/gemini';
import { CloudSun, Droplets, Wind } from 'lucide-react';

const CACHE_KEY = 'seedly_weather_cache';

interface WeatherCardProps {
  location: string;
  coords?: { lat: number; lon: number } | null;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ location, coords }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cached data on mount to prevent blank tile flash
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached) as WeatherData;
        setWeather(cachedData);
      } catch (e) {
        console.warn("Failed to parse cached weather data");
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchWeather = async () => {
      try {
        const data = await getWeatherAdvice(location, coords ?? undefined);
        if (mounted) {
          setWeather(data);
          setLoading(false);
          // Cache the new data
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to fetch weather", error);
        if (mounted) setLoading(false);
      }
    };

    fetchWeather();
    return () => { mounted = false; };
  }, [location, coords]);

  if (loading) {
    return (
      <div className="w-full h-48 rounded-3xl bg-gray-200 animate-pulse" />
    );
  }

  if (!weather) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lime-400 to-emerald-600 p-6 text-white shadow-lg">
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-lime-100 font-medium text-sm">{location}</p>
          <h2 className="text-3xl font-bold mt-1">{weather.temp}°C</h2>
          <div className="flex items-center gap-2 mt-1 text-lime-50">
            <span>{weather.icon}</span>
            <span className="capitalize">{weather.condition}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
            <Droplets size={12} />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
            <Wind size={12} />
            <span>12 km/h</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
        <p className="text-sm font-medium leading-relaxed">
          💡 {weather.advice}
        </p>
      </div>
    </div>
  );
};

export default WeatherCard;