import { create } from 'zustand';
import { translations } from '../translations';

export interface Farm {
  id: string;
  name: string;
  size: number;
  soilType: 'clay' | 'loam' | 'sandy' | 'silt';
  currentCrops: string[];
  location: string;
  farmerId: string;
}

export interface SoilHealth {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  pH: number;
  organicMatter: number;
  lastUpdated: Date;
}

export interface WeatherData {
  day: string;
  condition: 'Sunny' | 'Rainy' | 'Cloudy' | 'Partly Cloudy';
  temperature: number;
  humidity: number;
  icon: string;
}

export interface CropRecommendation {
  id: string;
  type: 'rotation' | 'intercropping' | 'companion';
  currentCrop: string;
  recommendedCrop: string;
  reason: string;
  nextPlanting: string;
  urgency: 'low' | 'medium' | 'high';
  benefits: string[];
}

export interface CropInfo {
  name: string;
  imageUrl: string;
  category: string;
  description: string;
}

export interface CropRule {
  id: string;
  currentCrop: string;
  recommendedCrop: string;
  reason: string;
  condition: string;
  active: boolean;
}

export interface CompanionPlant {
  family: string;
  crops: string[];
  goodNeighbors: string[];
  badNeighbors: string[];
  benefits: string[];
  risks: string[];
}

export interface CropNeighborRecommendation {
  inputCrop: string;
  recommendedNeighbors: string[];
  avoidNeighbors: string[];
  benefits: string[];
  familyInfo: string;
}

export interface Farmer {
  id: string;
  name: string;
  farms: string[];
  phone: string;
  language: 'en' | 'hi' | 'ta';
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'farmer' | 'admin';
  name: string;
  farmIds?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  loginError: string | null;
}

interface CropStore {
  // Data
  farms: Farm[];
  farmers: Farmer[];
  soilData: Record<string, SoilHealth>;
  weatherData: WeatherData[];
  recommendations: CropRecommendation[];
  cropRules: CropRule[];
  selectedFarm: string | null;
  companionPlants: CompanionPlant[];
  cropDatabase: CropInfo[];
  
  // Authentication
  auth: AuthState;
  users: User[];
  
  // Language
  language: 'en' | 'fil';
  translations: Record<string, Record<string, string>>;

  // Actions
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setSelectedFarm: (farmId: string) => void;
  generateRecommendations: (farmId: string) => void;
  updateCropRule: (rule: CropRule) => void;
  addCropRule: (rule: Omit<CropRule, 'id'>) => void;
  deleteCropRule: (ruleId: string) => void;
  updateSoilData: (farmId: string) => void;
  generateWeatherData: () => void;
  getCropNeighborRecommendations: (cropName: string) => CropNeighborRecommendation | null;
  getCropInfo: (cropName: string) => CropInfo | null;
  setLanguage: (language: 'en' | 'fil') => void;
  t: (key: string) => string;
}

// Dummy data generators
const generateSoilData = (): SoilHealth => ({
  nitrogen: Math.floor(Math.random() * 100),
  phosphorus: Math.floor(Math.random() * 50),
  potassium: Math.floor(Math.random() * 50),
  pH: Number((Math.random() * 4 + 4).toFixed(1)),
  organicMatter: Number((Math.random() * 5 + 1).toFixed(1)),
  lastUpdated: new Date(),
});

const generateWeatherData = (): WeatherData[] => {
  const conditions: WeatherData['condition'][] = ['Sunny', 'Rainy', 'Cloudy', 'Partly Cloudy'];
  const icons = ['☀️', '🌧️', '☁️', '⛅'];
  const days = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'];
  
  return days.map((day, index) => {
    const conditionIndex = Math.floor(Math.random() * conditions.length);
    return {
      day,
      condition: conditions[conditionIndex],
      temperature: Math.floor(Math.random() * 15 + 20),
      humidity: Math.floor(Math.random() * 40 + 40),
      icon: icons[conditionIndex],
    };
  });
};

const initialFarms: Farm[] = [
  {
    id: 'farm-1',
    name: 'Kalinawan Farm',
    size: 2.5,
    soilType: 'clay',
    currentCrops: ['Rice', 'Corn'],
    location: 'Cagayan de Oro City, Misamis Oriental',
    farmerId: 'farmer-1',
  },
  {
    id: 'farm-2',
    name: 'Malasag Organic Farm',
    size: 1.8,
    soilType: 'loam',
    currentCrops: ['Tomatoes', 'Sweet Corn'],
    location: 'Malaybalay City, Bukidnon',
    farmerId: 'farmer-1',
  },
  {
    id: 'farm-3',
    name: 'Golden Harvest Farm',
    size: 4.2,
    soilType: 'sandy',
    currentCrops: ['Sugarcane', 'Beans'],
    location: 'Valencia City, Bukidnon',
    farmerId: 'farmer-2',
  },
];

const initialFarmers: Farmer[] = [
  {
    id: 'farmer-1',
    name: 'Juan Carlos Santos',
    farms: ['farm-1', 'farm-2'],
    phone: '+63 917 123 4567',
    language: 'en',
  },
  {
    id: 'farmer-2',
    name: 'Maria Luz Villanueva',
    farms: ['farm-3'],
    phone: '+63 928 765 4321',
    language: 'en',
  },
];

const initialUsers: User[] = [
  {
    id: 'user-1',
    username: 'juan.farmer',
    password: 'farmer123',
    role: 'farmer',
    name: 'Juan Carlos Santos',
    farmIds: ['farm-1', 'farm-2'],
  },
  {
    id: 'user-2',
    username: 'maria.farmer',
    password: 'farmer456',
    role: 'farmer',
    name: 'Maria Luz Villanueva',
    farmIds: ['farm-3'],
  },
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Dr. Ricardo Aguilar',
  },
];

const initialCropRules: CropRule[] = [
  {
    id: 'rule-1',
    currentCrop: 'Rice',
    recommendedCrop: 'Beans',
    reason: 'Nitrogen fixation',
    condition: 'nitrogen < 30',
    active: true,
  },
  {
    id: 'rule-2',
    currentCrop: 'Tomatoes',
    recommendedCrop: 'Spinach',
    reason: 'Pest cycle break',
    condition: 'always',
    active: true,
  },
  {
    id: 'rule-3',
    currentCrop: 'Corn',
    recommendedCrop: 'Beans',
    reason: 'Companion planting',
    condition: 'always',
    active: true,
  },
  {
    id: 'rule-4',
    currentCrop: 'Cotton',
    recommendedCrop: 'Mustard',
    reason: 'Soil health improvement',
    condition: 'pH > 7',
    active: true,
  },
];

// Companion planting knowledge based on Philippine Allotment Garden Manual
const companionPlantsData: CompanionPlant[] = [
  {
    family: 'Alliaceae',
    crops: ['onion', 'garlic', 'leek', 'chives', 'shallot'],
    goodNeighbors: ['tomato', 'eggplant', 'pepper', 'cabbage', 'pak choy', 'broccoli', 'cucumber', 'squash', 'lettuce', 'dill', 'parsley'],
    badNeighbors: ['beans', 'peas', 'lentils', 'chickpeas'],
    benefits: ['Pest control through biochemical repellents', 'Disease suppression', 'Aromatic protection'],
    risks: ['May inhibit legume nitrogen fixation', 'Can stunt bean growth']
  },
  {
    family: 'Asteraceae',
    crops: ['lettuce', 'sunflower', 'calendula', 'marigold'],
    goodNeighbors: ['beans', 'peas', 'cucumber', 'squash', 'onion', 'garlic', 'sweet corn', 'tomato', 'eggplant', 'basil'],
    badNeighbors: [],
    benefits: ['Attracts beneficial insects', 'Provides ground cover', 'Natural pest deterrent'],
    risks: []
  },
  {
    family: 'Crucifers/Brassicas',
    crops: ['pak choy', 'cabbage', 'broccoli', 'cauliflower', 'mustard', 'radish', 'turnip'],
    goodNeighbors: ['tomato', 'eggplant', 'pepper', 'onion', 'garlic', 'thyme', 'mint', 'rosemary', 'coriander'],
    badNeighbors: ['tomato', 'eggplant', 'pepper', 'lettuce', 'sunflower'],
    benefits: ['Natural pest control', 'Soil structure improvement', 'Quick growing ground cover'],
    risks: ['Disease spread potential', 'Nutrient competition with some crops']
  },
  {
    family: 'Cucurbits',
    crops: ['bitter gourd', 'cucumber', 'bottle gourd', 'squash', 'pumpkin', 'zucchini', 'watermelon', 'melon'],
    goodNeighbors: ['onion', 'garlic', 'beans', 'peas', 'carrot', 'celery', 'dill', 'lemon balm'],
    badNeighbors: ['tomato', 'eggplant', 'pepper'],
    benefits: ['Nitrogen fixation from legume companions', 'Natural pest control', 'Efficient space utilization'],
    risks: ['Disease susceptibility with solanaceae', 'Competition for nutrients']
  },
  {
    family: 'Fabaceae/Legumes',
    crops: ['beans', 'peas', 'lentils', 'chickpeas', 'cowpeas', 'mung beans'],
    goodNeighbors: ['cucumber', 'squash', 'lettuce', 'sweet corn', 'rosemary', 'coriander'],
    badNeighbors: ['tomato', 'eggplant', 'pepper', 'onion', 'garlic'],
    benefits: ['Nitrogen fixation', 'Soil improvement', 'Natural pest control'],
    risks: ['Reduced nitrogen fixation near alliums', 'Disease spread potential']
  },
  {
    family: 'Poaceae',
    crops: ['sweet corn', 'rice', 'wheat', 'barley'],
    goodNeighbors: ['beans', 'peas', 'cucumber', 'squash', 'lettuce', 'dill', 'amaranth'],
    badNeighbors: ['tomato', 'eggplant', 'pepper', 'carrot', 'celery'],
    benefits: ['Structural support for climbing plants', 'Wind protection', 'Efficient space use'],
    risks: ['Heavy nutrient competition', 'Shading of smaller plants']
  },
  {
    family: 'Solanaceae',
    crops: ['tomato', 'eggplant', 'pepper', 'potato', 'chili'],
    goodNeighbors: ['onion', 'garlic', 'beans', 'peas', 'cabbage', 'pak choy', 'basil', 'mint', 'oregano', 'lemon balm'],
    badNeighbors: ['cabbage', 'pak choy', 'beans', 'peas', 'sweet corn', 'dill'],
    benefits: ['Mutual pest protection with herbs', 'Enhanced flavor development', 'Disease resistance'],
    risks: ['Disease spread within family', 'Nutrient competition', 'Pest attraction']
  },
  {
    family: 'Apiaceae',
    crops: ['carrot', 'celery', 'parsley', 'cilantro', 'fennel'],
    goodNeighbors: ['onion', 'garlic', 'cabbage', 'pak choy', 'cucumber', 'squash'],
    badNeighbors: ['sweet corn'],
    benefits: ['Attracts beneficial insects', 'Deep soil penetration', 'Natural pest deterrent'],
    risks: ['May compete with grasses for nutrients']
  }
];

// Comprehensive crop database with images
const cropDatabase: CropInfo[] = [
  { name: 'Rice', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop', category: 'Grain', description: 'Staple grain crop requiring flooded fields' },
  { name: 'Wheat', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=200&fit=crop', category: 'Grain', description: 'Major cereal grain for bread and flour' },
  { name: 'Corn', imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=200&fit=crop', category: 'Grain', description: 'Versatile crop for food and animal feed' },
  { name: 'Tomatoes', imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0d75?w=300&h=200&fit=crop', category: 'Vegetable', description: 'Popular fruit vegetable rich in vitamins' },
  { name: 'Cotton', imageUrl: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=300&h=200&fit=crop', category: 'Fiber', description: 'Cash crop for textile production' },
  { name: 'Sugarcane', imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop', category: 'Sugar', description: 'Tropical crop for sugar production' },
  { name: 'Beans', imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&h=200&fit=crop', category: 'Legume', description: 'Nitrogen-fixing protein-rich crop' },
  { name: 'Onions', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop', category: 'Vegetable', description: 'Aromatic bulb vegetable' },
  { name: 'Garlic', imageUrl: 'https://images.unsplash.com/photo-1471282809213-2bb3d5d8a6b7?w=300&h=200&fit=crop', category: 'Vegetable', description: 'Medicinal and culinary bulb crop' },
  { name: 'Lettuce', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop', category: 'Leafy Green', description: 'Cool-season salad crop' },
  { name: 'Carrots', imageUrl: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=300&h=200&fit=crop', category: 'Root Vegetable', description: 'Orange root vegetable rich in beta-carotene' },
  { name: 'Celery', imageUrl: 'https://images.unsplash.com/photo-1551501058-8de3e6264ab4?w=300&h=200&fit=crop', category: 'Vegetable', description: 'Crunchy stem vegetable' },
  { name: 'Pak Choy', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=200&fit=crop', category: 'Leafy Green', description: 'Asian leafy green vegetable' },
  { name: 'Cabbage', imageUrl: 'https://images.unsplash.com/photo-1594282486753-0e3271b60905?w=300&h=200&fit=crop', category: 'Crucifer', description: 'Dense-headed brassica vegetable' },
  { name: 'Cucumber', imageUrl: 'https://images.unsplash.com/photo-1519609792080-5f2b35e0f6b2?w=300&h=200&fit=crop', category: 'Cucurbit', description: 'Refreshing climbing vegetable' },
  { name: 'Squash', imageUrl: 'https://images.unsplash.com/photo-1570586354348-0dc8bd3b1b78?w=300&h=200&fit=crop', category: 'Cucurbit', description: 'Versatile winter storage vegetable' },
  { name: 'Eggplant', imageUrl: 'https://images.unsplash.com/photo-1615927783095-c2503648b1c0?w=300&h=200&fit=crop', category: 'Nightshade', description: 'Purple fruit vegetable' },
  { name: 'Peppers', imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&h=200&fit=crop', category: 'Nightshade', description: 'Spicy or sweet capsicum varieties' },
  { name: 'Sweet Corn', imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=200&fit=crop', category: 'Grain', description: 'Sweet variety of maize for direct consumption' }
];

export const useCropStore = create<CropStore>((set, get) => ({
  // Initial state
  farms: initialFarms,
  farmers: initialFarmers,
  users: initialUsers,
  auth: {
    isAuthenticated: false,
    currentUser: null,
    loginError: null,
  },
  soilData: Object.fromEntries(
    initialFarms.map(farm => [farm.id, generateSoilData()])
  ),
  weatherData: generateWeatherData(),
  recommendations: [],
  cropRules: initialCropRules,
  companionPlants: companionPlantsData,
  cropDatabase: cropDatabase,
  selectedFarm: null,
  language: 'en' as 'en' | 'fil',
  translations,

  // Actions
  login: (username, password) => {
    const user = get().users.find(u => u.username === username && u.password === password);
    if (user) {
      set(state => ({
        auth: {
          isAuthenticated: true,
          currentUser: user,
          loginError: null,
        },
        selectedFarm: user.role === 'farmer' && user.farmIds ? user.farmIds[0] : null,
      }));
      return true;
    } else {
      set(state => ({
        auth: {
          ...state.auth,
          loginError: 'Invalid username or password',
        }
      }));
      return false;
    }
  },

  logout: () => {
    set(state => ({
      auth: {
        isAuthenticated: false,
        currentUser: null,
        loginError: null,
      },
      selectedFarm: null,
    }));
  },
  
  setSelectedFarm: (farmId) => set({ selectedFarm: farmId }),

  generateRecommendations: (farmId) => {
    const { farms, soilData, cropRules } = get();
    const farm = farms.find(f => f.id === farmId);
    const soil = soilData[farmId];
    
    if (!farm || !soil) return;

    const recommendations: CropRecommendation[] = [];
    
    farm.currentCrops.forEach(currentCrop => {
      const applicableRules = cropRules.filter(rule => 
        rule.active && rule.currentCrop === currentCrop
      );

      applicableRules.forEach(rule => {
        // Simple condition evaluation
        let shouldRecommend = false;
        if (rule.condition === 'always') {
          shouldRecommend = true;
        } else if (rule.condition.includes('nitrogen < 30')) {
          shouldRecommend = soil.nitrogen < 30;
        } else if (rule.condition.includes('pH > 7')) {
          shouldRecommend = soil.pH > 7;
        }

        if (shouldRecommend) {
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random()}`,
            type: rule.reason.includes('companion') ? 'companion' : 
                  rule.reason.includes('fixation') ? 'rotation' : 'intercropping',
            currentCrop,
            recommendedCrop: rule.recommendedCrop,
            reason: rule.reason,
            nextPlanting: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
              .toLocaleDateString(),
            urgency: soil.nitrogen < 20 ? 'high' : soil.nitrogen < 40 ? 'medium' : 'low',
            benefits: [
              'Improves soil health',
              'Increases yield',
              'Reduces pest damage',
              'Enhances biodiversity'
            ].slice(0, Math.floor(Math.random() * 3) + 2),
          });
        }
      });
    });

    set({ recommendations });
  },

  updateCropRule: (rule) => {
    set(state => ({
      cropRules: state.cropRules.map(r => r.id === rule.id ? rule : r)
    }));
  },

  addCropRule: (rule) => {
    set(state => ({
      cropRules: [...state.cropRules, { ...rule, id: `rule-${Date.now()}` }]
    }));
  },

  deleteCropRule: (ruleId) => {
    set(state => ({
      cropRules: state.cropRules.filter(r => r.id !== ruleId)
    }));
  },

  updateSoilData: (farmId) => {
    set(state => ({
      soilData: {
        ...state.soilData,
        [farmId]: generateSoilData()
      }
    }));
  },

  generateWeatherData: () => {
    set({ weatherData: generateWeatherData() });
  },

  getCropNeighborRecommendations: (cropName: string): CropNeighborRecommendation | null => {
    const { companionPlants } = get();
    const normalizedCrop = cropName.toLowerCase().trim();
    
    // Find the family this crop belongs to
    let cropFamily = null;
    let familyData = null;
    
    for (const family of companionPlants) {
      if (family.crops.some(crop => crop.toLowerCase().includes(normalizedCrop) || normalizedCrop.includes(crop.toLowerCase()))) {
        cropFamily = family.family;
        familyData = family;
        break;
      }
    }
    
    if (!familyData) {
      // Try partial matching for common crop variations
      for (const family of companionPlants) {
        const cropVariations = [
          normalizedCrop.replace(/s$/, ''), // remove plural
          normalizedCrop + 's', // add plural
          normalizedCrop.split(' ')[0], // first word only
        ];
        
        for (const variation of cropVariations) {
          if (family.crops.some(crop => crop.toLowerCase().includes(variation) || variation.includes(crop.toLowerCase()))) {
            cropFamily = family.family;
            familyData = family;
            break;
          }
        }
        if (familyData) break;
      }
    }
    
    if (!familyData) return null;
    
    return {
      inputCrop: cropName,
      recommendedNeighbors: familyData.goodNeighbors,
      avoidNeighbors: familyData.badNeighbors,
      benefits: familyData.benefits,
      familyInfo: `${cropName} belongs to the ${cropFamily} family`
    };
  },

  getCropInfo: (cropName: string): CropInfo | null => {
    const { cropDatabase } = get();
    return cropDatabase.find(crop => 
      crop.name.toLowerCase() === cropName.toLowerCase()
    ) || null;
  },

  setLanguage: (language: 'en' | 'fil') => {
    set({ language });
  },

  t: (key: string): string => {
    const { language, translations } = get();
    return translations[language]?.[key] || key;
  },
}));