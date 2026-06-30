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

//register route
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

        // =========================
        // SESSION CREATED HERE
        // =========================
        req.session.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
        };

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

//login route
router.post("/login", async (req, res) => {
    const db = req.db;
    const { email, password } = req.body;

    try {
        // =========================
        // 1. Validate input
        // =========================
        if (!email || !password) {
            return res.json({
                success: false,
                message: "Please enter email and password"
            });
        }

        // =========================
        // 2. Find user
        // =========================
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const user = rows[0];

        // =========================
        // 3. Compare password
        // =========================
        const hashedInput = hashPassword(password);

        if (hashedInput !== user.password) {
            return res.json({
                success: false,
                message: "Wrong password"
            });
        }

        // =========================
        // SESSION CREATED HERE
        // =========================
        req.session.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
        };

        // =========================
        // 4. Success
        // =========================
        return res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

//logout route
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

//get current user route
router.get("/current", (req, res) => {
    if (!req.session.user) {
        return res.json({ loggedIn: false });
    }

    res.json({
        loggedIn: true,
        user: req.session.user
    });
});

module.exports = router;