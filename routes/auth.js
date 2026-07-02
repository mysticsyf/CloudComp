const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const upload = require("../config/multer");

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

        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        const user = rows[0];

        // =========================
        // SESSION CREATED HERE
        // =========================
        req.session.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar || null,
            created_at: user.created_at,
            phone: user.phone || null
        };

        return res.json({
            success: true,
            message: "Registration successful",
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar || null,
                created_at: user.created_at,
                phone: user.phone || null
            }
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
            email: user.email,
            role: user.role,
            avatar: user.avatar || null,
            created_at: user.created_at,
            phone: user.phone || null
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
                email: user.email,
                role: user.role,
                avatar: user.avatar || null,
                created_at: user.created_at,
                phone: user.phone || null
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

router.post("/upload-avatar", upload.single("avatar"), async(req,res)=>{
    if(!req.session.user){
        return res.json({
            success:false,
            message:"Please login."
        });
    }

    const avatar="/uploads/avatars/"+req.file.filename;

    await req.db.query(
        "UPDATE users SET avatar=? WHERE id=?",
        [
            avatar,
            req.session.user.id
        ]
    );

    req.session.user.avatar=avatar;

    res.json({
        success:true,
        avatar
    });

});

router.put("/profile", async (req, res) => {
    if (!req.session.user) {
        return res.json({
            success: false,
            message: "Not logged in"
        });
    }

    const { username, email, phone } = req.body;
    const userId = req.session.user.id;

    try {
         const [existing] = await req.db.query(
            `SELECT id FROM users 
             WHERE (username = ? OR email = ?) 
             AND id != ?`,
            [username, email, userId]
        );

        if (existing.length > 0) {
            return res.json({
                success: false,
                message: "Username or Email already exists"
            });
        }

        await req.db.query(
            `UPDATE users 
             SET username=?, email=?, phone=? 
             WHERE id=?`,
            [
                username,
                email,
                phone,
                req.session.user.id
            ]
        );

        // update session too
        req.session.user.username = username;
        req.session.user.email = email;
        req.session.user.phone = phone;

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            message: "Database error"
        });
    }
});

router.post("/change-password", async (req, res) => {

    if (!req.session.user) {
        return res.json({
            success: false,
            message: "Not logged in"
        });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    try {

        // get user password from DB
        const [rows] = await req.db.query(
            "SELECT password FROM users WHERE id=?",
            [userId]
        );

        const user = rows[0];

        // 🔐 hash current password and compare
        const hashedCurrent = hashPassword(currentPassword);

        if (hashedCurrent !== user.password) {
            return res.json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // 🔐 hash new password
        const hashedNew = hashPassword(newPassword);

        // update DB
        await req.db.query(
            "UPDATE users SET password=? WHERE id=?",
            [hashedNew, userId]
        );

        res.json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            message: "Server error"
        });
    }
});

router.get("/addresses", async (req, res) => {

    if (!req.session.user) return res.json([]);

    const [rows] = await req.db.query(
        "SELECT * FROM user_addresses WHERE user_id=?",
        [req.session.user.id]
    );

    res.json(rows);
});

router.post("/addresses", async (req, res) => {

    if (!req.session.user) {
        return res.json({ success: false });
    }

    const { address } = req.body;

    await req.db.query(
        "INSERT INTO user_addresses (user_id, address) VALUES (?, ?)",
        [req.session.user.id, address]
    );

    res.json({ success: true });
});

router.delete("/addresses/:id", async (req, res) => {

    const id = req.params.id;

    await req.db.query(
        "DELETE FROM user_addresses WHERE id=? AND user_id=?",
        [id, req.session.user.id]
    );

    res.json({ success: true });
});

router.get("/vendor-profile", async (req, res) => {

    if (!req.session.user) {
        return res.json({
            success:false
        });
    }

    const [rows] = await req.db.query(
        "SELECT * FROM vendor_profiles WHERE user_id=?",
        [req.session.user.id]
    );

    if(rows.length===0){
        return res.json({
            success:true,
            vendor:{}
        });
    }

    res.json({
        success:true,
        vendor:rows[0]
    });

});

router.put("/vendor-profile", async (req,res)=>{
    if(!req.session.user){
        return res.json({
            success:false,
            message:"Not logged in."
        });
    }

    const {
        storeName,
        businessRegNo,
        address,
        description
    } = req.body;

    const userId = req.session.user.id;

    // Check if another vendor already uses this registration number
    const [duplicate] = await req.db.query(
        `SELECT id
         FROM vendor_profiles
         WHERE business_registration_no=?
         AND user_id<>?`,
        [
            businessRegNo,
            userId
        ]
    );

    if(duplicate.length){
        return res.json({
            success:false,
            message:"Business Registration Number already exists."
        });
    }

    const [existing] = await req.db.query(
        "SELECT id FROM vendor_profiles WHERE user_id=?",
        [userId]
    );

    if(existing.length){
        await req.db.query(
            `UPDATE vendor_profiles
             SET
                store_name=?,
                business_registration_no=?,
                address=?,
                description=?
             WHERE user_id=?`,
            [
                storeName,
                businessRegNo,
                address,
                description,
                userId
            ]
        );
    }else{
        await req.db.query(
            `INSERT INTO vendor_profiles
            (
                user_id,
                store_name,
                business_registration_no,
                address,
                description
            )
            VALUES(?,?,?,?,?)`,
            [
                userId,
                storeName,
                businessRegNo,
                address,
                description
            ]
        );
    }
    res.json({
        success:true,
        message:"Store information saved successfully."
    });
});

module.exports = router;