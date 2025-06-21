import mongoose from "mongoose";

const orderProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  shippingMethod: { type: String, enum: ["TCS", "PostOffice", "Leopards", "M&P"], required: true },
  paymentMethod: { type: String, enum: ["cod", "card"], required: true },
  products: [orderProductSchema], // only productId and quantity
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  }
}, { timestamps: true });

export const Orders = mongoose.model("Orders", orderSchema);
