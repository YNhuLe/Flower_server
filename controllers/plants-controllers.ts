import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";
import type { Plant } from "../models/plants";
import type { Category } from "../models/category";
const knex = initKnex(configuration);

//get all plants
const getAllPlants = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: Plant[] = await knex<Plant>("plants").select("*");
    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).send(`Error retrieving plants: ${error.message || error}`);
  }
};

//get plants base on id
const getSinglePlant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plant: Plant | undefined = await knex<Plant>("plants")
      .where({ id: Number(id) })
      .first();

    if (!plant) {
      res.status(404).send("Plant not found.");
      return;
    }
    res.status(200).json(plant);
  } catch (error: any) {
    res.status(400).send(`Error retrieving plants: ${error.message || error}`);
  }
};

//get list of plants base on category
const getPlantList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plantList = await knex("plants")
      .join("categories", "plants.category_id", "categories.id")
      .select("plants.*", "categories.*")
      .where("categories.id", Number(id));
    if (!plantList || plantList.length === 0) {
      res.status(404).send("No plants found with the given category!");
      return;
    }
    res.status(200).json(plantList);

  } catch (error: any) {

res.status(400).send(`Error fetching plants base on category ${error.message || error}`)
  }
};

//giftbox base on id
const getGiftBox = async ( req: Request, res: Response): Promise<void> =>{
  try{
const { boxId} = req.params;
const giftbox = await knex("giftboxes")
.join("giftbox_items", "giftbox_items.giftbox_id", "giftboxes.id")
.select ("giftbox_items.*", "giftboxes.*")
.where("giftbox_id", Number(boxId));
 if(!giftbox || giftbox.length === 0){
  res.status(404).send(`no giftbox found with the given ID!`);
  return;
 }
 res.status(200).json(giftbox);
  }catch(err:any){
    res.status(200).send(`Error fetching giftbox base on id ${err.message || err}`)
  }
}
export { getAllPlants, getSinglePlant , getPlantList, getGiftBox};
