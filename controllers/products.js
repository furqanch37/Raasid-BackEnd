import { Products } from "../models/products.js";
import ErrorHandler from "../middlewares/error.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

// Helper to parse and validate nutritions
const parseNutritions = (raw) => {
  const parsed = JSON.parse(raw);
  const result = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (
      typeof value === 'object' &&
      typeof value.UOM === 'string' &&
      typeof value.Results === 'string'
    ) {
      result[key] = {
        UOM: value.UOM,
        Results: value.Results,
      };
    } else {
      throw new Error(`Invalid format for nutrition: ${key}`);
    }
  }
  return result;
};

// Create Product
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
      nutritions,
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

    let parsedIngredients = [];
    let parsedNutritions = {};

    try {
      parsedIngredients = ingredients ? JSON.parse(ingredients) : [];
    } catch (err) {
      return next(new ErrorHandler("Invalid ingredients format", 400));
    }

    try {
      parsedNutritions = nutritions ? parseNutritions(nutritions) : {};
    } catch (err) {
      return next(new ErrorHandler(`Invalid nutritions format: ${err.message}`, 400));
    }

    const product = await Products.create({
      name,
      description,
      price,
      category,
      ingredients: parsedIngredients,
      packaging,
      serving,
      image: imageUrl,
      nutritions: parsedNutritions,
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

// Get All Products with optional category filter
export const getAllProducts = async (req, res, next) => {
  try {
    const { category } = req.query;

    // Build dynamic filter
    const filter = {};
    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') }; // Case-insensitive match
    }

    const products = await Products.find(filter);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};


// Get Product by ID
export const getProductById = async (req, res, next) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// Update Product by ID
export const updateProduct = async (req, res, next) => {
  try {
    console.log(req.body.nutritions);
    const product = await Products.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    if (req.file) {
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
      product.image = cloudinaryUpload.secure_url;
    }

    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = req.body.price;
    if (req.body.category) product.category = req.body.category;
    if (req.body.packaging) product.packaging = req.body.packaging;
    if (req.body.serving) product.serving = req.body.serving;

    if (req.body.ingredients) {
      try {
        product.ingredients = JSON.parse(req.body.ingredients);
      } catch {
        return next(new ErrorHandler("Invalid ingredients format", 400));
      }
    }

    if (req.body.nutritions) {
      try {
        product.nutritions = parseNutritions(req.body.nutritions);
      } catch (err) {
        return next(new ErrorHandler(`Invalid nutritions format: ${err.message}`, 400));
      }
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Product by ID
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
// Insert Multiple Products
export const insertManyProducts = async (req, res, next) => {
  try {
    const productsData = req.body;

    if (!Array.isArray(productsData) || productsData.length === 0) {
      return next(new ErrorHandler("Products array is required", 400));
    }

    const validatedProducts = [];

    for (const product of productsData) {
      const {
        name,
        description,
        price,
        category,
        ingredients,
        packaging,
        serving,
       
        image
      } = product;

    

      let parsedIngredients = [];
    

      try {
        parsedIngredients = Array.isArray(ingredients)
          ? ingredients
          : JSON.parse(ingredients || "[]");
      } catch (err) {
        return next(new ErrorHandler("Invalid ingredients format", 400));
      }

    
      validatedProducts.push({
        name,
        description,
        price,
        category,
        ingredients: parsedIngredients,
        packaging,
        serving,
      
        image
      });
    }

    const inserted = await Products.insertMany(validatedProducts);

    res.status(201).json({
      success: true,
      message: "Products inserted successfully",
      insertedCount: inserted.length,
      products: inserted
    });
  } catch (error) {
    next(error);
  }
};
