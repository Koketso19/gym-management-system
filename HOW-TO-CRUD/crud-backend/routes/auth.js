// ================================================================
// routes/auth.js - Using YOUR JWT utilities
// ================================================================

const express = require("express");
const router = express.Router();
const moment = require("moment");

// ---- YOUR EXISTING JWT UTILITIES ----
const generateToken = require("../utils/generateToken");
const { verifyToken, requirePrivilege } = require("../middleware/authMiddleware");

// ---- YOUR CLASS USER LIBRARIES ----
const UserLib   = require("../lib/classUser");
const ClientLib = require("../lib/classClient");
const LogLib    = require("../lib/classLogging");
const ParamLib  = require("../lib/classParam");

// ---- INITIALIZE ----
const user   = new UserLib();
const client = new ClientLib();
const log    = new LogLib();
const param  = new ParamLib();

// ---- ROLES MAP ----
const ADMIN_GROUPS  = ['Administrators'];
const MEMBER_GROUPS = ['Users', 'Members'];

// ================================================================
// HELPER: Build User Data for Token
// ================================================================
async function buildUserPayload(UserData) {
  let UserPriv = [];
  let UserGroup = UserData.UserGroup || [];

  // Determine role from UserGroup
  let role = 'member';
  if (UserGroup.some((g) => ADMIN_GROUPS.includes(g))) {
    role = 'admin';
  } else if (UserGroup.some((g) => MEMBER_GROUPS.includes(g))) {
    role = 'member';
  }

  // Lookup privileges from param
  try {
    const Resp = await param.Find({
      ParameterName: "UserGroupSettings",
      "Fields.GroupName": { $in: UserGroup }
    });

    console.log("📊 Param Find:", Resp?.Params?.length || 0, "group(s) matched");

    if (Resp && Resp.Params) {
      for (let Param of Resp.Params) {
        const GroupFunctions = Param.Fields?.GroupFunctions || [];
        for (const func of GroupFunctions) {
          if (UserPriv.indexOf(func) < 0) {
            UserPriv.push(func);
          }
        }
      }
    }
  } catch (err) {
    console.log("⚠️ Error getting privileges:", err.message);
  }

  return {
    userId: UserData._id,
    username: UserData.UserID,
    firstName: UserData.FirstName,
    lastName: UserData.LastName,
    role,
    groups: UserGroup,
    privileges: UserPriv,
    gymId: UserData.gymId || 'iron_temple_001'
  };
}

// ================================================================
// POST /api/auth/login
// Checks SysUsers first, then Clients. Returns role + privileges.
// ================================================================
router.post("/api/auth/login", async function (req, res) {
  console.log("Login request received:", req.body);

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const uid = username.toLowerCase();
    console.log("Login attempt:", { username: uid });

    // ---- 1. Try SysUsers first (admin/staff) ----
    let User = null;
    let isClient = false;

    const userResult = await user.FindOneRec({ UserID: uid });
    if (userResult.Rec) {
      User = userResult.Rec;
    } else {
      // ---- 2. Fallback to Clients (gym member) ----
      const clientResult = await client.FindOneRec({ UserID: uid });
      if (clientResult.Rec) {
        User = clientResult.Rec;
        isClient = true;
      }
    }

    if (!User) {
      console.log("❌ User not found:", uid);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // ---- 3. Verify password ----
    const valid = await User.verifyPassword(password);
    if (!valid) {
      console.log("❌ Bad password for:", uid);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // ---- 4. Password change required (admins only) ----
    if (!isClient && !User.ConfirmedPassword) {
      return res.json({
        success: true,
        requiresPasswordChange: true,
        message: "Password change required",
        username: User.UserID
      });
    }

    // ---- 5. Ensure clients have a UserGroup ----
    if (isClient && (!User.UserGroup || User.UserGroup.length === 0)) {
      User.UserGroup = ['Users'];
    }

    // ---- 6. Build payload ----
    const payload = await buildUserPayload(User);

    // ---- 7. Sign token ----
    const token = generateToken(payload);

    // ---- 8. Update last login (admins only) ----
    if (!isClient) {
      User.LastLogin = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      await user.UpdateUser(User);
    }

    // ---- 9. Audit log ----
    try {
      await log.WriteUserTrToDB(
        param,
        "Login",
        User.UserID,
        `${payload.role} ${User.UserID} logged in`,
        User.UserID
      );
    } catch (logErr) {
      console.log("⚠️ Log write failed:", logErr.message);
    }

    console.log(
      `✅ Login: ${User.UserID} (${payload.role}) — ${payload.privileges.length} privileges`
    );

    // ---- 10. Respond ----
    res.json({
      success: true,
      message: "Login successful",
      token,
      expiresIn: "7d",
      role: payload.role,
      user: {
        username: User.UserID,
        firstName: User.FirstName,
        lastName: User.LastName,
        email: User.email || null,
        phone: User.phone || null,
        groups: payload.groups,
        privileges: payload.privileges,
        gymId: payload.gymId
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
// (admin-only creation via /api/users/create — this stays public for dev)
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

    const existingUser = await user.FindOneRec({ UserID: username.toLowerCase() });
    if (existingUser.Rec) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    const UserData = {
      UserID: username.toLowerCase(),
      FirstName: firstName,
      LastName: lastName,
      Password: password,
      UserGroup: ["Users"],
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

    const newUserResult = await user.FindOneRec({ UserID: username.toLowerCase() });
    const NewUser = newUserResult.Rec;
    const payload = await buildUserPayload(NewUser);
    const token = generateToken(payload);

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
      token,
      expiresIn: "7d",
      role: payload.role,
      user: {
        username: NewUser.UserID,
        firstName: NewUser.FirstName,
        lastName: NewUser.LastName,
        groups: payload.groups,
        privileges: payload.privileges,
        gymId: payload.gymId
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

    const userResult = await user.FindOneRec({ UserID: username.toLowerCase() });
    const User = userResult.Rec;

    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    User.ConfirmedPassword = true;
    User.Password = password;

    await user.UpdateUser(User);

    await log.WriteUserTrToDB(
      param,
      "ValidatePassword",
      User.UserID,
      `User ${User.UserID} validated their password`,
      User.UserID
    );

    const payload = await buildUserPayload(User);
    const token = generateToken(payload);

    res.json({
      success: true,
      message: "Password validated successfully",
      token,
      expiresIn: "7d",
      role: payload.role,
      user: {
        username: User.UserID,
        firstName: User.FirstName,
        lastName: User.LastName,
        groups: payload.groups,
        privileges: payload.privileges,
        gymId: payload.gymId
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
// GET /api/auth/me
// ================================================================
router.get("/api/auth/me", verifyToken, async function (req, res) {
  try {
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
// POST /api/auth/refresh
// ================================================================
router.post("/api/auth/refresh", verifyToken, async function (req, res) {
  try {
    // Try admin first
    let User = null;
    let isClient = false;

    const userResult = await user.FindOneRec({ UserID: req.user.username });
    if (userResult.Rec) {
      User = userResult.Rec;
    } else {
      const clientResult = await client.FindOneRec({ UserID: req.user.username });
      if (clientResult.Rec) {
        User = clientResult.Rec;
        isClient = true;
      }
    }

    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (isClient && (!User.UserGroup || User.UserGroup.length === 0)) {
      User.UserGroup = ['Users'];
    }

    const payload = await buildUserPayload(User);
    const token = generateToken(payload);

    res.json({
      success: true,
      token,
      expiresIn: "7d",
      role: payload.role
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

// ================================================================
// USERS MANAGEMENT (admin-only)
// ================================================================

// ---- GET /api/users/list ----
router.get("/api/users/list", verifyToken, requirePrivilege('ManageUsers'), async function (req, res) {
  console.log("GET /api/users/list — user:", req.user?.username);
  try {
    const result = await user.Find({});
    const users = (result.UserArr || []).map((u) => ({
      _id: u._id,
      UserID: u.UserID,
      FirstName: u.FirstName,
      LastName: u.LastName,
      UserGroup: u.UserGroup || [],
      CreateDate: u.CreateDate,
      LastUpdate: u.LastUpdate,
      LastUpdateUser: u.LastUpdateUser
    }));
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/users/create ----
router.post("/api/users/create", verifyToken, requirePrivilege('ManageUsers'), async function (req, res) {
  console.log("POST /api/users/create", req.body);
  try {
    const { username, password, firstName, lastName, userGroup } = req.body;

    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await user.FindOneRec({ UserID: username.toLowerCase() });
    if (existing.Rec) {
      return res.status(400).json({ success: false, message: "UserID already exists" });
    }

    const UserData = {
      UserID: username.toLowerCase(),
      FirstName: firstName,
      LastName: lastName,
      Password: password,
      ConfirmedPassword: true,
      UserGroup: Array.isArray(userGroup) && userGroup.length ? userGroup : ["Administrators"]
    };

    const result = await user.New(UserData);
    if (result.Err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
        error: result.Err.message
      });
    }

    await log.WriteUserTrToDB(
      param, "CreateUser", req.user.username,
      `Created user ${username}`, req.user.username
    );

    res.json({ success: true, message: "User created successfully", user: result.SavedDoc });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/users/update ----
router.post("/api/users/update", verifyToken, requirePrivilege('ManageUsers'), async function (req, res) {
  console.log("POST /api/users/update", req.body);
  try {
    const { id, firstName, lastName, userGroup, password } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "User ID required" });

    const result = await user.FindOneRec({ _id: id });
    if (!result.Rec) return res.status(404).json({ success: false, message: "User not found" });

    const Rec = result.Rec;
    if (firstName) Rec.FirstName = firstName;
    if (lastName)  Rec.LastName  = lastName;
    if (Array.isArray(userGroup) && userGroup.length) Rec.UserGroup = userGroup;
    if (password)  Rec.Password  = password;

    Rec.LastUpdate = moment().format("YYYY-MM-DD HH:mm:ss");
    Rec.LastUpdateUser = req.user.username;

    const saved = await user.UpdateUser(Rec);
    if (!saved.SavedDoc) {
      return res.status(500).json({ success: false, message: "Failed to update user" });
    }

    await log.WriteUserTrToDB(
      param, "UpdateUser", req.user.username,
      `Updated user ${Rec.UserID}`, req.user.username
    );

    res.json({ success: true, message: "User updated", user: saved.SavedDoc });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/users/delete ----
router.post("/api/users/delete", verifyToken, requirePrivilege('ManageUsers'), async function (req, res) {
  console.log("POST /api/users/delete", req.body);
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "User ID required" });

    const result = await user.FindOneRec({ _id: id });
    if (!result.Rec) return res.status(404).json({ success: false, message: "User not found" });

    if (result.Rec.UserID === 'admin') {
      return res.status(400).json({ success: false, message: "Cannot delete admin user" });
    }
    if (result.Rec.UserID === req.user.username) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    const del = await user.DeleteUser({ _id: id });

    await log.WriteUserTrToDB(
      param, "DeleteUser", req.user.username,
      `Deleted user ${result.Rec.UserID}`, req.user.username
    );

    res.json({ success: true, message: "User deleted", result: del.DeleteResp });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;