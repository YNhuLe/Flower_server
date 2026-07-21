import initKnex from "knex";
import configuration from "../knexfile";
import { embed } from "../utils/embed";

const knex = initKnex(configuration);

const run = async () => {
  const plants = await knex("plants").select(
    "id",
    "common_name",
    "scientific_name",
    "description",
    "light",
    "humidity",
    "watering_requirements",
    "humidity_preference",
    "temperature_range",
    "growth_habit",
    "bloom_info",
    "common_problems",
    "benefits",
    "toxicity_notes",
    "soil_type",
    "potting_tips",
    "plantinglevel",
  );

  for (const plant of plants) {
    const textToEmbed = [
      plant.common_name,
      plant.scientific_name,
      plant.description,
      plant.light,
      plant.humidity,
      plant.watering_requirements,
      plant.humidity_preference,
      plant.temperature_range,
      plant.growth_habit,
      plant.bloom_info,
      plant.common_problems,
      plant.benefits,
      plant.toxicity_notes,
      plant.soil_type,
      plant.potting_tips,
      plant.plantinglevel,
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const embedding = await embed(textToEmbed);
      const vectorString = `[${embedding.join(",")}]`;
      await knex.raw(
        `UPDATE plants SET search_embedding = ?::vector WHERE id = ?`,
        [vectorString, plant.id],
      );

      console.log(`✅ ${plant.id} — ${plant.common_name}`);
    } catch (error: any) {
      console.error(`❌ ${plant.id} — ${plant.common_name}: ${error.message}`);
    }
  }

  const missing = await knex("plants")
    .whereNull("search_embedding")
    .count("id as count");

  await knex.destroy();
};

run().catch(console.error);
