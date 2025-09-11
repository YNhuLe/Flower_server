interface Gift{
id: number;
name: string;
description?: string;
price: number;
img_url?: string;
category_id: number;
isNewArrival?: boolean;
isPopular?: boolean;
isOnSale?: boolean;
}
export type {Gift};