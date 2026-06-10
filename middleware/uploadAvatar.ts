import multer from "multer";

/**
 * Multer configuration for handling avatar uploads. It uses memory storage and limits file size to 5MB.
 * Only allows JPEG, PNG, and WEBP image formats. This middleware will be used in the route for updating user profile pictures.
 * The uploaded file will be processed in the controller, where it will be uploaded to Cloudinary and the user's profile will be updated with the new avatar URL.
 * 
 */
const uploadAvatar =  multer({
storage:multer.memoryStorage(),
limits: { fileSize: 5 * 1024 *1024},
fileFilter: (req, file, cb) =>{
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)){
        cb(null, true);
    } else {
        cb(new Error("Invalid file type"));
    }
}
});
    
export default uploadAvatar;