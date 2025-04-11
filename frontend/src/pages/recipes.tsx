import React, { useState, useEffect } from "react";
import Header from "./components/common/header";
import Footer from "./components/common/footer";
import Filter from "../pages/recipe/Filter";
import { sendSearchRequest } from "../api/getRecipe";
import { MagnifyingGlassIcon, ExclamationTriangleIcon, LightBulbIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import RecipeCard from "../pages/recipe/RecipeCard";
import ProtectedRoute from "../api/ProtectedRoute";
import ProfileRouteGuard from "./components/common/ProfileRouteGuard";
import { getUserHealthProfile, clearHealthProfileCache } from "../api/getUserHealthProfile"; // Import them clearHealthProfileCache
import SearchHistory from "./recipe/SearchHistory";
import SearchSuggestions from "./recipe/SearchSuggestions";
import { getSearchSuggestions } from "../api/suggestionService";
import { addSearchToHistory } from "../api/searchHistoryService";

// Cập nhật interface Recipe ở đầu file recipes.tsx
interface Recipe {
  id: number;
  title: string;
  image: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number; // Thêm dòng này
}

// Define interface for search conflict
interface SearchConflict {
  type: 'allergy' | 'diet';
  item: string;
  searchTerm: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

// Define interface for dietary conflict info
interface DietaryConflictInfo {
  hasConflicts: boolean;
  conflicts: SearchConflict[];
  warningMessage: string;
}

// Define interface for search state
interface SearchState {
  searchTerm: string;
  cuisine: string;
  results: Recipe[];
  currentPage: number;
  nutritionMode: boolean; // Add nutritionMode to search state
  dietaryConflicts?: DietaryConflictInfo;
}

// Define interface for user health profile
interface UserHealthProfile {
  userId: string;
  email: string;
  displayName: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  allergies?: string[];
  dietaryRestrictions?: string[];
  calculatedNutrition?: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
    caloriesPerMeal: number;
    proteinPerMeal: number;
    carbsPerMeal: number;
    fatPerMeal: number;
  };
  [key: string]: any; // Allow for additional properties
}

// Create a localStorage key constant for better maintainability
const NUTRITION_MODE_STORAGE_KEY = 'nutritionModeEnabled';

const RecipesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ cuisine: "" });
  const [results, setResults] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchRestored, setSearchRestored] = useState(false); // Track if search was restored
  const [nutritionMode, setNutritionMode] = useState(false); // State for nutrition mode toggle
  const [userHealthProfile, setUserHealthProfile] = useState<UserHealthProfile | null>(null); // Add health profile state
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // Add loading state for profile
  const [profileError, setProfileError] = useState<string | null>(null); // Add error state for profile
  const [showNutritionBanner, setShowNutritionBanner] = useState(false); // Control animation
  const [bannerExiting, setBannerExiting] = useState(false); // Control exit animation
  const [fallbackInfo, setFallbackInfo] = useState<{applied: boolean, message: string, type: string} | null>(null);
  const [dietaryConflicts, setDietaryConflicts] = useState<DietaryConflictInfo | null>(null);
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  
  const cardsPerPage = 12; // Show 12 cards per page
  
  // Load saved search state and nutrition mode when component mounts
  useEffect(() => {
    console.log("🔍 [UI] Checking for saved search state and nutrition mode");
    
    // First check for global nutrition mode setting
    const savedNutritionMode = localStorage.getItem(NUTRITION_MODE_STORAGE_KEY);
    if (savedNutritionMode) {
      try {
        const isEnabled = JSON.parse(savedNutritionMode);
        console.log("📊 [UI] Nutrition mode global setting:", isEnabled);
        setNutritionMode(isEnabled);
      } catch (error) {
        console.error("❌ [UI] Error parsing saved nutrition mode:", error);
        localStorage.removeItem(NUTRITION_MODE_STORAGE_KEY);
      }
    }
    

    const savedSearchState = localStorage.getItem('recipeSearchState');
    if (savedSearchState) {
      try {
        const parsedState = JSON.parse(savedSearchState);
        console.log("✅ [UI] Found saved search state:", parsedState);
        
        // Restore saved state
        setSearchTerm(parsedState.searchTerm || "");
        setFilters({ cuisine: parsedState.cuisine || "" });
        
        // Only set results if there are any
        if (parsedState.results && parsedState.results.length > 0) {
          setResults(parsedState.results);
          setCurrentPage(parsedState.currentPage || 1);
          setSearchRestored(true);
          console.log("✅ [UI] Successfully restored search results");
        }
      } catch (error) {
        console.error("❌ [UI] Error parsing saved search state:", error);
        localStorage.removeItem('recipeSearchState');
      }
    } else {
      console.log("ℹ️ [UI] No saved search state found");
    }
  }, []);

      // Xử lý hiển thị lịch sử khi focus vào ô tìm kiếm
      const handleSearchFocus = () => {
        setShowSearchHistory(true);
        setShowSuggestions(false);
      };
      
      // Xử lý khi blur khỏi ô tìm kiếm
      const handleSearchBlur = () => {
        // Để delay cho phép click vào lịch sử tìm kiếm trước khi ẩn
        setTimeout(() => {
          setShowSearchHistory(false);
          setShowSuggestions(false);
        }, 200);
      };
  
  // Effect to handle animations when results change
  useEffect(() => {
    if (isSearching) {
      console.log("🔄 [UI] Search completed with", results.length, "results");
      setIsLoading(false);
      // Reset to page 1 when new search results come in
      setCurrentPage(1);
    }
  }, [results, isSearching]);

  // Save search state whenever it changes
  useEffect(() => {
    // Only save if we have actual search results to prevent overwriting with empty state
    if (results.length > 0) {
      const searchState: SearchState = {
        searchTerm,
        cuisine: filters.cuisine,
        results,
        currentPage,
        nutritionMode // Include nutrition mode in saved state
      };
      
      console.log("💾 [UI] Saving search state to localStorage");
      localStorage.setItem('recipeSearchState', JSON.stringify(searchState));
    }
  }, [searchTerm, filters.cuisine, results, currentPage, nutritionMode]);

  // Biến để theo dõi đã gửi dữ liệu đến backend hay chưa
  const [hasInitializedNutrition, setHasInitializedNutrition] = useState(false);

  // Effect to handle nutrition mode changes
  useEffect(() => {
    // Store nutrition mode preference in localStorage
    localStorage.setItem(NUTRITION_MODE_STORAGE_KEY, JSON.stringify(nutritionMode));
    console.log("💾 [UI] Nutrition mode preference saved globally:", nutritionMode);
    
    // Only fetch health profile if nutrition mode is enabled
    if (nutritionMode) {
      fetchUserHealthProfile();
      // Reset flag when nutrition mode is turned off then on again
      setHasInitializedNutrition(false);
    } else {
      // Start exit animation
      if (userHealthProfile) {
        setBannerExiting(true);
        
        // After animation completes, clear data
        const timer = setTimeout(() => {
          setUserHealthProfile(null);
          setShowNutritionBanner(false);
          setBannerExiting(false);
          // Xóa cache và dữ liệu khi tắt chế độ nutrition mode
          clearHealthProfileCache();
          console.log("🧹 [UI] Health profile data and cache cleared due to nutrition mode disabled");
        }, 500); // Match this to the CSS transition duration
        
        return () => clearTimeout(timer);
      }
    }
  }, [nutritionMode]);

  // Effect to handle animation for nutrition banner
  useEffect(() => {
    if (nutritionMode && userHealthProfile && !isLoadingProfile && !profileError) {
      // Delay showing the banner for animation effect
      const timer = setTimeout(() => {
        setShowNutritionBanner(true);
        setBannerExiting(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [nutritionMode, userHealthProfile, isLoadingProfile, profileError]);

  // Function to fetch user health profile
  const fetchUserHealthProfile = async () => {
    console.log("🔄 [UI] Fetching user health profile for nutrition mode");
    setIsLoadingProfile(true);
    setProfileError(null);
    setShowNutritionBanner(false);
    
    try {
      // Luôn lấy dữ liệu mới từ Firestore bằng cách truyền tham số bypassCache=true
      const profile = await getUserHealthProfile(true);
      setUserHealthProfile(profile);
      console.log("✅ [UI] Successfully loaded user health profile:", profile);
      
      // Chỉ gửi dữ liệu đến backend một lần sau khi bật Nutrition Mode
      if (!hasInitializedNutrition) {
        console.log("🔄 [UI] Initializing nutrition data with backend - first time only");
        
        try {
          // Import hàm getNutritionRecommendations từ getUserHealthProfile.js
          const { getNutritionRecommendations } = await import("../api/getUserHealthProfile");
          
          // Truyền tham số forceRefresh=true để luôn lấy dữ liệu mới
          await getNutritionRecommendations(true);
          console.log("✅ [UI] Successfully initialized nutrition data with backend");
          
          // Đánh dấu đã khởi tạo thành công để không gửi lại
          setHasInitializedNutrition(true);
        } catch (err) {
          console.log("⚠️ [UI] Non-critical error initializing nutrition data:", err);
          // Không hiển thị lỗi này cho người dùng vì không ảnh hưởng đến UI chính
        }
      } else {
        console.log("ℹ️ [UI] Skipping backend communication - already initialized");
      }
    } catch (error) {
      console.error("❌ [UI] Error loading user health profile:", error);
      setProfileError("Failed to load health profile. Nutrition recommendations may be limited.");
      // Keep nutrition mode on but show error
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Cập nhật xử lý khi nhập tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log("📝 [UI] User typing search keyword:", value);
    
    // Tìm kiếm gợi ý
    if (value.trim().length >= 2) {
      const suggestions = getSearchSuggestions(value);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setShowSearchHistory(false);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

    // Xử lý khi chọn từ lịch sử tìm kiếm
    const handleSelectHistory = (term: string, filters: any) => {
      setSearchTerm(term);
      if (filters.cuisine) {
        setFilters({ cuisine: filters.cuisine });
      }
      console.log(`🕒 [UI] Selected search from history: "${term}" with filters:`, filters);
      
      // Ẩn lịch sử và thực hiện tìm kiếm
      setShowSearchHistory(false);
      setTimeout(() => {
        performSearch();
      }, 100);
    };
    
    // Xử lý khi chọn từ gợi ý
    const handleSelectSuggestion = (suggestion: string) => {
      setSearchTerm(suggestion);
      console.log(`💡 [UI] Selected suggestion: "${suggestion}"`);
      
      // Ẩn gợi ý và thực hiện tìm kiếm
      setShowSuggestions(false);
      setTimeout(() => {
        performSearch();
      }, 100);
    };

  const handleFilterChange = (updatedFilters: any) => {
    setFilters(updatedFilters);
    console.log("🧩 [UI] Filters updated:", updatedFilters);
  };

  const toggleNutritionMode = () => {
    const newMode = !nutritionMode;
    setNutritionMode(newMode);
    console.log("📊 [UI] Nutrition mode toggled:", newMode);
    
    // Nếu bật chế độ dinh dưỡng, xóa cache trước để đảm bảo lấy dữ liệu mới
    if (newMode) {
      console.log("🔄 [UI] Clearing health profile cache before fetching fresh data");
      clearHealthProfileCache();
    }
    
    // The health profile fetching will be handled by the useEffect
  };

  // Cập nhật hàm performSearch để lưu lịch sử tìm kiếm
  const performSearch = () => {
    if (!searchTerm.trim() && !filters.cuisine) {
      console.log("⚠️ [UI] Search cancelled: No search criteria provided");
      return;
    }
    
    console.log("🔎 [UI] Performing search with keyword:", searchTerm, "and filter:", filters);
    console.log("📊 [UI] Nutrition mode active:", nutritionMode);
    
    // Lưu vào lịch sử tìm kiếm (chỉ lưu khi có từ khóa)
    if (searchTerm.trim()) {
      addSearchToHistory(searchTerm, filters);
    }
    
    // Reset fallback và dietary conflict info
    setFallbackInfo(null);
    setDietaryConflicts(null);
    
    // Set loading state and trigger fade-out effect
    setIsLoading(true);
    setIsSearching(true);
    
    // Clear previous results for better animation effect
    setResults([]);
    
    // Small delay to show loading effect
    setTimeout(() => {
      sendSearchRequest(searchTerm, filters.cuisine, (result) => {
        // Kiểm tra cấu trúc kết quả trả về
        if (Array.isArray(result)) {
          // Trường hợp kết quả là mảng recipes đơn giản
          console.log(`✅ [UI] Search complete. Found ${result.length} recipes.`);
          setResults(result);
        } else {
          // Trường hợp kết quả là object phức tạp với recipes và thông tin bổ sung
          console.log(`✅ [UI] Search complete. Found ${result.recipes.length} recipes.`);
          setResults(result.recipes);
          
          // Xử lý thông tin fallback nếu có
          if (result.fallbackInfo) {
            setFallbackInfo(result.fallbackInfo);
            console.log(`ℹ️ [UI] Search used fallback: ${result.fallbackInfo.message}`);
          }
          
          // Xử lý thông tin xung đột chế độ ăn kiêng/dị ứng nếu có
          if (result.dietaryConflicts && result.dietaryConflicts.hasConflicts) {
            setDietaryConflicts(result.dietaryConflicts);
            console.log(`⚠️ [UI] Search has dietary conflicts:`, result.dietaryConflicts.warningMessage);
          }
        }
        
        // Mark that this is a new search, not a restored one
        setSearchRestored(false);
      }, nutritionMode);
    }, 500);
  };

  // Thêm hàm xử lý khi người dùng chọn tìm kiếm lựa chọn thay thế
  const handleAlternativeSearch = (suggestion: string) => {
    console.log(`🔄 [UI] Using alternative search suggestion: ${suggestion}`);
    setSearchTerm(suggestion);
    
    // Delay một chút để người dùng thấy thay đổi trong ô tìm kiếm
    setTimeout(() => {
      performSearch();
    }, 100);
  };

  const handleSearchClick = () => {
    performSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log("⌨️ [UI] Enter key pressed for search");
      performSearch();
    }
  };
  
  // Get current page recipes
  const indexOfLastRecipe = currentPage * cardsPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - cardsPerPage;
  const currentRecipes = results.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(results.length / cardsPerPage);
  
  // Function to change page
  const paginate = (pageNumber: number) => {
    console.log("📄 [UI] Changed to page:", pageNumber);
    setCurrentPage(pageNumber);
    // Scroll to top of results
    window.scrollTo({
      top: (document.querySelector('.results-container') as HTMLElement)?.offsetTop || 0,
      behavior: 'smooth'
    });
  };

  // Function to clear previous search
  const clearPreviousSearch = () => {
    console.log("🧹 [UI] Clearing previous search");
    localStorage.removeItem('recipeSearchState');
    setSearchTerm("");
    setFilters({ cuisine: "" });
    setResults([]);
    setCurrentPage(1);
    setSearchRestored(false);
  };

  // Component for displaying dietary conflicts alert - without alternatives
  const DietaryConflictsAlert = () => {
    if (!dietaryConflicts || !dietaryConflicts.hasConflicts) return null;
    
    return (
      <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg shadow-sm mx-2 sm:mx-4 md:max-w-3xl md:mx-auto overflow-hidden transition-all duration-300 ease-in-out animate-fadeIn">
        <div className="p-4">
          {/* Header with warning icon */}
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mr-2" />
            <h3 className="text-amber-800 font-medium">Dietary Conflict Detected</h3>
          </div>
          
          {/* Warning message */}
          <p className="text-amber-800 text-sm mb-3">
            {dietaryConflicts.warningMessage}
          </p>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <ProfileRouteGuard>
        <>
          <Header />
          <main className="w-full mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-[#4b7e53]">Find Your Recipe</h1>

            {/* Search bar container with nutrition mode toggle */}
            <div className="mb-6 md:mb-8 px-2 sm:px-4 md:max-w-2xl md:mx-auto">
              {/* Search bar row with toggle */}
              <div className="flex items-center justify-between gap-2">
                {/* Search input with icon */}
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder="Search for recipes..."
                    className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4b7e53]"
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4b7e53] hover:text-green-800"
                    onClick={handleSearchClick}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Search History Dropdown */}
                  <SearchHistory 
                    onSelectHistory={handleSelectHistory}
                    isVisible={showSearchHistory}
                  />
                  
                  {/* Search Suggestions Dropdown */}
                  <SearchSuggestions
                    suggestions={searchSuggestions}
                    searchTerm={searchTerm}
                    onSelectSuggestion={handleSelectSuggestion}
                    isVisible={showSuggestions}
                  />
                </div>
                
                {/* Nutrition Mode Toggle Button with label and animation */}
                <div className="flex items-center shrink-0">
                  <span className="text-sm mr-2 text-gray-600 hidden sm:inline">Nutrition Mode</span>
                  <button
                    onClick={toggleNutritionMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4b7e53] focus:ring-offset-2 ${
                      nutritionMode ? 'bg-[#4b7e53]' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle Nutrition Mode"
                  >
                    <span className="sr-only">Toggle Nutrition Mode</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        nutritionMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Mobile text label for nutrition mode (only shows on small screens) */}
              <div className="flex sm:hidden justify-end mt-1">
                <span className="text-xs text-gray-600">Nutrition Mode</span>
              </div>
            </div>

            {/* Search restored notification */}
            {searchRestored && results.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded mx-2 sm:mx-4 md:max-w-3xl md:mx-auto text-sm flex justify-between items-center">
                <span>Showing your previous search results.</span>
                <button 
                  onClick={clearPreviousSearch}
                  className="text-blue-600 hover:text-blue-800 underline text-xs font-medium"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Nutrition Mode loading state */}
            {nutritionMode && isLoadingProfile && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded mx-2 sm:mx-4 md:max-w-3xl md:mx-auto text-sm flex items-center animate-pulse">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-700 mr-2"></div>
                <span>Loading your nutrition profile...</span>
              </div>
            )}
            
            {/* Nutrition Mode error state */}
            {nutritionMode && profileError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded mx-2 sm:mx-4 md:max-w-3xl md:mx-auto text-sm">
                <span>{profileError}</span>
              </div>
            )}

            {/* Enhanced Nutrition Mode active indicator with entrance/exit animations */}
            {(nutritionMode || bannerExiting) && userHealthProfile && !isLoadingProfile && !profileError && (
              <div 
                className={`mb-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg shadow-sm mx-2 sm:mx-4 md:max-w-3xl md:mx-auto overflow-hidden transition-all duration-500 ease-in-out ${
                  showNutritionBanner && !bannerExiting 
                    ? 'opacity-100 max-h-96 transform translate-y-0' 
                    : bannerExiting
                      ? 'opacity-0 max-h-96 transform translate-y-4' 
                      : 'opacity-0 max-h-0 transform -translate-y-4'
                }`}
              >
                <div className="p-4">
                  {/* Header with icon */}
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-green-800 font-medium">Nutrition Mode Active</h3>
                  </div>
                  
                  {/* Description */}
                  <p className="text-green-800 text-sm mb-3">
                    Recipes will be tailored to your health profile. Here are your nutritional information per meal:
                  </p>
                  
                  {/* Nutrition Stats Cards */}
                  {userHealthProfile.calculatedNutrition && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-2">
                      {/* Calories Per Meal Card */}
                      <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm transition-all hover:shadow-md hover:scale-105">
                        <div className="text-xs text-green-700 font-medium mb-1">Calories</div>
                        <div className="text-lg font-bold text-gray-800">
                          {Math.round(userHealthProfile.calculatedNutrition.caloriesPerMeal || 0)}
                          <span className="text-xs font-normal text-gray-500 ml-1">kcal</span>
                        </div>
                      </div>
                      
                      {/* Protein Per Meal Card */}
                      <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm transition-all hover:shadow-md hover:scale-105">
                        <div className="text-xs text-green-700 font-medium mb-1">Protein</div>
                        <div className="text-lg font-bold text-gray-800">
                          {Math.round(userHealthProfile.calculatedNutrition.proteinPerMeal || 0)}
                          <span className="text-xs font-normal text-gray-500 ml-1">g</span>
                        </div>
                      </div>
                      
                      {/* Carbs Per Meal Card */}
                      <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm transition-all hover:shadow-md hover:scale-105">
                        <div className="text-xs text-green-700 font-medium mb-1">Carbs</div>
                        <div className="text-lg font-bold text-gray-800">
                          {Math.round(userHealthProfile.calculatedNutrition.carbsPerMeal || 0)}
                          <span className="text-xs font-normal text-gray-500 ml-1">g</span>
                        </div>
                      </div>
                      
                      {/* Fat Per Meal Card */}
                      <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm transition-all hover:shadow-md hover:scale-105">
                        <div className="text-xs text-green-700 font-medium mb-1">Fat</div>
                        <div className="text-lg font-bold text-gray-800">
                          {Math.round(userHealthProfile.calculatedNutrition.fatPerMeal || 0)}
                          <span className="text-xs font-normal text-gray-500 ml-1">g</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Conflicts Alert */}
            <DietaryConflictsAlert />

            {/* Thêm component thông báo fallback - đặt code này sau đoạn Nutrition Mode active indicator */}
            {fallbackInfo && fallbackInfo.applied && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded mx-2 sm:mx-4 md:max-w-3xl md:mx-auto text-sm flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{fallbackInfo.message}</span>
              </div>
            )}

            {/* Responsive layout that adapts to all screen sizes */}
            <div className="flex flex-col md:flex-row">
              {/* Filter sidebar - full width on mobile, fixed width on larger screens */}
              <div className="w-full md:w-64 shrink-0 mb-6 md:mb-0">
                <Filter 
                  onChange={handleFilterChange} 
                  initialCuisine={filters.cuisine} // Pass the initial cuisine value
                />
              </div>

              {/* Results area taking all available space */}
              <div className="w-full min-h-[400px] results-container px-2 sm:px-4 md:px-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b7e53]"></div>
                  </div>
                ) : results.length > 0 ? (
                  <>
                    <div className="text-sm text-gray-500 mb-4">
                      {results.length} {results.length === 1 ? 'recipe' : 'recipes'} found
                      {filters.cuisine && ` for "${filters.cuisine}" cuisine`}
                      {searchTerm && ` matching "${searchTerm}"`}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                    {currentRecipes.map((recipe, idx) => (
                      <RecipeCard 
                        key={`${recipe.id || idx}`}
                        id={recipe.id}
                        image={recipe.image}
                        title={recipe.title}
                        calories={recipe.calories}
                        protein={recipe.protein}
                        fat={recipe.fat}
                        carbs={recipe.carbs} // Thêm dòng này
                      />
                    ))}
                    </div>
                    
                    {/* Pagination */}
                    {results.length > cardsPerPage && (
                      <div className="flex justify-center mt-8">
                        <nav className="flex items-center">
                          <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-l-md ${
                              currentPage === 1 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#4b7e53] text-white hover:bg-green-700'
                            } transition`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => paginate(i + 1)}
                              className={`px-4 py-2 ${
                                currentPage === i + 1
                                  ? 'bg-[#4b7e53] text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              } transition`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-r-md ${
                              currentPage === totalPages 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#4b7e53] text-white hover:bg-green-700'
                            } transition`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 italic mt-8 text-center">
                    {isSearching
                      ? "No recipes found. Try a different keyword or cuisine."
                      : "Search results will appear here based on keyword & filters..."}
                  </div>
                )}
              </div>
            </div>
          </main>
          <Footer />
        </>
      </ProfileRouteGuard>
    </ProtectedRoute>
  );
};

export default RecipesPage;