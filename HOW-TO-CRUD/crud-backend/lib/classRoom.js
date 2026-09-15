// ================================================================
// CLASS ROOM - Room Management Library
// ================================================================

const db = require("../db_schema/room");
const moment = require("moment");
const commonFuntions = require("../lib/commonFunctions");

// ---- REDIS - Comment out if not using ----
// const {
//   RedisUpsertObjectAsync,
//   RedisGetObjectAsync,
//   RedisDeleteObjectAsync,
// } = require("../services/cacheService");

// ================================================================
// HELPER: DataTables Search
// ================================================================

function _DtGetRoomData(req, loggedInUser, callback) {
    let searchStr = {};

    let strSearch = req.body["search[value]"];
    let strSort = req.body["order[0][column]"];
    let SortIndex = "columns[" + strSort + "][data]";
    let SortValue = req.body[SortIndex];
    let strSortDir = req.body["order[0][dir]"];
    let SortDir = -1;

    if (strSortDir == "asc") {
        SortDir = 1;
    }

    let strSysSort = '{"' + SortValue + '":' + SortDir + "}";
    let SysSort = JSON.parse(strSysSort);

    if (strSearch) {
        let regex = new RegExp(commonFuntions.escapeRegExp(strSearch), "i");

        let Filters = [
            { number: regex },
            { type: regex },
            { clientId: regex },
            { propertyId: regex },
        ];

        if (!isNaN(strSearch)) {
            Filters.push({ rent: Number(strSearch) });
        }

        searchStr = { $or: Filters };
    }

    db.countDocuments({}, function (err, c) {
        let recordsTotal = c;
        db.countDocuments(searchStr, function (err, c) {
            let recordsFiltered = c;
            db.find(
                searchStr,
                "propertyId number type rent occupied clientId features",
                {
                    skip: Number(req.body.start),
                    limit: Number(req.body.length),
                    sort: SysSort,
                },
                function (err, results) {
                    if (err) {
                        console.log("error while getting results" + err);
                        return callback(null);
                    }

                    let ListData = [];
                    let x = 0;
                    while (x < results.length) {
                        let mData = {
                            _id: results[x]._id,
                            propertyId: results[x].propertyId,
                            number: results[x].number,
                            type: results[x].type,
                            rent: results[x].rent,
                            occupied: results[x].occupied,
                            clientId: results[x].clientId,
                            features: results[x].features,
                        };

                        ListData.push(mData);
                        x++;
                    }

                    let data = JSON.stringify({
                        draw: req.body.draw,
                        recordsFiltered: recordsFiltered,
                        recordsTotal: recordsTotal,
                        data: ListData,
                    });

                    return callback(data);
                }
            );
        });
    });
} /* _DtGetRoomData */

// ================================================================
// HELPER: Create Record
// ================================================================

function _CreateRecord(Object, callback) {
    let Record = new db(Object);

    Record.save(function (err, savedDoc) {
        return callback({ Err: err, SavedDoc: savedDoc });
    });
} /* _CreateRecord */

// ================================================================
// MAIN EXPORT CLASS: Room
// ================================================================

module.exports = class Room {
    constructor() {}

    // ================================================================
    // DATATABLES METHODS
    // ================================================================

    DtGetRoomData(req, loggedInUser, callback) {
        _DtGetRoomData(req, loggedInUser, function (Resp) {
            return callback(Resp);
        });
    } /* DtGetRoomData */

    // ================================================================
    // CREATE METHODS
    // ================================================================

    New(Object, callback) {
        _CreateRecord(Object, function (Resp) {
            return callback(Resp);
        });
    } /* New */

    async NewAsync(Object) {
        try {
            const SavedDoc = await db.create(Object);
            return SavedDoc ? { SavedDoc: SavedDoc } : { SavedDoc: null };
        } catch (err) {
            return { Err: err };
        }
    }

    // ================================================================
    // DELETE METHODS
    // ================================================================

    Delete(KeyValuePair, callback) {
        db.remove(KeyValuePair, function (err, Resp) {
            if (err) {
                return callback({ Err: err });
            }
            return callback({ DeleteResp: Resp });
        });
    } /* Delete */

    DeleteRecord(KeyValuePair, callback) {
        db.deleteOne(KeyValuePair, function (err, Resp) {
            if (err) {
                return callback({ Err: err });
            }
            return callback({ DeleteResp: Resp });
        });
    } /* DeleteRecord */

    async DeleteOneAsync(roomId) {
        if (!roomId) {
            return null;
        }
        try {
            var deleteResult = await db.deleteOne({ _id: roomId });
            if (deleteResult.deletedCount === 0) {
                return { Error: "Room not found." };
            }
            return { Result: "success" };
        } catch (error) {
            return { Error: error.message };
        }
    }

    async DeleteByPropertyAsync(propertyId) {
        if (!propertyId) {
            return null;
        }
        try {
            var deleteResult = await db.deleteMany({ propertyId: propertyId });
            return { Result: "success", DeletedCount: deleteResult.deletedCount };
        } catch (error) {
            return { Error: error.message };
        }
    }

    // ================================================================
    // FIND METHODS
    // ================================================================

    Find(KeyValuePair, callback) {
        db.find(KeyValuePair, function (err, Arr) {
            if (err) {
                return callback({ Err: err });
            }
            if (Arr.length > 0) {
                return callback({ Arr: Arr });
            }
            return callback({ Arr: null });
        });
    } /* Find */

    FindOne(KeyValuePair, callback) {
        db.findOne(KeyValuePair, function (err, Rec) {
            if (err) {
                return callback({ Err: err });
            }
            if (!Rec) {
                return callback({ Rec: null });
            }
            return callback({ Rec: Rec });
        });
    } /* FindOne */

    async FindAsync(KeyValuePair) {
        try {
            var collection = await db.find(KeyValuePair);
            return { Result: collection };
        } catch (error) {
            return { Error: error.message };
        }
    } /* FindAsync */

    async FindOneAsync(KeyValuePair) {
        try {
            var collection = await db.findOne(KeyValuePair);
            return { Result: collection };
        } catch (error) {
            return { Error: error.message };
        }
    } /* FindOneAsync */

    // ================================================================
    // PROPERTY-SPECIFIC FIND METHODS
    // ================================================================

    async FindByPropertyAsync(propertyId) {
        try {
            var collection = await db.find({ propertyId: propertyId });
            return { Result: collection };
        } catch (error) {
            return { Error: error.message };
        }
    } /* FindByPropertyAsync */

    async FindAvailableAsync(propertyId) {
        try {
            var collection = await db.find({
                propertyId: propertyId,
                occupied: false,
            });
            return { Result: collection };
        } catch (error) {
            return { Error: error.message };
        }
    } /* FindAvailableAsync */

    // ================================================================
    // UPDATE METHODS
    // ================================================================

    Update(UpdateObject, callback) {
        if (!UpdateObject) {
            return callback({ SavedDoc: null });
        }

        UpdateObject.save(function (err, savedDoc) {
            return callback({ SavedDoc: savedDoc });
        });
    } /* Update */

    async UpdateAsync(UpdateObject) {
        if (!UpdateObject) {
            return null;
        }
        try {
            var updateResult = await UpdateObject.save();
            return { Result: "success" };
        } catch (error) {
            return { Error: error.message };
        }
    }

    async UpdateOneAsync(updateObject) {
        if (!updateObject) {
            return null;
        }
        try {
            const filter = { _id: updateObject._id };
            var result = await db.replaceOne(filter, updateObject);
            if (result.modifiedCount > 0) {
                return { Result: "success" };
            } else {
                return { Result: "failed" };
            }
        } catch (error) {
            return { Error: error.message };
        }
    }

    // ================================================================
    // ROOM-SPECIFIC METHODS
    // ================================================================

    async AssignClientAsync(roomId, clientId) {
        try {
            var result = await db.updateOne(
                { _id: roomId },
                { occupied: true, clientId: clientId }
            );
            return result.modifiedCount > 0
                ? { Result: "success" }
                : { Result: "failed" };
        } catch (error) {
            return { Error: error.message };
        }
    } /* AssignClientAsync */

    async VacateRoomAsync(roomId) {
        try {
            var result = await db.updateOne(
                { _id: roomId },
                { occupied: false, clientId: null }
            );
            return result.modifiedCount > 0
                ? { Result: "success" }
                : { Result: "failed" };
        } catch (error) {
            return { Error: error.message };
        }
    } /* VacateRoomAsync */

    // ================================================================
    // CACHED METHODS (Redis) - Comment out if Redis not available
    // ================================================================

    async GetRoomCachedAsync(roomId) {
        if (!roomId) return null;

        // var room = await RedisGetObjectAsync("ROOM", roomId);
        // if (room) return room;

        var result = await this.FindOneAsync({ _id: roomId });
        if (result.Result) {
            // await RedisUpsertObjectAsync("ROOM", result.Result, roomId);
            return result.Result;
        } else {
            return null;
        }
    } /* GetRoomCachedAsync */

    async UpdateRoomCachedAsync(room) {
        if (!room) return null;
        try {
            await this.UpdateOneAsync(room);
            // await RedisUpsertObjectAsync("ROOM", room, room._id);
            return room._id;
        } catch (error) {
            return null;
        }
    } /* UpdateRoomCachedAsync */

    async DeleteRoomCachedAsync(roomId) {
        if (!roomId) return null;
        try {
            await this.DeleteOneAsync(roomId);
            // await RedisDeleteObjectAsync("ROOM", roomId);
            return roomId;
        } catch (error) {
            return null;
        }
    } /* DeleteRoomCachedAsync */
}; /* Room */