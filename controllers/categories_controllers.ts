import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response} from "express";

const knex= initKnex(configuration);


//get all the categories

const getAllCategories = async ( req: Request, res:Response) : Promise<void> =>{
    try{

    }catch(error: any){
        res.status(400).send(`Error: fetching categories: ${error.message || error}`)
    }
};

export {getAllCategories}