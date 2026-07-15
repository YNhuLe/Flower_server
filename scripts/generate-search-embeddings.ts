import initKnex from "knex";
import configuration from "../knexfile";
import {embed} from "../utils/embed";


const knex = initKnex(configuration);
/**
 * Script to generate search embeddings for plants in the database.
 */

const run = async () =>{
 const plants = await knex('plants')
 .whereNull('search_embedding')
 .select('id', 'common_name', 
    'description', 'watering_requirements', 'humidity_preference',
    'temperature_range', 'soil_type', 'potting_tips',
    'common_problems', 'growth_habit',
    'mature_height','mature_width',
    'bloom_info','is_pet_friendly','air_purifying',
    'stock_quantity', 'shipping_info',
    'rating','num_reviews',
    'isnewarrival','plantinglevel','isonsale', 'benefits',
    'scientific_name','light','slug','toxicity_notes'

 );
 console.log(`Backfilling ${plants.length} plants...`);

 for (const plant of plants){
    const textToEmbed = [
        plant.common_name,
        plant.description,
        plant.watering_requirements,
        plant.humidity_preference,
        plant.temperature_range,
        plant.soil_type,
        plant.potting_tips,
        plant.common_problems,
        plant.growth_habit,
        plant.mature_height,
        plant.mature_width,
        plant.bloom_info,
        plant.is_pet_friendly ? 'pet friendly' : '',
        plant.air_purifying ? 'air purifying' : '',
        plant.stock_quantity ? `stock quantity: ${plant.stock_quantity}` : '',
        plant.shipping_info,
        `rating: ${plant.rating}`,
        `number of reviews: ${plant.num_reviews}`,
        plant.isnewarrival ? 'new arrival' : '',
        `planting level: ${plant.plantinglevel}`,
        plant.isonsale ? 'on sale' : '',
        `benefits: ${plant.benefits}`,
        `scientific name: ${plant.scientific_name}`,
        `light requirements: ${plant.light}`,
        plant.toxicity_notes
    ].filter(Boolean).join(' ');

    try{
        const embedding  = await embed(textToEmbed);
        await knex('plants')
            .where('id', plant.id)
            .update({
                search_embedding:  JSON.stringify(embedding),
            });
             console.log(`✅ ${plant.id} — ${plant.common_name}`);
    } catch (error:any) {
        console.error(`Failed to generate embedding for plant ID ${plant.id}:`, error);
        console.error(`❌ ${plant.id} — ${plant.common_name}: ${error.message}`);
    }
 }
  console.log("Done.");
  await knex.destroy();
};run().catch(console.error);