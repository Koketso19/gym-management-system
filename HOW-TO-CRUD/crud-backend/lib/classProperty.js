// ================================================================
// CLASS PROPERTY - Property Management Library
// ================================================================

const db = require("../db_schema/property");
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

function _DtGetPropertyData(req, loggedInUser, callback) {
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
            { name: regex },
            { location: regex },
            { type: regex },
            { status: regex },
        ];

        searchStr = { $or: Filters };
    }

    db.countDocuments({}, function (err, c) {
        let recordsTotal = c;
        db.countDocuments(searchStr, function (err, c) {
            let recordsFiltered = c;
            db.find(
                searchStr,
                "name location type phone email status amenities createdAt",
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
                            name: results[x].name,
                            location: results[x].location,
                            type: results[x].type,
                            phone: results[x].phone,
                            email: results[x].email,
                            status: results[x].status,
                            amenities: results[x].amenities,
                            createdAt: results[x].createdAt,
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
} /* _DtGetPropertyData */

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
// MAIN EXPORT CLASS: Property
// ================================================================

module.exports = class Property {
    constructor() {}

    // ================================================================
    // DATATABLES METHODS
    // ================================================================

    DtGetPropertyData(req, loggedInUser, callback) {
        _DtGetPropertyData(req, loggedInUser, function (Resp) {
            return callback(Resp);
        });
    } /* DtGetPropertyData */

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

    async DeleteOneAsync(propertyId) {
        if (!propertyId) {
            return null;
        }
        try {
            var deleteResult = await db.deleteOne({ _id: propertyId });
            if (deleteResult.deletedCount === 0) {
                return { Error: "Property not found." };
            }
            return { Result: "success" };
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
    // CACHED METHODS (Redis) - Comment out if Redis not available
    // ================================================================

    async GetPropertyCachedAsync(propertyId) {
        if (!propertyId) return null;

        // var property = await RedisGetObjectAsync("PROPERTY", propertyId);
        // if (property) return property;

        var result = await this.FindOneAsync({ _id: propertyId });
        if (result.Result) {
            // await RedisUpsertObjectAsync("PROPERTY", result.Result, propertyId);
            return result.Result;
        } else {
            return null;
        }
    } /* GetPropertyCachedAsync */

    async UpdatePropertyCachedAsync(property) {
        if (!property) return null;
        try {
            await this.UpdateOneAsync(property);
            // await RedisUpsertObjectAsync("PROPERTY", property, property._id);
            return property._id;
        } catch (error) {
            return null;
        }
    } /* UpdatePropertyCachedAsync */

    async DeletePropertyCachedAsync(propertyId) {
        if (!propertyId) return null;
        try {
            await this.DeleteOneAsync(propertyId);
            // await RedisDeleteObjectAsync("PROPERTY", propertyId);
            return propertyId;
        } catch (error) {
            return null;
        }
    } /* DeletePropertyCachedAsync */
}; /* Property */