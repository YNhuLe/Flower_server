import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response} from "express";
import type {Category} from "../models/category";
const knex= initKnex(configuration);


//get all the categories

const getAllCategories = async ( req: Request, res:Response) : Promise<void> =>{
    try{
const categories: Category[] = await knex<Category>("categories"

).select("name", "description", "quantity", "cate_img");
res.status(200).json(categories);
    }catch(error: any){
        res.status(400).send(`Error: fetching categories: ${error.message || error}`)
    }
};

export {getAllCategories}