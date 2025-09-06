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
    res
      .status(400)
      .send(`Error fetching plants base on category ${error.message || error}`);
  }
};
//get all the giftboxes
const getGiftBox = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await knex.raw(
      `
      SELECT 
        g.id AS giftbox_id,
        g.title,
        g.subtitle,
        g.img_url,
        g.discount,
        g.price,
        g.ori_price,
        g.is_featured,
        g.created_at,
        g.updated_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'item_name', i.item_name,
            'quantity', i.quantity,
            'sort_order', i.sort_order
          ) ORDER BY i.sort_order
        ) AS item_names
      FROM giftboxes g
      JOIN giftbox_items i ON g.id = i.giftbox_id
      GROUP BY 
        g.id, g.title, g.subtitle, g.img_url, g.discount, g.price, 
        g.ori_price, g.is_featured, g.created_at, g.updated_at;
      `
    );
    console.log("Result: ", result);
    const giftbox = result?.rows;

    if (!giftbox) {
      res.status(404).send(`No giftbox found!`);
      return;
    }

    giftbox.items = giftbox.item_names;
    delete giftbox.item_names;

    res.status(200).json(giftbox);
  } catch (err: any) {
    res.status(500).send(`Error fetching giftboxes ${err.message || err}`);
  }
};

//get giftbox base on the Id

const getGiftBoxById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boxId } = req.params;

    const result = await knex.raw(
      `
      SELECT 
        g.id AS giftbox_id,
        g.title,
        g.subtitle,
        g.img_url,
        g.discount,
        g.price,
        g.ori_price,
        g.is_featured,
        g.created_at,
        g.updated_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'item_name', i.item_name,
            'quantity', i.quantity,
            'sort_order', i.sort_order
          ) ORDER BY i.sort_order
        ) AS item_names
      FROM giftboxes g
      JOIN giftbox_items i ON g.id = i.giftbox_id
      WHERE g.id = ?
      GROUP BY 
        g.id, g.title, g.subtitle, g.img_url, g.discount, g.price, 
        g.ori_price, g.is_featured, g.created_at, g.updated_at;
      `,
      [boxId]
    );
    console.log("Result: ", result);
    const giftbox = result?.rows?.[0];

    if (!giftbox) {
      res.status(404).send(`No giftbox found!`);
      return;
    }

    giftbox.items = giftbox.item_names;
    delete giftbox.item_names;

    res.status(200).json(giftbox);
  } catch (err: any) {
    res.status(500).send(`Error fetching giftbox by ID: ${err.message || err}`);
  }
};

export {
  getAllPlants,
  getSinglePlant,
  getPlantList,
  getGiftBox,
  getGiftBoxById,
};
