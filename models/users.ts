interface User {
    id: number;
    name: string;
    email:string;
    password: string; 
    phone_number: string;
    created_at: Date;
    updated_at: Date;
    auth0_id: string;
}

export type {User};