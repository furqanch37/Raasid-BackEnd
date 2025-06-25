import mongoose from "mongoose";

// Define sub-schema for each nutrition item
const nutritionItemSchema = new mongoose.Schema({
  UOM: {
    type: String,
    required: true
  },
  Results: {
    type: String,
    required: true
  }
}, { _id: false });

// Main product schema
const schema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  ingredients: {
    type: [String], 
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  packaging: {
    type: String,
    required: false,
  },
  serving: {
    type: String,
    required: false,
  },
  nutritions: {
    type: Map,
    of: nutritionItemSchema,
    required: false,
  }
}, {
  timestamps: true,
});

export const Products = mongoose.model("Products", schema);
