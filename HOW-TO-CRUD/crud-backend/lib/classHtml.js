// ================================================================
// CLASS PARAM - System Parameters Management Library
// ================================================================
// PURPOSE: Handles all system parameter operations with async/await
// ================================================================

const Param = require("../db_schema/parameter");
const moment = require("moment");
const {
  RedisUpsertObjectAsync,
  RedisGetObjectAsync,
} = require("../services/cacheService");

// ================================================================
// MAIN EXPORT CLASS: SysParams
// ================================================================

module.exports = class SysParams {
    constructor() {}

    // ================================================================
    // CREATE METHODS
    // ================================================================

    /**
     * Create a new parameter
     * USAGE: const result = await param.NewAsync(Object)
     */
    async NewAsync(Object) {
        try {
            const SavedDoc = await Param.create(Object);
            return SavedDoc ? { SavedDoc: SavedDoc } : { SavedDoc: null };
        } catch (err) {
            return { Err: err };
        }
    }

    // ================================================================
    // READ / FIND METHODS
    // ================================================================

    /**
     * Find multiple parameters
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
     * Find single parameter
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
    // UPDATE METHODS
    // ================================================================

    /**
     * Update parameter with nested fields
     * USAGE: const result = await param.UpdateAsync(updatedParam)
     */
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

    /**
     * Update parameter using replaceOne
     * USAGE: const result = await param.UpdateOneAsync(updatedParam)
     */
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
    // CACHED METHODS (Redis)
    // ================================================================

    /**
     * Get parameter with Redis caching
     * USAGE: const param = await param.GetParamCachedAsync("Settings")
     */
    async GetParamCachedAsync(parameterName) {
        if (!parameterName) return null;

        // Check Redis cache
        const cached = await RedisGetObjectAsync("PARAMS", parameterName);
        if (cached) return cached;

        // Cache miss - query database
        const result = await this.FindOneAsync({ ParameterName: parameterName });
        
        // Store in cache if found
        if (result.Result) {
            await RedisUpsertObjectAsync("PARAMS", result.Result, parameterName);
            return result.Result;
        }

        return null;
    }

    /**
     * Update parameter and refresh Redis cache
     * USAGE: const result = await param.UpdateParamCachedAsync(updatedParam)
     */
    async UpdateParamCachedAsync(params) {
        if (!params) return null;

        try {
            // Update database
            const updateResult = await this.UpdateOneAsync(params);
            if (updateResult.Error) return null;

            // Update Redis cache
            await RedisUpsertObjectAsync("PARAMS", params, params.ParameterName);
            return params.ParameterName;
        } catch (error) {
            return null;
        }
    }

    // ================================================================
    // BULK OPERATIONS
    // ================================================================

    /**
     * Get multiple parameters by category with caching
     * USAGE: const params = await param.GetParamsByCategoryAsync("System")
     */
    async GetParamsByCategoryAsync(category) {
        if (!category) return null;

        const cacheKey = `CATEGORY_${category}`;
        
        // Check cache
        const cached = await RedisGetObjectAsync("PARAMS", cacheKey);
        if (cached) return cached;

        // Query database
        const result = await this.FindAsync({ Category: category });
        if (result.Result && result.Result.length > 0) {
            await RedisUpsertObjectAsync("PARAMS", result.Result, cacheKey);
            return result.Result;
        }

        return null;
    }

    /**
     * Refresh all parameters in cache
     * USAGE: await param.RefreshCacheAsync()
     */
    async RefreshCacheAsync() {
        try {
            const result = await this.FindAsync({});
            if (result.Result && result.Result.length > 0) {
                for (let param of result.Result) {
                    await RedisUpsertObjectAsync("PARAMS", param, param.ParameterName);
                }
                return { Success: true, Count: result.Result.length };
            }
            return { Success: false, Count: 0 };
        } catch (error) {
            return { Success: false, Error: error.message };
        }
    }
};