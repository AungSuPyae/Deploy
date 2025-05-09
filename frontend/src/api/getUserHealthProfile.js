// frontend/src/api/getUserHealthProfile.js
import { auth } from './firebaseConfig';
import { getUserProfile } from './profile';

// Cache for storing health profile data
let healthProfileCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache for nutrition recommendations
let nutritionRecommendationsCache = null;
let lastRecommendationsFetchTime = 0;

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Checks if the nutrition mode is currently enabled
 * @returns {boolean} True if nutrition mode is enabled
 */
export const isNutritionModeEnabled = () => {
  try {
    const nutritionModeStr = localStorage.getItem('nutritionModeEnabled');
    return nutritionModeStr ? JSON.parse(nutritionModeStr) : false;
  } catch (error) {
    console.error('Error checking nutrition mode status:', error);
    return false;
  }
};

/**
 * Gets the complete health profile of the currently logged in user
 * @param {boolean} bypassCache - Force a fresh fetch even if cached data exists
 * @returns {Promise<Object>} User's health profile data
 * @throws {Error} If user is not authenticated or profile cannot be retrieved
 */
export const getUserHealthProfile = async (bypassCache = false) => {
  // Check if nutrition mode is enabled
  const nutritionModeEnabled = isNutritionModeEnabled();
  console.log(`Nutrition mode is ${nutritionModeEnabled ? 'enabled' : 'disabled'}`);
  
  // If nutrition mode is disabled, don't fetch profile
  if (!nutritionModeEnabled) {
    console.log('Nutrition mode is disabled, skipping health profile fetch');
    throw new Error('Nutrition mode is disabled');
  }
  
  try {
    console.log('Getting health profile for current user');
    
    // Khi nutritionMode được bật từ UI, buộc lấy dữ liệu mới nhất từ Firestore
    // bằng cách đặt bypassCache = true
    
    // Check if we can use cached data
    const now = Date.now();
    if (!bypassCache && 
        healthProfileCache && 
        (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached health profile data');
      return healthProfileCache;
    }
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    // Get user ID
    const userId = currentUser.uid;
    console.log(`Current user ID: ${userId}, fetching fresh profile data from Firestore`);
    
    // Get user profile from Firestore
    const profileData = await getUserProfile(userId);
    
    if (!profileData || !profileData.healthProfile) {
      console.error('Health profile not found for user');
      throw new Error('Health profile not found');
    }
    
    // Extract just the health profile data
    const healthProfile = profileData.healthProfile;
    
    // Add user identification information
    const enrichedHealthProfile = {
      ...healthProfile,
      userId: userId,
      email: currentUser.email,
      displayName: currentUser.displayName || '',
      lastUpdated: profileData.updatedAt || profileData.createdAt
    };
    
    console.log('Successfully retrieved health profile from Firestore', enrichedHealthProfile);
    
    // Không tự động gửi yêu cầu đến backend ở đây nữa
    // Thay vào đó, chúng ta sẽ để recipes.tsx kiểm soát việc này
    
    // Update cache
    healthProfileCache = enrichedHealthProfile;
    lastFetchTime = now;
    
    return enrichedHealthProfile;
    
  } catch (error) {
    console.error('Error getting user health profile:', error);
    throw error;
  }
};

/**
 * Clears the health profile cache
 */
export const clearHealthProfileCache = () => {
  console.log('Clearing health profile cache');
  healthProfileCache = null;
  lastFetchTime = 0;
  nutritionRecommendationsCache = null;
  lastRecommendationsFetchTime = 0;
};

/**
 * Formats the user's health profile data in a way suitable for API transmission
 * @returns {Promise<Object>} Formatted health profile data
 * @throws {Error} If profile retrieval fails
 */
export const getFormattedHealthProfileForAPI = async () => {
  try {
    // Check if nutrition mode is enabled before continuing
    if (!isNutritionModeEnabled()) {
      console.log('Nutrition mode is disabled, skipping profile formatting');
      throw new Error('Nutrition mode is disabled');
    }
    
    // Luôn lấy dữ liệu mới nhất từ Firestore khi chuẩn bị gửi dữ liệu đến API
    const healthProfile = await getUserHealthProfile(true);
    
    // Format the data for API transmission
    const formattedData = {
      user: {
        id: healthProfile.userId,
        email: healthProfile.email,
        displayName: healthProfile.displayName
      },
      personal: {
        height: Number(healthProfile.height) || 0,
        weight: Number(healthProfile.weight) || 0,
        age: Number(healthProfile.age) || 0,
        gender: healthProfile.gender || 'Male'
      },
      lifestyle: {
        activityLevel: healthProfile.activityLevel || 'Sedentary',
        goal: healthProfile.goal || 'Weight Maintenance'
      },
      diet: {
        allergies: healthProfile.allergies || [],
        dietaryRestrictions: healthProfile.dietaryRestrictions || [],
        mealsPerDay: healthProfile.mealsPerDay || 3,
        macroDistribution: healthProfile.macroDistribution || 'Balanced'
      },
      nutrition: {
        bmr: healthProfile.calculatedNutrition?.bmr || 0,
        tdee: healthProfile.calculatedNutrition?.tdee || 0,
        targetCalories: healthProfile.calculatedNutrition?.targetCalories || 0,
        caloriesPerMeal: healthProfile.calculatedNutrition?.caloriesPerMeal || 0,
        dailyProtein: healthProfile.calculatedNutrition?.dailyProtein || 0,
        dailyCarbs: healthProfile.calculatedNutrition?.dailyCarbs || 0,
        dailyFat: healthProfile.calculatedNutrition?.dailyFat || 0,
        proteinPerMeal: healthProfile.calculatedNutrition?.proteinPerMeal || 0,
        carbsPerMeal: healthProfile.calculatedNutrition?.carbsPerMeal || 0,
        fatPerMeal: healthProfile.calculatedNutrition?.fatPerMeal || 0
      },
      meta: {
        lastUpdated: healthProfile.lastUpdated || new Date().toISOString()
      }
    };
    
    console.log('Formatted health profile data for API:', formattedData);
    return formattedData;
    
  } catch (error) {
    console.error('Error formatting health profile for API:', error);
    throw error;
  }
};

/**
 * Sends the user's health profile data to an external backend API
 * @param {string} apiUrl The URL of the backend API
 * @returns {Promise<Object>} The response from the backend API
 * @throws {Error} If the API call fails
 */
export const sendHealthProfileToBackend = async (apiUrl) => {
  try {
    // Check if nutrition mode is enabled before continuing
    if (!isNutritionModeEnabled()) {
      console.log('Nutrition mode is disabled, skipping health profile transmission');
      throw new Error('Nutrition mode is disabled');
    }
    
    console.log(`Sending health profile to backend: ${apiUrl}`);
    
    // Get formatted health profile data
    const profileData = await getFormattedHealthProfileForAPI();
    
    // Send data to backend API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Backend API response:', responseData);
    
    return responseData;
    
  } catch (error) {
    console.error('Error sending health profile to backend:', error);
    throw error;
  }
};

/**
 * Gets nutrition recommendations for the current user based on their health profile
 * @param {boolean} forceRefresh - Force a new API call even if cached data exists
 * @returns {Promise<Object>} Nutrition recommendations
 */
export const getNutritionRecommendations = async (forceRefresh = false) => {
  try {
    // Check if nutrition mode is enabled
    if (!isNutritionModeEnabled()) {
      console.log('Nutrition mode is disabled, skipping recommendations fetch');
      throw new Error('Nutrition mode is disabled');
    }
    
    console.log('Getting nutrition recommendations');
    
    // Check if we can use cached recommendations
    const now = Date.now();
    if (!forceRefresh && 
        nutritionRecommendationsCache && 
        (now - lastRecommendationsFetchTime) < CACHE_DURATION) {
      console.log('Using cached nutrition recommendations');
      return nutritionRecommendationsCache;
    }
    
    // Define the API URL
    const apiUrl = `${API_BASE_URL}/nutrition-profile`;
    
    console.log(`Fetching nutrition recommendations from: ${apiUrl}`);
    
    // Get recommendations from backend
    const response = await sendHealthProfileToBackend(apiUrl);
    
    if (!response || !response.success) {
      console.error('Failed to get nutrition recommendations:', response);
      throw new Error('Failed to get nutrition recommendations');
    }
    
    // Extract recommendations from response
    const { recommendations } = response;
    
    // Update cache
    nutritionRecommendationsCache = recommendations;
    lastRecommendationsFetchTime = now;
    
    console.log('Successfully retrieved nutrition recommendations:', recommendations);
    return recommendations;
    
  } catch (error) {
    console.error('Error getting nutrition recommendations:', error);
    throw error;
  }
};