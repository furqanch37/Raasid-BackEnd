import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  ingredients: {
    type: [String], 
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  packaging: {
    type: String,
    required: true,
  },
  serving: {
    type: String,
    required: true,
  },
  nutritions: {
    type: Map,
    of: String,
    required: false,
  },
}, {
  timestamps: true,
});

export const Products = mongoose.model("Products", schema);
