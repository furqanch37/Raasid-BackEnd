import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
import jwt from "jsonwebtoken";
import { transporter } from "../utils/mailer.js";
import generateEmailTemplate from "../utils/emailTemplate.js";




export const deleteUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User ${user.firstName} ${user.lastName} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid Email or Password", 400));
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked. Please contact support.",
      });
    }

    // Check if user is not verified
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new ErrorHandler("Invalid Email or Password", 400));
    }

    const cleanedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileUrl: user.profileUrl,
      email: user.email,
      country: user.country,
      role: user.role,
      verified: user.verified,
      blocked: user.blocked,
      createdAt: user.createdAt,
    };

    sendCookie(user, res, "Login Successful", 200, { user: cleanedUser });

  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find(); // Fetch all users

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};



export const register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      country,
      role,
      sellerDetails, // Expecting full object from Postman
    } = req.body;

    const existingUser = await User.findOne({ email });

    // Special handling: If user exists and role is 'seller'
    if (existingUser && role === "seller") {
      const updateData = {};

      if (sellerDetails?.linkedUrl || sellerDetails?.speciality) {
        updateData.sellerDetails = {
          ...existingUser.sellerDetails,
          ...(sellerDetails?.linkedUrl && { linkedUrl: sellerDetails.linkedUrl }),
          ...(sellerDetails?.speciality && { speciality: sellerDetails.speciality }),
        };
      }

      if (!existingUser.role.includes("seller")) {
        updateData.role = [...existingUser.role, "seller"];
      }

      await User.updateOne({ email }, { $set: updateData });

      const updatedUser = await User.findOne({ email });
      await sendSellerApprovalEmail(updatedUser);

      return res.status(200).json({
        success: true,
        message: "Seller details updated and email sent for approval.",
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          country: updatedUser.country,
          role: updatedUser.role,
          profileUrl: updatedUser.profileUrl,
          sellerDetails: updatedUser.sellerDetails,
          createdAt: updatedUser.createdAt,
        },
      });
    }

    // Normal new user flow
    if (existingUser) return next(new ErrorHandler("User Already Exists", 400));
    if (role === "superadmin") return next(new ErrorHandler("Registration as 'superadmin' is not allowed", 403));

    const hashedPassword = await bcrypt.hash(password, 10);

    // Avoid blindly adding 'buyer' if role is seller
  // Ensure "buyer" is always included if role is "seller"
const roles = [];
if (role === "seller") {
  roles.push("buyer", "seller");
} else if (role && typeof role === "string") {
  roles.push("buyer", role);
}


    let profileUrl = "";
    if (req.file) {
      const bufferStream = streamifier.createReadStream(req.file.buffer);
      const cloudinaryUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "user_profiles" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        bufferStream.pipe(stream);
      });
      profileUrl = cloudinaryUpload.secure_url;
    }

    const isAdmin = roles.includes("admin");
    const isSeller = roles.includes("seller");
    const isBuyer = roles.includes("buyer");

    const newUserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      country,
      role: roles,
      profileUrl,
      verified: isSeller ? false : isAdmin || false,
    };

    if (isSeller && sellerDetails) {
      newUserData.sellerDetails = {};
      if (sellerDetails.linkedUrl) newUserData.sellerDetails.linkedUrl = sellerDetails.linkedUrl;
      if (sellerDetails.speciality) newUserData.sellerDetails.speciality = sellerDetails.speciality;
    }

    const user = await User.create(newUserData);

   if (isBuyer && !isSeller) {
  // Send buyer verification email only if not also a seller
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const verificationLink = `https://backend-service-marketplace.vercel.app/api/users/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Service Marketplace" <${process.env.ADMIN_EMAIL}>`,
    to: email,
    subject: "Verify Your Email",
    html: generateEmailTemplate({
      firstName,
      subject: "Email Verification",
      content: `
        <p>Thanks for registering as a <strong>buyer</strong> on Service Marketplace. Please verify your email by clicking the button below:</p>
        <div style="margin:30px 0;text-align:center;">
          <a href="${verificationLink}" style="padding:12px 25px;background:#4CAF50;color:white;border-radius:5px;text-decoration:none;font-size:16px;">
            Verify Email
          </a>
        </div>
        <p>If you did not sign up, please ignore this email.</p>
      `,
    }),
  });
}

    if (isAdmin) {
      await sendAdminConfirmationEmails(email, firstName, password);
    }

    if (isSeller) {
      await sendSellerApprovalEmail(user);
    }

    res.status(201).json({
      success: true,
      message: isBuyer ? "Registration successful. Please verify your email." : "Registered Successfully",
      user: {
        _id: user._id,
        firstName,
        lastName,
        email,
        country,
        role: roles,
        verified: user.verified,
        profileUrl,
        createdAt: user.createdAt,
        ...(isSeller && user.sellerDetails && { sellerDetails: user.sellerDetails }),
      },
    });

  } catch (error) {
    next(error);
  }
};





export const logout = (req, res) => {
  const nodeEnv = process.env.NODE_ENV;
  const sameSite = nodeEnv === "development" ? "lax" : "none";
  const secure = nodeEnv === "development" ? false : true;
  const currentToken = req.cookies?.token;

  console.log("=== Logout Debug Info ===");
  console.log("NODE_ENV:", nodeEnv);
  console.log("SameSite:", sameSite);
  console.log("Secure:", secure);
  console.log("Current token cookie (if any):", currentToken);

  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      sameSite,
      secure,
      httpOnly: true,
    })
    .json({
      success: true,
      user: req.user,
      message: "Token cleared on logout",
      debug: {
        NODE_ENV: nodeEnv,
        sameSite,
        secure,
        receivedToken: currentToken,
      },
    });
};



export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "firstName lastName email profileUrl role country sellerStatus sellerDetails verified blocked"
    );

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

