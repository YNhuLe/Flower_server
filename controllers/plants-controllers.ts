import initKnex from "knex";
import configuration from "../knexfile";
import { Request, Response } from "express";

const knex = initKnex(configuration);
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

  original_price: number | null;
  discounted_price: number | null;
  size_available: string | null;
  stock_quantity: number | null;
  shipping_info: string | null;

  rating: number;
  num_reviews: number;

  created_at: Date;
  updated_at: Date;
}

const getAllPlants = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: Plant[] = await knex<Plant>("plants");
    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).send(`Error retrieving plants: ${error}`);
    res.status(400).send(`Error retrieving plants: ${error.message || error}`);
  }
};

export { getAllPlants };
