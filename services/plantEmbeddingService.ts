import knexConfig from "../dist/knexfile.js";
import Knex from "knex";
import {embed} from "../utils/embed.js";
import type { Plant ,PlantWithSizes} from "../models/plants.js";

const knex = Knex(knexConfig);

//create natural language summary of the plant
function buildPlantSummary(plant:PlantWithSizes):string{

return `
Name:${plant.common_name}
Description: ${plant.description}
Humidity: ${plant.humidity_preference}
Height:${plant.mature_height}
LightRequirement: ${plant.light_requirements}
WaterRequirement: ${plant.watering_requirements}
Tempature:${plant.temperature_range}
SoilType:${plant.soil_type}
FertilizerInfo:${plant.fertilizer_info}
Potting:${plant.potting_tips}
CommonProblem:${plant.common_problems}
GrowthHabit:${plant.growth_habit}
MatureWidth: ${plant.mature_width}
BloomInfo:${plant.bloom_info}
AirPurifying:${plant.air_purifying}
PetFriendly: ${plant.is_pet_friendly}
SizeAvailable: ${plant.size_available}
StockQuantity:${plant.stock_quantity}
Rating: ${plant.rating}
NumberReview: ${plant.num_reviews}
CategoryId: ${plant.category_id}
OriginalPrices: ${plant.sizes.map(size=>size.original_price).join(", ")}

`
    
} 
//trigger embedding single plant by ID when new plant added, plant info updated
async function embeddedPlantById(plantId:number) {
    const plant  = await knex("plants").where({id:plantId}).first();
    if(!plant){ throw new Error(`Plant with the ID ${plantId} is not exist!`) }

    const summary  = buildPlantSummary(plant);
    const vector = embed(summary);
    await knex("plants").where({id: plantId}).update({plant_embedding: vector})


    return vector;
}



async function embedAllPlants(){
//fetch all plants
const plants = await knex("plants").select("*");
//loop through each plant and generate the embedding
for (const plant of plants){
    const summary = buildPlantSummary(plant);
    const vector = embed(summary);
//validate if vector is valid
    if (!vector || !Array.isArray(vector)) 
        { console.error("Embedding failed for plant:", plant.id); continue; } 
    const pgVector = `{${vector.join(",")}}`; //converts a JavaScript array of numbers into a PostgreSQL vector literal
    //update plant with embedding
    await knex("plants")
    .where({id: plant.id})
    .update({plant_embedding: pgVector});
console.log(`Embedded plant: ${plant.common_name} (ID: ${plant.id})`);
}

return {count: plants.length}

}

export default { embeddedPlantById, embedAllPlants}