// ================================================================
// routes/room.js - Room Management Routes (JWT + React)
// ================================================================

const express = require("express");
const router = express.Router();
const moment = require("moment");

// ---- JWT MIDDLEWARE ----
const { verifyToken } = require("../middleware/authMiddleware");

// ---- CLASS LIBRARIES ----
const RoomLib = require("../lib/classRoom");
const PropertyLib = require("../lib/classProperty");
const LogLib = require("../lib/classLogging");
const ParamLib = require("../lib/classParam");

// ---- INITIALIZE ----
const room = new RoomLib();
const property = new PropertyLib();
const log = new LogLib();
const param = new ParamLib();

// ================================================================
// GET /api/rooms - Get all rooms
// ================================================================
router.get("/api/rooms", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        console.log("📋 Get all rooms for:", loggedInUser);

        const result = await room.FindAsync({});

        res.json({
            success: true,
            count: result.Result?.length || 0,
            rooms: result.Result || []
        });

    } catch (err) {
        console.error("❌ Get rooms error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/DTGetRoomData - DataTables endpoint
// ================================================================
router.post("/api/DTGetRoomData", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        console.log("📋 DataTables request for rooms");

        if (req.body && req.body.customFilter) {
            const customFilter = JSON.parse(req.body.customFilter);

            if (Object.keys(customFilter).length !== 0) {
                const searchStr = {};

                if (customFilter.propertyId && customFilter.propertyId.trim() !== "") {
                    searchStr.propertyId = customFilter.propertyId;
                }
                if (customFilter.number && customFilter.number.trim() !== "") {
                    searchStr.number = new RegExp(customFilter.number, "i");
                }
                if (customFilter.type && customFilter.type.trim() !== "") {
                    searchStr.type = new RegExp(customFilter.type, "i");
                }
                if (customFilter.occupied !== undefined) {
                    searchStr.occupied = customFilter.occupied;
                }

                room.DtGetSearchedData(req, loggedInUser, searchStr, function (Resp) {
                    res.send(Resp);
                });
            } else {
                room.DtGetRoomData(req, loggedInUser, function (Resp) {
                    res.send(Resp);
                });
            }
        } else {
            room.DtGetRoomData(req, loggedInUser, function (Resp) {
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
// GET /api/rooms/property/:propertyId - Get rooms by property
// ================================================================
router.get("/api/rooms/property/:propertyId", verifyToken, async function (req, res) {
    try {
        const { propertyId } = req.params;
        console.log("📋 Get rooms for property:", propertyId);

        const result = await room.FindByPropertyAsync(propertyId);

        res.json({
            success: true,
            count: result.Result?.length || 0,
            rooms: result.Result || []
        });

    } catch (err) {
        console.error("❌ Get rooms error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// GET /api/rooms/available/:propertyId - Get available rooms
// ================================================================
router.get("/api/rooms/available/:propertyId", verifyToken, async function (req, res) {
    try {
        const { propertyId } = req.params;
        console.log("📋 Get available rooms for:", propertyId);

        const result = await room.FindAvailableAsync(propertyId);

        res.json({
            success: true,
            count: result.Result?.length || 0,
            rooms: result.Result || []
        });

    } catch (err) {
        console.error("❌ Get available rooms error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// GET /api/rooms/:id - Get single room
// ================================================================
router.get("/api/rooms/:id", verifyToken, async function (req, res) {
    try {
        const { id } = req.params;
        console.log("📋 Get room:", id);

        const result = await room.FindOneAsync({ _id: id });

        if (!result.Result) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.json({
            success: true,
            room: result.Result
        });

    } catch (err) {
        console.error("❌ Get room error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/rooms - Create new room
// ================================================================
router.post("/api/rooms", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        console.log("📝 Create room:", req.body);

        const { propertyId, number, type, rent, features } = req.body;

        // Validate
        if (!propertyId || !number || !rent) {
            return res.status(400).json({
                success: false,
                message: "propertyId, number, and rent are required"
            });
        }

        // Verify property exists
        const propResult = await property.FindOneAsync({ _id: propertyId });
        if (!propResult.Result) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Build
        const RoomData = {
            propertyId: propertyId,
            number: number,
            type: type || "Double",
            rent: rent,
            occupied: false,
            clientId: null,
            features: features || []
        };

        // Create
        const result = await room.NewAsync(RoomData);

        if (result.Err) {
            return res.status(500).json({
                success: false,
                message: "Failed to create room",
                error: result.Err.message
            });
        }

        // Log
        await log.WriteUserTrToDB(
            param,
            "CreateRoom",
            loggedInUser,
            `Created room ${number} for property ${propertyId}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Room created successfully",
            room: result.SavedDoc
        });

    } catch (err) {
        console.error("❌ Create room error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// PUT /api/rooms/:id - Update room
// ================================================================
router.put("/api/rooms/:id", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        const { id } = req.params;
        console.log("📝 Update room:", id);

        const result = await room.FindOneAsync({ _id: id });
        if (!result.Result) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const Room = result.Result;

        // Update
        if (req.body.number) Room.number = req.body.number;
        if (req.body.type) Room.type = req.body.type;
        if (req.body.rent !== undefined) Room.rent = req.body.rent;
        if (req.body.occupied !== undefined) Room.occupied = req.body.occupied;
        if (req.body.clientId !== undefined) Room.clientId = req.body.clientId;
        if (req.body.features) Room.features = req.body.features;

        const updateResult = await room.UpdateAsync(Room);

        if (updateResult.Error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update room",
                error: updateResult.Error
            });
        }

        await log.WriteUserTrToDB(
            param,
            "UpdateRoom",
            loggedInUser,
            `Updated room: ${id}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Room updated successfully",
            room: Room
        });

    } catch (err) {
        console.error("❌ Update room error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/rooms/:id/assign - Assign client to room
// ================================================================
router.post("/api/rooms/:id/assign", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        const { id } = req.params;
        const { clientId } = req.body;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: "clientId is required"
            });
        }

        console.log("👤 Assign client", clientId, "to room", id);

        const result = await room.AssignClientAsync(id, clientId);

        if (result.Error) {
            return res.status(500).json({
                success: false,
                message: result.Error
            });
        }

        await log.WriteUserTrToDB(
            param,
            "AssignClient",
            loggedInUser,
            `Assigned client ${clientId} to room ${id}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Client assigned successfully"
        });

    } catch (err) {
        console.error("❌ Assign client error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// POST /api/rooms/:id/vacate - Vacate room
// ================================================================
router.post("/api/rooms/:id/vacate", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        const { id } = req.params;
        console.log("🚪 Vacate room:", id);

        const result = await room.VacateRoomAsync(id);

        if (result.Error) {
            return res.status(500).json({
                success: false,
                message: result.Error
            });
        }

        await log.WriteUserTrToDB(
            param,
            "VacateRoom",
            loggedInUser,
            `Vacated room: ${id}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Room vacated successfully"
        });

    } catch (err) {
        console.error("❌ Vacate room error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// ================================================================
// DELETE /api/rooms/:id - Delete room
// ================================================================
router.delete("/api/rooms/:id", verifyToken, async function (req, res) {
    try {
        const loggedInUser = req.user.username;
        const { id } = req.params;
        console.log("🗑️ Delete room:", id);

        const result = await room.DeleteOneAsync(id);

        if (result.Error) {
            return res.status(404).json({
                success: false,
                message: result.Error
            });
        }

        await log.WriteUserTrToDB(
            param,
            "DeleteRoom",
            loggedInUser,
            `Deleted room: ${id}`,
            loggedInUser
        );

        res.json({
            success: true,
            message: "Room deleted successfully"
        });

    } catch (err) {
        console.error("❌ Delete room error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

module.exports = router;