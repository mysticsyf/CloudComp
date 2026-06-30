const express = require("express");
const router = express.Router();
const crypto = require("crypto");

//hash password function
function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

router.post("/register", async (req, res) => {

    const db = req.db;

    const { username, name, email, password, role } = req.body;

    try {
        const cleanRole = role?.trim();
        // =========================
        // 1. Validate input (IMPORTANT)
        // =========================
        if (!username || !name || !email || !password || !cleanRole) {
            return res.json({
                success: false,
                message: "Please fill in all fields"
            });
        }

        const hashedPassword = hashPassword(password);

        // =========================
        // 2. Check existing user
        // =========================
        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            [email, username]
        );

        if (existing.length > 0) {
            return res.json({
                success: false,
                message: "Email or Username already exists"
            });
        }

        // =========================
        // 3. Insert user
        // =========================
        await db.query(
            `INSERT INTO users (username, name, email, password, role)
             VALUES (?, ?, ?, ?, ?)`,
            [username, name, email, hashedPassword, cleanRole]
        );

        return res.json({
            success: true,
            message: "Registration successful"
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;