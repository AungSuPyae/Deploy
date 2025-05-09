/**
 * Frontend API client for recipe search and retrieval
 * Supports both regular and nutrition-based recipe search
 */

// Import getNutritionRecommendations để lấy thông tin profile dinh dưỡng
import { getNutritionRecommendations } from './getUserHealthProfile';
// Import conflict detection utils from searchConflictDetector
import { detectSearchConflicts, generateConflictWarning, getSuggestedAlternatives } from '../utils/searchConflictDetector';

/**
 * Sends a search request to the backend API
 * @param {string} searchTerm - User's search query
 * @param {string} cuisine - Selected cuisine filter
 * @param {function} setResult - Callback function to set results
 * @param {boolean} nutritionMode - Whether nutrition mode is enabled
 */
export const sendSearchRequest = async (searchTerm, cuisine, setResult, nutritionMode = false) => {
  console.log("🚀 [Frontend] Sending enhanced search request...");
  console.log("🔍 Keyword:", searchTerm);
  console.log("🌍 Cuisine:", cuisine);
  console.log("📊 Nutrition Mode:", nutritionMode ? "Enabled" : "Disabled");

  try {
    // Chuẩn bị dữ liệu cơ bản
    const requestData = {
      searchTerm,
      cuisine,
      nutritionMode
    };

    // Xác định xung đột từ frontend để hiển thị cảnh báo nhanh hơn
    let frontendConflicts = null;
    let nutritionProfile = null;
    
    // Nếu chế độ dinh dưỡng được bật, thêm thông tin dinh dưỡng
    if (nutritionMode) {
      console.log("📊 [Frontend] Fetching nutrition profile for search");
      try {
        // Lấy khuyến nghị dinh dưỡng từ cache hoặc API
        nutritionProfile = await getNutritionRecommendations();
        requestData.nutritionProfile = nutritionProfile;
        console.log("✅ [Frontend] Added nutrition profile to search request");
        
        // Phát hiện xung đột từ frontend để hiển thị nhanh hơn
        if (searchTerm && nutritionProfile) {
          const userDiets = nutritionProfile.dietaryProfile?.restrictions || [];
          const userAllergies = nutritionProfile.dietaryProfile?.allergies || [];
          
          console.log("🔍 [Frontend] Checking for dietary conflicts from frontend");
          frontendConflicts = detectSearchConflicts(searchTerm, userDiets, userAllergies);
          
          if (frontendConflicts.hasConflicts) {
            console.log(`⚠️ [Frontend] Detected ${frontendConflicts.conflicts.length} dietary conflicts locally`);
          }
        }
      } catch (profileError) {
        console.error("⚠️ [Frontend] Unable to get nutrition profile:", profileError);
        // Vẫn tiếp tục tìm kiếm nhưng không có thông tin dinh dưỡng
        console.log("⚠️ [Frontend] Continuing search without nutrition profile");
      }
    }

    // Gửi request đến API
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/searchRecipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    // Xử lý kết quả
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    // Kết hợp thông tin xung đột từ backend với kết quả
    const resultObject = {
      recipes: Array.isArray(data) ? data : (data.recipes || [])
    };
    
    // Thêm thông tin fallback nếu có
    if (data.fallback && data.fallback.applied) {
      console.log(`⚠️ [Frontend] Search used fallback mode: ${data.fallback.message}`);
      resultObject.fallbackInfo = data.fallback;
    }
    
    // Ưu tiên sử dụng thông tin xung đột từ backend nếu có
    if (data.dietaryConflicts && data.dietaryConflicts.hasConflicts) {
      console.log(`⚠️ [Frontend] Using backend dietary conflict data`);
      resultObject.dietaryConflicts = {
        hasConflicts: true,
        conflicts: data.dietaryConflicts.conflicts,
        warningMessage: generateConflictWarning(data.dietaryConflicts.conflicts),
      };
    } 
    // Nếu không có từ backend, sử dụng dữ liệu được phát hiện từ frontend
    else if (frontendConflicts && frontendConflicts.hasConflicts) {
      console.log(`⚠️ [Frontend] Using frontend dietary conflict data`);
      resultObject.dietaryConflicts = {
        hasConflicts: true,
        conflicts: frontendConflicts.conflicts,
        warningMessage: generateConflictWarning(frontendConflicts.conflicts),
      };
    }
    
    console.log("✅ [Frontend] Received results:", resultObject.recipes.length);
    
    // Log chi tiết hơn nếu ở chế độ dinh dưỡng
    if (nutritionMode && resultObject.recipes.length > 0) {
      console.log("📊 [Frontend] Sample recipe with nutrition scores:", {
        title: resultObject.recipes[0].title,
        nutritionMatchPercentage: resultObject.recipes[0].nutritionMatchPercentage,
        overallMatchPercentage: resultObject.recipes[0].overallMatchPercentage
      });
    }
    
    // Hiển thị cảnh báo xung đột nếu có
    if (resultObject.dietaryConflicts?.hasConflicts) {
      console.log("⚠️ [Frontend] Warning message:", resultObject.dietaryConflicts.warningMessage);
    }
    
    // Chuyển kết quả cho callback
    setResult(resultObject);
  } catch (error) {
    console.error("❌ [Frontend] Error calling backend:", error);
    // Vẫn gọi callback nhưng với mảng rỗng để tránh UI bị treo
    setResult([]);
  }
};

/**
 * Fetches detailed recipe information by ID
 * @param {number|string|string[]} recipeId - ID of the recipe to fetch (can be number, string, or string array)
 * @returns {Promise<Object>} Recipe details object
 */
export const getRecipeDetails = async (recipeId) => {
  console.log("🚀 [Frontend] Fetching recipe details for ID:", recipeId);
  
  // Validate ID
  if (!recipeId) {
    console.error("❌ [Frontend] Missing recipe ID");
    throw new Error("Recipe ID is required");
  }
  
  try {
    // Handle array of IDs - take the first one
    const idToUse = Array.isArray(recipeId) ? recipeId[0] : recipeId;
    
    // Ensure recipeId is treated as string for the URL
    const recipeIdStr = String(idToUse);
    
    console.log(`🔍 [Frontend] Making API request for recipe ID: ${recipeIdStr}`);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recipe/${recipeIdStr}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ [Frontend] API error: ${res.status} - ${errorText}`);
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ [Frontend] Received recipe details from backend:", data.title);
    
    // Ensure the ID is consistently a number in the data
    if (data && typeof data.id === 'string') {
      data.id = parseInt(data.id, 10);
    }
    
    return data;
  } catch (error) {
    console.error("❌ [Frontend] Error fetching recipe details:", error);
    throw error; // Re-throw để xử lý trong component
  }
};