import { Orders } from "../models/order.js";
import ErrorHandler from "../middlewares/error.js";
import { transporter } from "../utils/mailer.js";

export const createOrder = async (req, res, next) => {
  try {
    const {
      user,
      email,
      fullName,
      address,
      city,
      phone,
      shippingMethod,
      paymentMethod,
      products,
      totalAmount,
    } = req.body;

    // Validate input
    if (
      !user || !email || !fullName || !address || !city || !phone ||
      !shippingMethod || !paymentMethod || !Array.isArray(products) || products.length === 0
    ) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Create the order
    const newOrder = await Orders.create({
      user,
      email,
      fullName,
      address,
      city,
      phone,
      shippingMethod,
      paymentMethod,
      products,
      totalAmount,
      status: "Pending",
    });

    // Populate product names
    await newOrder.populate("products.productId");

    // Prepare product summary
    const productSummary = newOrder.products
      .map((p) => `• ${p.productId?.name || 'Unnamed Product'} — Quantity: ${p.quantity}`)
      .join("<br>");

    // Common email content
    const emailHtml = `
      <h3>Thank you for your order at <strong>Raasid</strong>!</h3>
      <p><strong>Order Summary:</strong></p>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}, ${city}</p>
      <p><strong>Shipping Method:</strong> ${shippingMethod}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p><strong>Products:</strong><br>${productSummary}</p>
      <p><strong>Total Amount:</strong> ${totalAmount} PKR</p>
    `;

    // Send to user
    await transporter.sendMail({
      from: `"Raasid Store" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Your Raasid Order Confirmation",
      html: emailHtml,
    });

    // Send to admin
    await transporter.sendMail({
      from: `"Raasid Store" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Order Received - Raasid",
      html: `<h3>New order placed by ${fullName}</h3>${emailHtml}`,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
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
// Get Orders by User ID
export const getOrdersByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const orders = await Orders.find({ user: userId })
      .populate("products.productId");

    res.status(200).json({
      success: true,
      orders
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
