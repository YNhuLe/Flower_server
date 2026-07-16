import initKnex from "knex";
import configuration from "../knexfile";
import { embed } from "../utils/embed";

import type { Request, Response } from "express";

const knex = initKnex(configuration);

/**
 *
 * @param keywordIds
 * @param vectorIds
 * @param k
 * @param topN the number of top results to return
 * @returns the ranking among options
 */
function rrfMerge(
  keywordIds: number[],
  vectorIds: number[],
  k = 60,
  topN = 20,
): number[] {
  const scores: Record<number, number> = {};
  keywordIds.forEach((id, i) => {
    scores[id] = (scores[id] || 0) + 1 / (k + i + 1);
  });
  vectorIds.forEach((id, i) => {
    scores[id] = (scores[id] || 0) + 1 / (k + i + 1);
  });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => Number(id));
}

const getSearchResults = async (req: Request, res: Response): Promise<void> => {
  const {
    q,
    limit = "20",
    inStock,
    category,
    petfriendly,
    level,
    onsale,
    maxPrice,
  } = req.query;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Missing or invalid query parameter 'q'" });
    return;
  }
console.log("Search query:", q);
  try {
    const [keywordRows, queryEmbedding] = await Promise.all([
      knex.raw(
        `SELECT id,
         (ts_rank(search_text, plainto_tsquery('english', ?))) As rank 
         FROM plants 
         WHERE search_text @@ plainto_tsquery('english', ?)
         ORDER BY rank DESC
         LIMIT 50
                `,
        [q, q],
      ),
      embed(q),
    ]);

    const vectorRows = await knex.raw(
      `
        SELECT id,
        search_embedding <=> ?::vector AS distance
        FROM plants 
        ORDER BY distance ASC
        LIMIT 50
        `,
      [JSON.stringify(queryEmbedding)],
    );

    const keywordIds = keywordRows.rows.map((row: any) => row.id);
    const vectorIds = vectorRows.rows.map((row: any) => row.id);
    const mergedIds = rrfMerge(keywordIds, vectorIds, 60, Number(limit));
    if (mergedIds.length === 0) {
      res.status(200).json({ query: q, results: [] });
      return;
    }

    let query = knex("plants")
      .whereIn("id", mergedIds)
      .select(
        "id",
        "common_name",
        "scientific_name",
        "slug",
        "image_url",
        "plantinglevel",
        "stock_quantity",
        "is_pet_friendly",
        "isonsale",
        "category_id",
        "rating",
      );

    if (inStock === "true") query = query.andWhere("stock_quantity", ">", 0);
    if (category) query = query.andWhere("category_id", category);
    if (petfriendly === "true") query = query.andWhere("is_pet_friendly", true);
    if (level) query = query.andWhere("plantinglevel", level);
    if (onsale == "true") query = query.andWhere("isonsale", true);
    if (maxPrice)
      query = query
        .join("plant_sizes", "plants.id", "plant_sizes.plant_id")
        .andWhere("plant_sizes.price", "<=", Number(maxPrice))
        .distinct("plants.id");

    const plants = await query;
    const plantMap = Object.fromEntries(
      plants.map((plant: any) => [plant.id, plant]),
    );
    const results = mergedIds.map((id) => plantMap[id]).filter(Boolean);
    res.status(200).json({
      query: q,
      total: results.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export { getSearchResults };
