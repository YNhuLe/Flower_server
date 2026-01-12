import initKnex from "knex";
import configuration from "../knexfile";
import type { Request, Response } from "express";

const knex = initKnex(configuration);

const getSaleData = async (req: Request, res: Response): Promise<void> => {
  const { range, category } = req.query;

  const days = range && range === "ytd" ? 365 : range ? Number(range) : 30;

  const categoryValue = typeof category === "string" ? category : "all";
  const isAll = categoryValue === "all";

  const params: (number | string)[] = [days];
  if (!isAll) params.push(categoryValue);

  try {
    if (isAll) {
      // 1. Summary across all categories
      const summaryQuery = `
      SELECT 
      SUM(order_items.quantity * order_items.unit_price) AS revenue,
      COUNT(DISTINCT orders.id) AS total_orders,
      SUM(order_items.quantity) AS total_items_sold,
      AVG(orders.total_amount) AS avg_order_value
      FROM orders
     JOIN order_items ON orders.id = order_items.order_id
      WHERE orders.created_at >= NOW() - (? || ' days')::interval;
        `;

      const summaryResult = await knex.raw(summaryQuery, [days]);
      const summary = summaryResult.rows[0];

      // 2. Top category
      const topCategoryQuery = `
    SELECT 
      categories.name AS category,
      SUM(order_items.quantity * order_items.unit_price) AS revenue
    FROM orders
    JOIN order_items ON orders.id = order_items.order_id
    JOIN plants ON order_items.plant_id = plants.id
    JOIN categories ON plants.category_id = categories.id
    WHERE orders.created_at >= NOW() - (? || ' days')::interval
    GROUP BY categories.name
    ORDER BY revenue DESC
    LIMIT 1;
    `;

      const topCategoryResult = await knex.raw(topCategoryQuery, [days]);
      const topCategory = topCategoryResult.rows[0]?.category || null;

      res.json({
        revenue: Number(summary.revenue) || 0,
        total_orders: Number(summary.total_orders) || 0,
        total_items_sold: Number(summary.total_items_sold) || 0,
        avg_order_value: Number(summary.avg_order_value) || 0,
        top_category: topCategory,
      });
      // return;
    }
    const query = `
        SELECT date, revenue, total_orders, total_items_sold, avg_order_value, top_selling_product 
        FROM (
          SELECT 
            DATE(orders.created_at) AS date,
            SUM(order_items.quantity * order_items.unit_price) AS revenue,
            COUNT(orders.id) AS total_orders,
            SUM(order_items.quantity) AS total_items_sold,
            AVG(order_items.unit_price) AS avg_order_value,
            plants.common_name AS top_selling_product,
            ROW_NUMBER() OVER (
              PARTITION BY DATE(orders.created_at)
              ORDER BY SUM(order_items.quantity) DESC
            ) AS rank
          FROM orders
          JOIN order_items ON orders.id = order_items.order_id
          JOIN plants ON order_items.plant_id = plants.id
          JOIN categories ON plants.category_id = categories.id
          WHERE orders.created_at >= NOW() - (? || ' days')::interval
            AND categories.name = ?
          GROUP BY DATE(orders.created_at), plants.common_name
        ) t
        WHERE rank = 1
        ORDER BY date ASC;
      `;

    const result = await knex.raw(query, [days, categoryValue]);
    const labels = result.rows.map((r: { date: any }) => r.date);
    const values = result.rows.map((r: { revenue: any }) => Number(r.revenue));
    const total_orders = result.rows.map(
      (r: { total_orders: any }) => r.total_orders
    );
    const total_items_sold = result.rows.map(
      (r: { total_items_sold: any }) => r.total_items_sold
    );
    const avg_order_value = result.rows.map((r: { avg_order_value: any }) =>
      Number(r.avg_order_value)
    );
    const top_selling_product = result.rows.map(
      (r: { top_selling_product: any }) => r.top_selling_product
    );

    res.json({
      labels,
      values,
      total_orders,
      total_items_sold,
      avg_order_value,
      top_selling_product,
    });
  } catch (error: any) {
    res.status(400).send(`Error fetching sale data: ${error.message || error}`);
    return;
  }
};
export { getSaleData };
