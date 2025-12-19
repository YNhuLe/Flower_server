import initKnex from "knex";
import configuration from "../knexfile.js";
import type { Request, Response } from "express";
import type { Plant, PlantSize, PlantWithSizes } from "../models/plants";
const knex = initKnex(configuration);

//get all plants

const getAllPlants = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await knex("plants")
      // .join("plant_sizes", "plants.id", "plant_sizes.plant_id")
      .select(
        "plants.*",

        knex.raw(
          `
          jsonb_agg(
          
          jsonb_build_object(
            'size_id', plant_sizes.size_id,
            'plant_id', plant_sizes.plant_id,
            'size', plant_sizes.size,
            'original_price', plant_sizes.original_price,
            'discount_percentage', plant_sizes.discount_percentage,
            'discounted_price', plant_sizes.original_price * (1 - plant_sizes.discount_percentage/100.0)
          )
        ) AS sizes
          `
        )
      )
      .join("plant_sizes", "plants.id", "plant_sizes.plant_id")
      .groupBy("plants.id")
      .orderBy("plants.id");

    //type conversion and string parsing
    const plants: PlantWithSizes[] = data.map((plant: any) => {
      let parsedBenefits: string[] = [];
      if (typeof plant.benefits === "string" && plant.benefits) {
        try {
          const cleanBenefits = plant.benefits.replace(/[\n\r]/g, "");
          parsedBenefits = JSON.parse(cleanBenefits);
        } catch (error: any) {
          // console.log(`Error parsing benefits for plant ${plant.id} : `, error);
          console.error(
            `Error parsing benefits for plant  $ { plant . id }  : `,
            error
          );
          parsedBenefits = ["Error reading benefits!"];
        }
      }

      //convert numeric fields for original_price, discount_percentage, discount_price
      const cleanedSizes = (plant.sizes || []).map((size: any) => ({
        ...size,
        original_price: Number(size.original_price),
        discount_percentage: Number(size.discount_percentage),
        discounted_price: Number(size.discounted_price),
      })) as (Plant & { discounted_price: number })[];

      return {
        ...plant,
        benefits: parsedBenefits,
        sizes: cleanedSizes,
        rating: Number(plant.rating),
        num_reviews: Number(plant.num_reviews),
        stock_quantity: Number(plant.stock_quantity),
      } as PlantWithSizes;
    });

    // Log all debugging info BEFORE sending response
    console.log("getAllPlants - Total plants retrieved:", plants.length);
    console.log("getAllPlants - Testing console output");

    // if (plants.length > 0) {
    //   console.log(
    //     "getAllPlants - First Plant Data (Check Sizes & Prices):",
    //     JSON.stringify(plants[0]?.sizes, null, 2)
    //   );
    //   console.log(
    //     "getAllPlants - Full first plant:",
    //     JSON.stringify(plants[0], null, 2)
    //   );
    // }

    // Send response AFTER all logging
    res.status(200).json(plants);
  } catch (error: any) {
    res.status(400).send(`Error retrieving plants: ${error.message}`);
  }
};

//get plants base on id
const getSinglePlant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await knex("plants")
      .select(
        "plants.*",
        knex.raw(
          `
          jsonb_agg(
          jsonb_build_object(
            'size_id', plant_sizes.size_id,
            'plant_id', plant_sizes.plant_id,
            'size', plant_sizes.size,
            'original_price', plant_sizes.original_price,
            'discount_percentage', plant_sizes.discount_percentage,
            'discounted_price', plant_sizes.original_price * (1 - plant_sizes.discount_percentage/100.0)
          )
        ) AS sizes
          `
        )
      )
      .leftJoin("plant_sizes", "plants.id", "plant_sizes.plant_id")
      .where("plants.id", Number(id))
      .groupBy("plants.id")
      .first();

    if (!data) {
      res.status(404).send("Plant not found.");
      return;
    }

    // Parse benefits if it's a string
    let parsedBenefits: string[] = [];
    if (typeof data.benefits === 'string' && data.benefits) {
      try {
        const cleanBenefits = data.benefits.replace(/[\n\r]/g, '');
        parsedBenefits = JSON.parse(cleanBenefits);
      } catch (error: any) {
        console.error(`Error parsing benefits for plant ${data.id}:`, error);
        parsedBenefits = ['Error reading benefits!'];
      }
    }

    // Convert numeric fields
    const cleanedSizes = (data.sizes || [])
    .filter((s: any) => s !== null
)
    .map((size: any) => ({
      ...size,
      original_price: Number(size.original_price),
      discount_percentage: Number(size.discount_percentage),
      discounted_price: Number(size.discounted_price)
    }));

    const normalised = {
      ...data,
      benefits: parsedBenefits,
      sizes: cleanedSizes,
      rating: Number(data.rating),
      num_reviews: Number(data.num_reviews),
      stock_quantity: Number(data.stock_quantity)
    };

    res.status(200).json(normalised);
  } catch (error: any) {
    res.status(400).send(`Error retrieving plants: ${error.message || error}`);
  }
};

//get plant info and their category
const getPlantCate = async (req: Request, res: Response): Promise<void> => {
  try {
    const plantCategory = await knex("plants")
      .join("categories", "categories.id", "plants.category_id")
      .select("plants.*", "categories.*");
    if (!plantCategory || plantCategory.length === 0) {
      res.status(404).send(`No plant found!`);
      return;
    }

    const normalised = plantCategory.map((plant) => ({
      ...plant,
      original_price: Number(plant.original_price),

      discounted_price: Number(plant.discounted_price),
    }));
    res.status(200).json(normalised);
  } catch (error: any) {
    res.status(400).send(`Error retrieving plant and their category!`);
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

    const normalised = plantList.map((plant) => ({
      ...plant,
      original_price: Number(plant.original_price),
      discounted_price: Number(plant.discounted_price),
    }));
    res.status(200).json(normalised);
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
    // console.log("Result: ", result);
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
    // console.log("Result: ", result);
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
  getPlantCate,
};
