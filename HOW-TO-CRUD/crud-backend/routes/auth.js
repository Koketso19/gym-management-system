// ================================================================
// routes/auth.js - Using YOUR JWT utilities
// ================================================================

const express = require("express");
const router = express.Router();
const moment = require("moment");

// ---- YOUR EXISTING JWT UTILITIES ----
const generateToken = require("../utils/generateToken");
const { verifyToken } = require("../middleware/authMiddleware");

// ---- YOUR CLASS USER LIBRARIES ----
const UserLib = require("../lib/classUser");
const LogLib = require("../lib/classLogging");
const ParamLib = require("../lib/classParam");

// ---- INITIALIZE ----
const user = new UserLib();
const log = new LogLib();
const param = new ParamLib();

// ================================================================
// HELPER: Build User Data for Token
// ================================================================

// routes/auth.js - Update buildUserPayload

async function buildUserPayload(UserData) {
    let UserPriv = [];
    let UserGroup = UserData.UserGroup || [];

    try {
        // Get privileges from groups
        const Resp = await param.Find({
            ParameterName: "UserGroupSettings",
            "Fields.GroupName": { $in: UserGroup }
        });

        console.log("📊 Param Find result:", Resp);

        if (Resp && Resp.Params) {
            for (let Param of Resp.Params) {
                let GroupFunctions = Param.Fields?.GroupFunctions || [];
                for (let func of GroupFunctions) {
                    if (UserPriv.indexOf(func) < 0) {
                        UserPriv.push(func);
                    }
                }
            }
        }
    } catch (err) {
        console.log("⚠️ Error getting privileges:", err.message);
        // Continue with empty privileges
    }

    return {
        userId: UserData._id,
        username: UserData.UserID,
        firstName: UserData.FirstName,
        lastName: UserData.LastName,
        groups: UserGroup,
        privileges: UserPriv
    };
}
// ================================================================
// POST /api/auth/login
// ================================================================

router.post("/api/auth/login", async function (req, res) {
 console.log("Login request received:", req.body);
    try {
        const { username, password } = req.body;

        console.log("Login attempt:", { username });

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Find user
        const userResult = await user.FindOneRec({ UserID: username.toLowerCase() });
        const User = userResult.Rec;

        if (!User) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Verify password
        const valid = await User.verifyPassword(password);
        if (!valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Check if password needs confirmation
        if (!User.ConfirmedPassword) {
            return res.json({
                success: true,
                requiresPasswordChange: true,
                message: "Password change required",
                username: User.UserID
            });
        }

        // ---- BUILD PAYLOAD FOR TOKEN ----
        const payload = await buildUserPayload(User);

        // ---- USE YOUR EXISTING generateToken ----
        const token = generateToken(payload);

        // Update last login
        User.LastLogin = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
        await user.UpdateUser(User);

        // Log login
        await log.WriteUserTrToDB(
            param,
            "Login",
            User.UserID,
            `User ${User.UserID} logged in`,
            User.UserID
        );
console.log("Login successful:", User);
        res.json({
            success: true,
            message: "Login successful",
            token: token,
            expiresIn: "7d",
            user: {
                username: User.UserID,
                firstName: User.FirstName,
                lastName: User.LastName,
                groups: User.UserGroup || [],
                privileges: payload.privileges || []
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/auth/register
// ================================================================

router.post("/api/auth/register", async function (req, res) {
    try {
        const { username, password, firstName, lastName } = req.body;

        if (!username || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if user exists
        const existingUser = await user.FindOneRec({ UserID: username.toLowerCase() });
        if (existingUser.Rec) {
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }

        // Create user
        const UserData = {
            UserID: username.toLowerCase(),
            FirstName: firstName,
            LastName: lastName,
            Password: password,
            UserGroup: ["user"],
            ConfirmedPassword: true,
            LastLogin: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        };

        const result = await user.New(UserData);

        if (result.Err) {
            return res.status(500).json({
                success: false,
                message: "Failed to create user",
                error: result.Err.message
            });
        }

        // Get new user
        const newUserResult = await user.FindOneRec({ UserID: username.toLowerCase() });
        const NewUser = newUserResult.Rec;

        // Build payload
        const payload = await buildUserPayload(NewUser);

        // ---- USE YOUR EXISTING generateToken ----
        const token = generateToken(payload);

        // Log registration
        await log.WriteUserTrToDB(
            param,
            "Register",
            NewUser.UserID,
            `New user ${NewUser.UserID} registered`,
            "SYSTEM"
        );

        res.json({
            success: true,
            message: "Registration successful",
            token: token,
            expiresIn: "7d",
            user: {
                username: NewUser.UserID,
                firstName: NewUser.FirstName,
                lastName: NewUser.LastName,
                groups: NewUser.UserGroup || [],
                privileges: payload.privileges || []
            }
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/auth/validate-password
// ================================================================

router.post("/api/auth/validate-password", async function (req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Find user
        const userResult = await user.FindOneRec({ UserID: username.toLowerCase() });
        const User = userResult.Rec;

        if (!User) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update password
        User.ConfirmedPassword = true;
        User.Password = password;

        await user.UpdateUser(User);

        // Log password change
        await log.WriteUserTrToDB(
            param,
            "ValidatePassword",
            User.UserID,
            `User ${User.UserID} validated their password`,
            User.UserID
        );

        // Build payload
        const payload = await buildUserPayload(User);

        // ---- USE YOUR EXISTING generateToken ----
        const token = generateToken(payload);

        res.json({
            success: true,
            message: "Password validated successfully",
            token: token,
            expiresIn: "7d",
            user: {
                username: User.UserID,
                firstName: User.FirstName,
                lastName: User.LastName,
                groups: User.UserGroup || [],
                privileges: payload.privileges || []
            }
        });

    } catch (err) {
        console.error("Validate password error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// GET /api/auth/me - Get current user (USING YOUR verifyToken)
// ================================================================

router.get("/api/auth/me", verifyToken, async function (req, res) {
    try {
        // req.user comes from your verifyToken middleware
        res.json({
            success: true,
            user: req.user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/auth/refresh - Refresh token (USING YOUR verifyToken)
// ================================================================

router.post("/api/auth/refresh", verifyToken, async function (req, res) {
    try {
        // Get fresh user data
        const userResult = await user.FindOneRec({ UserID: req.user.username });
        const User = userResult.Rec;

        if (!User) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Build new payload
        const payload = await buildUserPayload(User);

        // ---- USE YOUR EXISTING generateToken ----
        const token = generateToken(payload);

        res.json({
            success: true,
            token: token,
            expiresIn: "7d"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Refresh failed",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/auth/logout
// ================================================================

router.post("/api/auth/logout", async function (req, res) {
    res.json({
        success: true,
        message: "Logout successful"
    });
});

module.exports = router;