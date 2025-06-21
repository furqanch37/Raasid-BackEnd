import { Orders } from "../models/order.js";
import ErrorHandler from "../middlewares/error.js";

// Create Order
export const createOrder = async (req, res, next) => {
  try {
    const {
      email,
      fullName,
      address,
      city,
      phone,
      shippingMethod,
      paymentMethod,
      products,
      totalAmount
    } = req.body;

    if (
      !email || !fullName || !address || !city || !phone ||
      !shippingMethod || !paymentMethod || !products || !Array.isArray(products) || products.length === 0
    ) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    const newOrder = await Orders.create({
      email,
      fullName,
      address,
      city,
      phone,
      shippingMethod,
      paymentMethod,
      products,
      totalAmount,
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder
    });
  } catch (error) {
    next(error);
  }
};

// Get All Orders
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Orders.find().populate("products.productId");
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// Get Order by ID
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Orders.findById(req.params.id).populate("products.productId");
    if (!order) return next(new ErrorHandler("Order not found", 404));

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Orders.findById(req.params.id);
    if (!order) return next(new ErrorHandler("Order not found", 404));

    order.status = status || order.status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order
    });
  } catch (error) {
    next(error);
  }
};

// Delete Order
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Orders.findById(req.params.id);
    if (!order) return next(new ErrorHandler("Order not found", 404));

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
