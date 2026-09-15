// ================================================================
// CLASS PARAM - System Parameters Management Library
// ================================================================

const Param = require("../db_schema/parameter");
const moment = require("moment");

// ---- REDIS - Comment out if not using ----
// const {
//   RedisUpsertObjectAsync,
//   RedisGetObjectAsync,
// } = require("../services/cacheService");

// ================================================================
// MAIN EXPORT CLASS: SysParams
// ================================================================

module.exports = class SysParams {
    constructor() {}

    // ================================================================
    // CREATE METHODS
    // ================================================================

    async NewAsync(Object) {
        try {
            const SavedDoc = await Param.create(Object);
            return SavedDoc ? { SavedDoc: SavedDoc } : { SavedDoc: null };
        } catch (err) {
            return { Err: err };
        }
    }

    // ================================================================
    // READ / FIND METHODS - ✅ FIXED with async/await
    // ================================================================

    /**
     * Find multiple parameters - ✅ NO CALLBACKS
     * USAGE: const result = await param.Find({ Category: "System" })
     */
    async Find(KeyValuePair) {
        try {
            const Params = await Param.find(KeyValuePair);
            if (Params && Params.length > 0) {
                return { Err: null, Params: Params };
            } else {
                return { Err: null, Params: null };
            }
        } catch (err) {
            console.log("Error in Finding System Parameter:", err);
            return { Err: err, Params: null };
        }
    }

    /**
     * Find single parameter - ✅ NO CALLBACKS
     * USAGE: const result = await param.FindOne({ ParameterName: "Settings" })
     */
    async FindOne(KeyValuePair) {
        try {
            const ParamDoc = await Param.findOne(KeyValuePair);
            if (ParamDoc) {
                return { Err: null, Param: ParamDoc };
            } else {
                return { Err: null, Param: null };
            }
        } catch (err) {
            return { Err: err, Param: null };
        }
    }

    /**
     * Find multiple parameters (Async version)
     * USAGE: const result = await param.FindAsync({ Category: "System" })
     */
    async FindAsync(KeyValuePair) {
        try {
            const collection = await Param.find(KeyValuePair);
            return { Result: collection };
        } catch (error) {
            return { Error: error.message };
        }
    }

    /**
     * Find single parameter (Async version)
     * USAGE: const result = await param.FindOneAsync({ ParameterName: "Settings" })
     */
    async FindOneAsync(KeyValuePair) {
        try {
            const collection = await Param.findOne(KeyValuePair);
            return { Result: collection };
        } catch (error) {
            return { Error: error.message };
        }
    }

    // ================================================================
    // UPDATE METHODS - ✅ FIXED with async/await
    // ================================================================

    async UpdateAsync(updateObject) {
        if (!updateObject) return null;
        try {
            updateObject.markModified('Fields');
            await updateObject.save();
            return { Result: "success" };
        } catch (error) {
            return { Error: error.message };
        }
    }

    async UpdateOneAsync(updateObject) {
        if (!updateObject) return null;
        try {
            const filter = { _id: updateObject._id };
            const result = await Param.replaceOne(filter, updateObject);
            return result.modifiedCount > 0 
                ? { Result: "success" } 
                : { Result: "failed" };
        } catch (error) {
            return { Error: error.message };
        }
    }

    // ================================================================
    // CACHED METHODS (Redis) - Comment out if Redis not available
    // ================================================================

    async GetParamCachedAsync(parameterName) {
        if (!parameterName) return null;

        // Skip Redis if not available
        // var params = await RedisGetObjectAsync("PARAMS", parameterName);
        // if (params) return params;

        const result = await this.FindOneAsync({ ParameterName: parameterName });
        return result.Result || null;
    }

    async UpdateParamCachedAsync(params) {
        if (!params) return null;
        try {
            const updateResult = await this.UpdateOneAsync(params);
            if (updateResult.Error) return null;
            return params.ParameterName;
        } catch (error) {
            return null;
        }
    }

    async GetParamsByCategoryAsync(category) {
        if (!category) return null;
        const result = await this.FindAsync({ Category: category });
        return result.Result || null;
    }

    async RefreshCacheAsync() {
        return { Success: false, Count: 0, Message: "Redis disabled" };
    }
};