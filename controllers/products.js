import { Products } from "../models/products.js";
import ErrorHandler from "../middlewares/error.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      ingredients,
      packaging,
      serving,
      nutritions // this should be sent as an object in JSON format if using Postman
    } = req.body;

    if (!req.file) {
      return next(new ErrorHandler("Product image is required", 400));
    }

    // Upload image to Cloudinary
    const bufferStream = streamifier.createReadStream(req.file.buffer);
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "product_images" },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      bufferStream.pipe(stream);
    });

    const imageUrl = cloudinaryUpload.secure_url;

    const product = await Products.create({
      name,
      description,
      price,
      category,
      ingredients: JSON.parse(ingredients), // Make sure you send as JSON string if using Postman
      packaging,
      serving,
      image: imageUrl,
      nutritions: nutritions ? JSON.parse(nutritions) : {}, // Optional Map
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};
