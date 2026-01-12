interface SaleData{
    date: string;
    total_sales: number;
    total_orders: number;
    total_items_sold: number;
    avg_order_value: number;
    top_selling_product: string;
}

export type { SaleData };