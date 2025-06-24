import { Inquiry } from '../models/Inquiry.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'muhammadfurqanch517@gmail.com',
    pass: 'ooszsmkdjtrmcmis',
  },
});

export const submitInquiry = async (req, res) => {
  const { name, phone, email, message, subject } = req.body;

  try {
    // Save inquiry to DB
    const newInquiry = await Inquiry.create({ name, phone, email, subject, message });

    // Store email to admin
    const storeMailOptions = {
      from: email,
      to: "muhammadfurqanch517@gmail.com",
      subject: `New Inquiry from ${name}: ${subject}`,
      html: `
        <center><img src="https://res.cloudinary.com/dzcecmml3/image/upload/v1750745772/RaasidLogo_eps4j3.svg" alt="Raasid Logo" style="width: 70px;"></center>
        <center><h2 style="color: #3A3A3A; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; margin-bottom: 20px;">New Contact Form Submission</h2></center>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Acknowledgement to user
    const userMailOptions = {
      from: "muhammadfurqanch517@gmail.com",
      to: email,
      subject: "Thank You for Contacting Raasid",
      html: `
        <center><img src="https://res.cloudinary.com/daflot6fo/image/upload/v1750746433/020a63d10fa8da53dcf5754403c84115fdada494_w0oddy.png" alt="Raasid Logo" style="width: 70px;"></center>
        <h2 style="font-family: Arial, sans-serif;">Hi ${name},</h2>
        <p>Thank you for reaching out to <strong>Raasid</strong>. We've received your message and our team will get back to you shortly.</p>
        <p><strong>Your message:</strong></p>
        <p>"${message}"</p>
        <p>If you need immediate assistance, call us at <strong>+92 370 2333125</strong>.</p>
        <p>Best regards,<br><strong>Raasid Team</strong><br><a href="mailto:muhammadfurqanch517@gmail.com">muhammadfurqanch517@gmail.com</a></p>
      `,
    };

    await transporter.sendMail(storeMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ success: true, message: "Form submitted and emails sent." });

  } catch (error) {
    console.error("Inquiry submission error:", error);
    res.status(500).json({ success: false, message: "Submission failed." });
  }
};

export const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch inquiries." });
  }
};
