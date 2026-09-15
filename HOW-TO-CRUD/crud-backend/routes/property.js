// ================================================================
// routes/property.js - Property Management Routes (JWT + React)
// ================================================================

const express = require("express");
const router = express.Router();
const moment = require("moment");

// ---- JWT MIDDLEWARE ----
const { verifyToken } = require("../middleware/authMiddleware");

// ---- CLASS LIBRARIES ----
const PropertyLib = require("../lib/classProperty");
const LogLib = require("../lib/classLogging");
const ParamLib = require("../lib/classParam");

// ---- INITIALIZE ----
const property = new PropertyLib();
const log = new LogLib();
const param = new ParamLib();

// ================================================================
// GET /api/properties - Get all properties
// ================================================================
router.get("/api/properties", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        console.log("📋 Get all properties for:", loggedInUser);

        const result = await property.FindAsync({});

        if (result.Error) {
            return res.status(500).json({
                success: false,
                message: "Failed to get properties",
                error: result.Error
            });
        }

        res.json({
            success: true,
            count: result.Result?.length || 0,
            properties: result.Result || []
        });

    } catch (err) {
        console.error("❌ Get properties error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/DTGetPropertyData - DataTables endpoint (React)
// ================================================================
router.post("/api/DTGetPropertyData", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        console.log("📋 DataTables request for properties");

        // Check if custom filter is provided
        if (req.body && req.body.customFilter) {
            const customFilter = JSON.parse(req.body.customFilter);

            if (Object.keys(customFilter).length !== 0) {
                const searchStr = {};

                if (customFilter.name && customFilter.name.trim() !== "") {
                    searchStr.name = new RegExp(customFilter.name, "i");
                }
                if (customFilter.location && customFilter.location.trim() !== "") {
                    searchStr.location = new RegExp(customFilter.location, "i");
                }
                if (customFilter.type && customFilter.type.trim() !== "") {
                    searchStr.type = customFilter.type;
                }
                if (customFilter.status && customFilter.status.trim() !== "") {
                    searchStr.status = customFilter.status;
                }

                property.DtGetSearchedData(req, loggedInUser, searchStr, function (Resp) {
                    res.send(Resp);
                });
            } else {
                property.DtGetPropertyData(req, loggedInUser, function (Resp) {
                    res.send(Resp);
                });
            }
        } else {
            property.DtGetPropertyData(req, loggedInUser, function (Resp) {
                res.send(Resp);
            });
        }

    } catch (err) {
        console.error("❌ DataTables error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// GET /api/properties/:id - Get single property
// ================================================================
router.get("/api/properties/:id", verifyToken, async function (req, res) {
    try {
        const { id } = req.params;


        
        console.log("📋 Get property:", id);

        const result = await property.FindOneAsync({ _id: id });

        if (!result.Result) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.json({
            success: true,
            property: result.Result
        });

    } catch (err) {
        console.error("❌ Get property error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/properties - Create new property
// ================================================================
router.post("/api/properties", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        console.log("📝 Create property:", req.body);

        const {
            _id,
            name,
            location,
            type,
            description,
            phone,
            email,
            amenities,
            images,
            status
        } = req.body;

        // Validate
        if (!_id || !name || !location) {
            return res.status(400).json({
                success: false,
                message: "_id, name, and location are required"
            });
        }

        // Check if exists
        const existing = await property.FindOneAsync({ _id: _id });
        if (existing.Result) {
            return res.status(400).json({
                success: false,
                message: "Property with this _id already exists"
            });
        }

        // Build
        const PropertyData = {
            _id: _id,
            name: name,
            location: location,
            type: type || "GuestHouse",
            description: description || "",
            phone: phone || "",
            email: email || "",
            amenities: amenities || [],
            images: images || [],
            status: status || "Active",
            createdAt: new Date()
        };

        // Create
        const result = await property.NewAsync(PropertyData);

        if (result.Err) {
            return res.status(500).json({
                success: false,
                message: "Failed to create property",
                error: result.Err.message
            });
        }

        // Log action
        await log.WriteUserTrToDB(
            param,
            "CreateProperty",
            loggedInUser,
            `Created property: ${name} (${_id})`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Property created successfully",
            property: result.SavedDoc
        });

    } catch (err) {
        console.error("❌ Create property error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// PUT /api/properties/:id - Update property
// ================================================================
router.put("/api/properties/:id", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        const { id } = req.params;
        console.log("📝 Update property:", id);

        const result = await property.FindOneAsync({ _id: id });
        if (!result.Result) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const Property = result.Result;

        // Update
        if (req.body.name) Property.name = req.body.name;
        if (req.body.location) Property.location = req.body.location;
        if (req.body.type) Property.type = req.body.type;
        if (req.body.description !== undefined) Property.description = req.body.description;
        if (req.body.phone !== undefined) Property.phone = req.body.phone;
        if (req.body.email !== undefined) Property.email = req.body.email;
        if (req.body.amenities) Property.amenities = req.body.amenities;
        if (req.body.images) Property.images = req.body.images;
        if (req.body.status) Property.status = req.body.status;

        const updateResult = await property.UpdateAsync(Property);

        if (updateResult.Error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update property",
                error: updateResult.Error
            });
        }

        // Log
        await log.WriteUserTrToDB(
            param,
            "UpdateProperty",
            loggedInUser,
            `Updated property: ${id}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Property updated successfully",
            property: Property
        });

    } catch (err) {
        console.error("❌ Update property error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// DELETE /api/properties/:id - Delete property
// ================================================================
router.delete("/api/properties/:id", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        const { id } = req.params;
        console.log("🗑️ Delete property:", id);

        const result = await property.DeleteOneAsync(id);

        if (result.Error) {
            return res.status(404).json({
                success: false,
                message: result.Error
            });
        }

        await log.WriteUserTrToDB(
            param,
            "DeleteProperty",
            loggedInUser,
            `Deleted property: ${id}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Property deleted successfully"
        });

    } catch (err) {
        console.error("❌ Delete property error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;