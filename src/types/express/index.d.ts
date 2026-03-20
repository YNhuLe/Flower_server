import "express";
declare module "express-serve-static-core"{
   export interface Request{
        user? : {
            uid: string;
            email: string;
            name?:string;
            picture?:string;
            [key:string]:any;
        }
    }
}
