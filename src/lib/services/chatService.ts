import { WeatherData } from '@/types';
import { getCoordinatesFromPlaceName, getPlaceNameFromCoordinates } from '@/lib/api/geocoding';
import { getWeatherData, getWeatherForecast, getCurrentAirPollution, getForecastAirPollution } from '@/lib/api/weather';
import { getSpiralWeatherLocations, formatSpiralWeatherData } from '@/lib/api/weatherSpiral';
import { getNearbyPOIs } from '@/lib/api/places';
import { getWindDirectionCode, getWindDirectionName } from '@/lib/utils/wind';
import { createChatModel, GeminiResponse } from '@/lib/gemini';
import { getLocationNews, Article } from '@/lib/api/news';

const DAILY_NEWS_LIMIT = parseInt(process.env.NEXT_PUBLIC_DAILY_NEWS_LIMIT || '10', 10);
const NEWS_REQUEST_KEY = 'news_requests';
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

interface NewsRequestTracker {
  count: number;
  timestamp: number;
}

function checkNewsRequestLimit(): boolean {
  const now = Date.now();
  const stored = localStorage.getItem(NEWS_REQUEST_KEY);
  let tracker: NewsRequestTracker = stored
    ? JSON.parse(stored)
    : { count: 0, timestamp: now };

  if (now - tracker.timestamp >= ONE_DAY_IN_MS) {
    tracker = { count: 0, timestamp: now };
    localStorage.setItem(NEWS_REQUEST_KEY, JSON.stringify(tracker));
  }

  return tracker.count < DAILY_NEWS_LIMIT;
}

function incrementNewsRequestCount(): void {
  const now = Date.now();
  const stored = localStorage.getItem(NEWS_REQUEST_KEY);
  let tracker: NewsRequestTracker = stored
    ? JSON.parse(stored)
    : { count: 0, timestamp: now };

  if (now - tracker.timestamp >= ONE_DAY_IN_MS) {
    tracker = { count: 0, timestamp: now };
  }

  tracker.count += 1;
  tracker.timestamp = now;
  localStorage.setItem(NEWS_REQUEST_KEY, JSON.stringify(tracker));
}

// Helper function to format news into a detailed summary
function formatNewsSummary(articles: Article[], location: string, daysBack: number): string {
  if (!articles || articles.length === 0) {
    return `No news found for ${location} in the past ${daysBack} day${daysBack === 1 ? '' : 's'}.`;
  }

  let summary = `Here’s a detailed rundown of the latest news for ${location} from the past ${daysBack} day${daysBack === 1 ? '' : 's'}:\n\n`;
  articles.slice(0, 5).forEach((article, index) => {
    const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    summary += `**${index + 1}. ${article.title}** (Published by *${article.source.name}* on ${publishedDate})\n`;
    summary += `${article.description || 'No description available.'}\n\n`;
  });
  return summary;
}

// Helper function to format 5-day forecast
function formatForecast(forecastData: any, location: string): string {
  if (!forecastData || !forecastData.list) {
    return `No forecast data available for ${location}.`;
  }

  let forecastText = `Here’s the 5-day weather forecast for ${location}:\n\n`;
  forecastData.list.slice(0, 5).forEach((day: any) => {
    const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    forecastText += `**${date}**: ${day.main.temp}°C, ${day.weather[0].description}, Humidity: ${day.main.humidity}%\n`;
  });
  return forecastText;
}

// Helper function to suggest clothing based on weather
function suggestClothing(weatherData: any, location: string): string {
  if (!weatherData) {
    return `I don’t have the weather data for ${location} to suggest clothing.`;
  }

  const temp = weatherData.main.temp;
  const description = weatherData.weather[0].description.toLowerCase();
  let suggestion = `Here’s what to wear in ${location} today (currently ${temp}°C, ${description}):\n`;

  if (temp < 5) {
    suggestion += `- Bundle up with a heavy coat, scarf, gloves, and warm layers.`;
  } else if (temp < 15) {
    suggestion += `- A jacket or sweater with long pants should do the trick.`;
  } else if (temp < 25) {
    suggestion += `- Light clothing like a t-shirt and jeans works well.`;
  } else {
    suggestion += `- Go for shorts, a t-shirt, and maybe some sunglasses!`;
  }

  if (description.includes('rain')) {
    suggestion += `\n- Don’t forget an umbrella or raincoat—it’s wet out there!`;
  } else if (description.includes('clear') || description.includes('sun')) {
    suggestion += `\n- Sunscreen might be a good idea with all that sunshine.`;
  }

  return suggestion;
}

export async function getChatResponse(
  message: string,
  tempMarkerCoords?: [number, number],
  currentLocationCoords?: [number, number]
): Promise<GeminiResponse> {
  // console.log('Received in getChatResponse:', { message, tempMarkerCoords, currentLocationCoords });

  try {
    const model = createChatModel();
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: `
            You're a friendly, chatty Map assistant who loves helping out with a warm, natural tone. You can:
            1. Plan travel (e.g., "Plan a trip to Paris" or "Set a travel plan for Paris{location=temporary marker} for 7 days").
            2. Share weather, air quality, and news info (e.g., "Tell me about the location{location=temporary marker}?" or "Tell me about London" or "Tell me about this location").
            3. List nearby activities (e.g., "What are the things I can do in Paris (within 15 km)?" or "Things to do in this location").
            4. Provide news updates (e.g., "What are the updates regarding London?").
            5. Answer specific queries like:
               - "How's the air quality in this location?"
               - "What's the 5-day forecast for this location?"
               - "What should I wear in this location today?"
               - "Any recent news from this location?"
            6. Suggest nearby locations based on weather preferences (e.g., "What are some colder places I can go to?" or "I want to go to someplace rainy").

            When parsing commands:
            - Respond with friendly greetings.
            - Use temporary marker coordinates [${
              tempMarkerCoords ? tempMarkerCoords.join(', ') : 'not provided'
            }] only when "temporary marker" or "this location" is explicitly mentioned.
            - Use current location coordinates [${
              currentLocationCoords ? currentLocationCoords.join(', ') : 'not provided'
            }] for "this location", "current location", or as the default when no specific place is mentioned.
            - If a place name is given (e.g., "Paris" in "Things to do in Paris"), fetch its coordinates using the API.
            - For "Tell me about..." or "Plan a trip to...":
              - Return weather and air quality as structured data for a widget card.
              - Include a natural text response with weather, health tips, clothing advice, local suggestions, and recent news (past week by default).
            - For "What are the updates regarding..." or "Any recent news from...":
              - Provide a concise summary of news, defaulting to the past week unless a specific time range (e.g., "past 2 days", "last month") is mentioned.
            - For "What are the things I can do in..." or "Things to do in/near...":
              - Parse for radius (default to 5 km if not specified).
              - Suggest up to 10 POIs within the specified radius.
            - For weather preference queries like "What are some [condition] places I can go to?":
              - Use spiral weather data to suggest top 5 locations within 200km based on conditions (e.g., cold, warm, rainy, windy, sunny, humid, calm, clean air).
            - Format naturally with bold text and bullet points.
            - Use location names instead of coordinates in responses.
            - Assume current date is ${new Date().toISOString().split('T')[0]}.
            - Limit news requests to ${DAILY_NEWS_LIMIT} per day; if exceeded, say "You've hit the daily news limit of ${DAILY_NEWS_LIMIT} requests—check back tomorrow!"
            - If a question is outside these capabilities (e.g., historical events beyond news, specific event details), respond: "Sorry, I can’t answer that! I’m built to help with weather, air quality, news updates, nearby activities, and travel planning. What else can I assist you with?"
          `,
        },
        {
          role: 'model',
          parts: "Hey there! I'm your go-to buddy for weather, trips, news, and fun stuff to do. Give me a place or a question, and I'll help out!",
        },
      ],
    });

    let finalCoords: [number, number] | undefined = currentLocationCoords;
    let weatherData: any = null;
    let forecastWeatherData: any = null;
    let currentAirData: any = null;
    let forecastAirData: any[] | null = null;
    let nearbyPOIs: any[] | null = null;
    let newsArticles: Article[] | null = null;
    let locationName = '';
    let radiusKm = 5;
    let newsDaysBack = 7;

    const isCurrentLocationInfo = message.toLowerCase().includes('current location');
    const isThingsToDo = message.toLowerCase().includes('things i can do in') || message.toLowerCase().includes('things to do in') || message.toLowerCase().includes('things to do near');
    const isTripPlanning = message.toLowerCase().includes('plan a trip to');
    const isTellMeAbout = message.toLowerCase().includes('tell me about');
    const isNewsUpdates = message.toLowerCase().includes('what are the updates regarding') || message.toLowerCase().includes('any recent news from');
    const isTempMarkerQuery = message.toLowerCase().includes('temporary marker') || message.toLowerCase().includes('this location');
    const isAirQualityQuery = message.toLowerCase().includes('how\'s the air quality');
    const isForecastQuery = message.toLowerCase().includes('5-day forecast');
    const isClothingQuery = message.toLowerCase().includes('what should i wear');
    const isWeatherPreferenceQuery = message.toLowerCase().includes('someplace') || 
                                    message.toLowerCase().includes('somewhere') || 
                                    message.toLowerCase().includes('place where') ||
                                    message.toLowerCase().includes('what are some');
    const isUnsupportedQuery = message.toLowerCase().includes('what happened') || 
                              message.toLowerCase().includes('events coming up') || 
                              message.toLowerCase().includes('restaurants') || 
                              !isThingsToDo && !isTripPlanning && !isTellMeAbout && !isNewsUpdates && 
                              !isAirQualityQuery && !isForecastQuery && !isClothingQuery && 
                              !isWeatherPreferenceQuery && 
                              !message.toLowerCase().includes('remind me');
    const isGreeting = /^(hello|hi|hey|good (morning|afternoon|evening|night))\b/.test(message.toLowerCase());
    const isHowAreYou = /\b(how are you|how's it going|how have you been)\b/.test(message.toLowerCase());
    const isThanks = /\b(thank you|thanks|appreciate it)\b/.test(message.toLowerCase());

    if (isGreeting) {
      return { content: "Hey there! Hope you're having a great day. How can I help you?", data: null };
    } else if (isHowAreYou) {
      return { content: "I'm doing great, thanks for asking! How about you?", data: null };
    } else if (isThanks) {
      return { content: "You're very welcome! Let me know if you need anything else.", data: null };
    }

    if (isUnsupportedQuery && !isTempMarkerQuery && !isCurrentLocationInfo) {
      return {
        content: "Sorry, I can’t answer that! I’m built to help with weather, air quality, news updates, nearby activities, and travel planning. What else can I assist you with?",
        data: null,
      };
    }

    const timeRangeMatch = message.toLowerCase().match(/(past|last)\s+(\d+)\s+(day|days|month|months)/i);
    if (timeRangeMatch) {
      const quantity = parseInt(timeRangeMatch[2]);
      const unit = timeRangeMatch[3].toLowerCase();
      newsDaysBack = unit.includes('month') ? quantity * 30 : quantity;
    }

    if (isThingsToDo) {
      const radiusMatch = message.match(/within\s+(\d+\.?\d*)\s*(km|m)/i);
      if (radiusMatch) {
        const value = parseFloat(radiusMatch[1]);
        const unit = radiusMatch[2].toLowerCase();
        radiusKm = unit === 'km' ? value : value / 1000;
      }
    }

    const placeMatch = message.match(/(?:things to do in|things to do near|about|for|to|regarding|in|from)\s+([A-Za-z\s]+)(?={location=temporary marker}|\?|for\s+\d+\s+days|within\s+\d+\s*(km|m)|at\s+\[.*?\]|$)/i);
    const placeName = placeMatch ? placeMatch[1].trim() : null;

    if (isTempMarkerQuery && tempMarkerCoords) {
      finalCoords = tempMarkerCoords;
      locationName = (await getPlaceNameFromCoordinates(finalCoords[1], finalCoords[0])) || 'that spot you marked';
    } else if (isCurrentLocationInfo && currentLocationCoords) {
      finalCoords = currentLocationCoords;
      locationName = (await getPlaceNameFromCoordinates(finalCoords[1], finalCoords[0])) || 'your current spot';
    } else if (placeName && placeName.toLowerCase() !== 'current location' && placeName.toLowerCase() !== 'this location') {
      const coords = await getCoordinatesFromPlaceName(placeName);
      if (coords) {
        finalCoords = coords;
        locationName = placeName;
      } else {
        return { content: `Oops, I couldn't find "${placeName}" on the map. Try another spot or drop a marker!`, data: null };
      }
    } else if (!finalCoords && (isThingsToDo || isTellMeAbout || isTripPlanning || isNewsUpdates || isAirQualityQuery || isForecastQuery || isClothingQuery || isWeatherPreferenceQuery)) {
      if (currentLocationCoords) {
        finalCoords = currentLocationCoords;
        locationName = (await getPlaceNameFromCoordinates(finalCoords[1], finalCoords[0])) || 'your current spot';
      } else {
        return { content: "Hmm, I need a spot to work with! Drop a marker or give me a place name like 'Paris', and I'll get going!", data: null };
      }
    }

    let newsLimitExceeded = false;
    let promptWithCoords = message;

    if (finalCoords) {
      if (isWeatherPreferenceQuery) {
        const spiralPoints = await getSpiralWeatherLocations(
          { lat: finalCoords[1], lng: finalCoords[0] },
          message
        );

        const weatherCards = spiralPoints.map(point => formatSpiralWeatherData(point));
        const spiralPois = spiralPoints.map((point, index) => ({
          id: `spiral-${index}`,
          lat: point.location.lat,
          lng: point.location.lng,
          name: point.name,
          category: 'Weather Suggestion',
          priority: index + 1,
        }));

        promptWithCoords += `\nSpiral Weather Data (top 5 locations within 200km):\n${JSON.stringify(spiralPois)}\n` +
          `Provide a friendly response listing these locations with their weather details, matching the user's preference: "${message}".`;

        const response = await chat.sendMessage(promptWithCoords);
        return {
          content: response.response.text().trim(),
          data: {
            pois: spiralPois,
            center: { lat: finalCoords[1], lng: finalCoords[0] },
            radiusKm: 200,
            weatherData: weatherCards.length > 0 ? weatherCards : undefined,
          },
        };
      }

      weatherData = await getWeatherData(finalCoords[1], finalCoords[0]);
      currentAirData = await getCurrentAirPollution(finalCoords[1], finalCoords[0]);
      forecastAirData = await getForecastAirPollution(finalCoords[1], finalCoords[0]);
      nearbyPOIs = await getNearbyPOIs(finalCoords[1], finalCoords[0], isThingsToDo ? radiusKm : 5);

      if (isTellMeAbout || isTripPlanning || isAirQualityQuery || isClothingQuery) {
        weatherData = await getWeatherData(finalCoords[1], finalCoords[0]);
        currentAirData = await getCurrentAirPollution(finalCoords[1], finalCoords[0]);
      }
      if (isTellMeAbout || isTripPlanning || isForecastQuery) {
        forecastWeatherData = await getWeatherForecast(finalCoords[1], finalCoords[0]);
      }
      if (isTellMeAbout || isTripPlanning) {
        forecastAirData = await getForecastAirPollution(finalCoords[1], finalCoords[0]);
        nearbyPOIs = await getNearbyPOIs(finalCoords[1], finalCoords[0], isThingsToDo ? radiusKm : 5);
      }
      if (isTellMeAbout || isTripPlanning || isNewsUpdates) {
        if (checkNewsRequestLimit()) {
          newsArticles = await getLocationNews(locationName, 10, newsDaysBack);
          if (newsArticles) incrementNewsRequestCount();
        } else {
          newsLimitExceeded = true;
        }
      }

      promptWithCoords = `${message}\nCoordinates: [${finalCoords.join(', ')}]\nLocation name: ${locationName}`;
      if (weatherData) promptWithCoords += `\nWeather data: ${JSON.stringify(weatherData)}`;
      if (currentAirData) promptWithCoords += `\nCurrent air pollution data: ${JSON.stringify(currentAirData)}`;
      if (forecastAirData) promptWithCoords += `\nForecast air pollution data: ${JSON.stringify(forecastAirData?.slice(0, 24))}`;
      if (nearbyPOIs) promptWithCoords += `\nNearby POIs (within ${isThingsToDo ? radiusKm : 5} km): ${JSON.stringify(nearbyPOIs)}`;
      if (forecastWeatherData) promptWithCoords += `\n5-day weather forecast: ${JSON.stringify(forecastWeatherData)}`;
      if (isAirQualityQuery && currentAirData) {
        promptWithCoords += `\nAir quality response: The air quality in ${locationName} is at AQI ${currentAirData.list[0].main.aqi} (${currentAirData.list[0].main.aqi === 5 ? 'Very Poor' : currentAirData.list[0].main.aqi === 4 ? 'Poor' : currentAirData.list[0].main.aqi === 3 ? 'Moderate' : 'Good'}). PM2.5: ${currentAirData.list[0].components.pm2_5} µg/m³, O3: ${currentAirData.list[0].components.o3} µg/m³.`;
      }
      if (isForecastQuery && forecastWeatherData) {
        promptWithCoords += `\nForecast response: ${formatForecast(forecastWeatherData, locationName)}`;
      }
      if (isClothingQuery && weatherData) {
        promptWithCoords += `\nClothing response: ${suggestClothing(weatherData, locationName)}`;
      }
      if (newsArticles) {
        promptWithCoords += `\nRecent news (past ${newsDaysBack} days):\n${formatNewsSummary(newsArticles, locationName, newsDaysBack)}`;
      } else if (newsLimitExceeded) {
        promptWithCoords += `\nNews: You've hit the daily news limit of ${DAILY_NEWS_LIMIT} requests—check back tomorrow!`;
      }
    }

    const result = await chat.sendMessage(promptWithCoords);
    const response = result.response.text();

    let weatherCardData: WeatherData | undefined;
    if ((isTellMeAbout || isAirQualityQuery || isClothingQuery) && weatherData && currentAirData && forecastWeatherData) {
      weatherCardData = {
        city: {
          name: locationName,
          country: weatherData.sys.country || 'Unknown',
          sunrise: weatherData.sys.sunrise,
          sunset: weatherData.sys.sunset,
          timezone: weatherData.timezone,
        },
        temperature: {
          value: weatherData.main.temp,
          min: forecastWeatherData.list[0].main.temp_min,
          max: forecastWeatherData.list[0].main.temp_max,
          feels_like: weatherData.main.feels_like,
          unit: 'C',
        },
        humidity: {
          value: weatherData.main.humidity,
          unit: '%',
        },
        pressure: {
          value: weatherData.main.pressure,
          unit: 'hPa',
        },
        wind: {
          speed: {
            value: weatherData.wind.speed,
            unit: 'm/s',
            name: 'Light Breeze',
          },
          direction: {
            value: weatherData.wind.deg,
            code: getWindDirectionCode(weatherData.wind.deg),
            name: getWindDirectionName(weatherData.wind.deg),
          },
        },
        clouds: {
          value: weatherData.clouds.all,
          name: weatherData.weather[0].description,
        },
        visibility: {
          value: weatherData.visibility / 1000,
        },
        airQuality: {
          index: currentAirData.list[0].main.aqi,
          components: {
            co: currentAirData.list[0].components.co,
            no2: currentAirData.list[0].components.no2,
            o3: currentAirData.list[0].components.o3,
            pm2_5: currentAirData.list[0].components.pm2_5,
            pm10: currentAirData.list[0].components.pm10,
          },
        },
        forecast: forecastWeatherData.list.slice(0, 5).map((day: any) => ({
          dt: day.dt,
          temp: {
            day: day.main.temp,
            min: day.main.temp_min,
            max: day.main.temp_max,
            night: day.main.temp,
          },
          weather: {
            id: day.weather[0].id,
            main: day.weather[0].main,
            description: day.weather[0].description,
            icon: day.weather[0].icon,
          },
          pop: day.pop || 0,
          humidity: day.main.humidity,
        })),
      };
    }

    return {
      content: response.trim() || "Hey, I've got nothing yet—give me a place or a nudge!",
      data: nearbyPOIs
        ? { pois: nearbyPOIs, center: { lat: finalCoords![1], lng: finalCoords![0] }, radiusKm, weatherData: weatherCardData }
        : null,
    };
  } catch (error) {
    console.error('Error getting chat response:', error);
    return { content: "Yikes, something went off the rails. Let's try again soon!", data: null };
  }
}