import { Plant, WeatherData } from '../types';

export function calculateNextWatering(
    plant: Plant,
    baseFrequency: number,
    currentWeather: WeatherData | null
): string {
    let daysToAdd = baseFrequency;

    // Outdoor adjustments based on weather
    if (plant.locationType === 'outdoor' && currentWeather) {
        if (currentWeather.temp > 28) {
            daysToAdd *= 0.7; // Water sooner if hot
        } else if (currentWeather.temp < 15) {
            daysToAdd *= 1.3; // Water later if cold
        }

        if (currentWeather.humidity > 70) {
            daysToAdd += 1; // High humidity slows drying
        }
    }

    // Seasonal adjustment (Winter: Jun-Aug -> Months 5-7)
    const now = new Date();
    const currentMonth = now.getMonth();
    if (currentMonth >= 5 && currentMonth <= 7) {
        daysToAdd *= 1.5; // Plants grow slower in winter
    }

    // Calculate new date
    const nextDueDate = new Date(now);
    nextDueDate.setDate(nextDueDate.getDate() + Math.round(daysToAdd));

    return nextDueDate.toISOString();
}
