import initKnex from "knex";
import configuration from "../knexfile";
import type {Request, Response} from "express";
import type {Gift, Gift_Categories} from "../models/gift";

const knex = initKnex(configuration);


//get all the gifts
const getAllGifts = async( req: Request, res: Response): Promise<void> =>{
    try{
        const data: Gift[] = await knex<Gift>("gift_items")
        .join("gift_categories","gift_items.category_id", "gift_categories.id" )
        .select("gift_items.*", "gift_categories.*")
        ;
         res.status(200).json(data);
         console.log(data);
    }catch(error: any){
        res.status(400).send(`Error fetching gifts: ${error.message || error}`);
    }
};

//get all the gift categories from gift_categories table
const getAllCategories = async ( req: Request, res:Response) : Promise<void> =>{

    try{
const giftCategories: Gift_Categories[] = await knex<Gift_Categories>("gift_categories")
.select("name");
res.status(200).json(giftCategories);
console.log("Gift categories" , giftCategories);
    }catch(error: any){
        res.status(400).send(`Error fetching gift categories from gift_categories table: ${error.message || error}`);
    }
}

export {getAllGifts, getAllCategories};