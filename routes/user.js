import express from "express";
import {  deleteUserById, getUserById, login, logout, register } from "../controllers/user.js";
import { isAuthenticated, isAuthenticatedSuperAdmin } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.post('/register', upload.single('profileImage'), register);
router.post("/login", login);
router.get("/logout", logout);
router.delete("/admin/delete-user/:id", isAuthenticatedSuperAdmin, deleteUserById);
router.get("/getUserById/:userId", getUserById);


export default router;
