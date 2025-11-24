interface Plant {
  id: number;
  common_name: string;
  description: string | null;
  image_url: string | null;

  light_requirements: string | null;
  watering_requirements: string | null;
  humidity_preference: string | null;
  temperature_range: string | null;
  soil_type: string | null;
  fertilizer_info: string | null;
  potting_tips: string | null;
  common_problems: string | null;

  growth_habit: string | null;
  mature_height: string | null;
  mature_width: string | null;
  bloom_info: string | null;

  is_pet_friendly: boolean | null;
  air_purifying: boolean | null;


  size_available: string | null;
  stock_quantity: number | null;
  shipping_info: string | null;

  rating: number;
  num_reviews: number;

  created_at: Date;
  updated_at: Date;
  category_id: number;
}

 interface PlantSize {
  size_id: number;
  plant_id: number;
  size: string | null;
  original_price: number;
  discount_percentage: number;
  discounted_price?: number;
}

interface PlantWithSizes extends Plant {
  sizes: PlantSize[];
}

export type { Plant , PlantSize, PlantWithSizes};