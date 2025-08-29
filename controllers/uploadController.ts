import {Response, Request} from 'express';
import cloudinary from '../config/cloudinary';

const uploadImage = async (req: Request, res: Response) =>{
    try{
const results = await cloudinary.uploader.upload("");
console.log(results);
const url = cloudinary.url(results.public_id, {
    transformation: [
        { quality: "auto",
            fetch_format: 'auto'
        },
        {
            crop: 'fill', gravity: 'auto'
        }
    ]
})
}catch( err: any){
        res.status(500).json({err: 'Upload failed!'})
    }
}