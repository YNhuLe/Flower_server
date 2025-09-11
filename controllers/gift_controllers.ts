import initKnex from "knex";
import configuration from "../knexfile";
import type {Request, Response} from "express";
import type {Gift} from "../models/gift";

const knex = initKnex(configuration);


//get all the gifts
const getAllGifts = async( req: Request, res: Response): Promise<void> =>{
    try{
        const data: Gift[] = await knex<Gift>("gift_items").select("*");
         res.status(200).json(data);
         console.log(data);
    }catch(error: any){
        res.status(400).send(`Error fetching gifts: ${error.message || error}`);
    }
};

export {getAllGifts};