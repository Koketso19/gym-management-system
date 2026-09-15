// ================================================================
// CLASS USER - User Management & Authentication Library
// ================================================================
// PURPOSE: Handles all user operations including:
// 1. User CRUD (Create, Read, Update, Delete)
// 2. Authentication (Login, Password Validation)
// 3. DataTables integration for user lists
// 4. Password strength validation
// 5. User session management
// ================================================================

const user = require('../db_schema/user');
const moment = require('moment');
const formidable = require("formidable");

// ================================================================
// HELPER FUNCTIONS
// ================================================================

// Check if value is a string
function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
}

// Escape special characters for regex (prevents injection)
function escapeRegExp(str) {
    if (!isString(str)) {
        return "";
    }
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

// Convert string to CamelCase (e.g., "john doe" → "John Doe")
function _ToCamelCase(str) {
    return str.toLowerCase().replace(/(?:(^.)|(\s+.))/g, function(match) {
        return match.charAt(match.length - 1).toUpperCase();
    });
}

// Check if string has special characters
function hasSpecialChar(str) {
    let regex = /[@!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    return regex.test(str);
}

// Check if string has uppercase letters
function hasUpperCase(str) {
    return str !== str.toLowerCase();
}

// ================================================================
// DATA TABLES: Get User Data
// ================================================================
// PURPOSE: Fetches user data with DataTables pagination, sorting, and search
// PARAMETERS:
//   - req: Express request object (contains DataTables params)
//   - loggedInUser: Currently logged in user (to protect admin/self)
// RETURNS: JSON string for DataTables
// ================================================================

async function _DtGetUserData(req, loggedInUser) {
    let searchStr = {};

    // ---- DataTables: Search ----
    let strSearch = req.body['search[value]'];

    // ---- DataTables: Sort ----
    let strSort = req.body['order[0][column]'];
    let SortIndex = 'columns[' + strSort + '][data]';
    let SortValue = req.body[SortIndex];
    let strSortDir = req.body['order[0][dir]'];
    let SortDir = -1; // Descending by default

    if (strSortDir == 'asc') {
        SortDir = 1; // Ascending
    }

    // Build sort object
    let strSysSort = '{"' + SortValue + '":' + SortDir + '}';
    let SysSort = JSON.parse(strSysSort);

    // ---- Build Search Query ----
    if (strSearch) {
        let regex = new RegExp(escapeRegExp(strSearch), "i");
        searchStr = {
            $or: [
                { 'UserID': regex },
                { 'FirstName': regex },
                { 'LastName': regex }
            ]
        };
    }

    try {
        // ---- 1. Get total records ----
        const recordsTotal = await user.countDocuments({});

        // ---- 2. Get filtered records ----
        const recordsFiltered = await user.countDocuments(searchStr);

        // ---- 3. Get paginated data ----
        const results = await user.find(
            searchStr,
            'UserID FirstName LastName',
            {
                'skip': Number(req.body.start),
                'limit': Number(req.body.length),
                'sort': SysSort
            }
        );

        // ---- 4. Format results with permissions ----
        let MyData = [];
        for (let result of results) {
            let CanDelete = true;
            let CanEdit = true;

            // Protect admin and current user from deletion
            if (result.UserID == loggedInUser || result.UserID == 'admin') {
                CanDelete = false;
            }

            // Protect admin from editing
            if (result.UserID == 'admin') {
                CanEdit = false;
            }

            MyData.push({
                UserID: result.UserID,
                FirstName: result.FirstName,
                LastName: result.LastName,
                CanDelete: CanDelete,
                CanEdit: CanEdit
            });
        }

        // ---- 5. Return DataTables response ----
        return JSON.stringify({
            "draw": req.body.draw,
            "recordsFiltered": recordsFiltered,
            "recordsTotal": recordsTotal,
            "data": MyData
        });

    } catch (err) {
        console.log('Error getting user data:', err);
        return null;
    }
}

// ================================================================
// HELPER: Create New User
// ================================================================
// PURPOSE: Creates a new user in the database
// PARAMETERS:
//   - Object: User data object
// RETURNS: { SavedDoc: user } or { Err: error }
// ================================================================

async function _CreateUser(Object) {
    try {
        const SavedDoc = await user.create(Object);
        if (SavedDoc) {
            return { SavedDoc: SavedDoc };
        } else {
            return { SavedDoc: null };
        }
    } catch (err) {
        return { Err: err };
    }
}

// ================================================================
// MAIN EXPORT CLASS: User
// ================================================================
// PURPOSE: Provides all user management functionality
// USAGE:
//   const UserLib = require("./lib/classUser");
//   const user = new UserLib();
//   await user.Find({ UserID: "john_doe" });
// ================================================================

module.exports = class User {
    constructor() {}

    // ================================================================
    // DATA TABLES METHOD
    // ================================================================

    /**
     * Get user data for DataTables
     * USAGE: const data = await user.DtGetUserData(req, loggedInUser)
     * RETURNS: JSON string for DataTables
     */
    async DtGetUserData(req, loggedInUser) {
        return await _DtGetUserData(req, loggedInUser);
    }

    // ================================================================
    // CREATE METHODS
    // ================================================================

    /**
     * Create a new user
     * USAGE: const result = await user.New(userData)
     * RETURNS: { SavedDoc: user } or { Err: error }
     */
    async New(Object) {
        return await _CreateUser(Object);
    }

    /**
     * Create new user object from form data
     * USAGE: const userData = await user.FormNewUserObj(req)
     * RETURNS: { UserData: { UserID, FirstName, LastName, Password } }
     */
    async FormNewUserObj(req) {
        return new Promise((resolve, reject) => {
            var form = new formidable.IncomingForm();

            form.parse(req, function(err, fields, files) {
                if (err) {
                    return reject({ Err: err });
                }

                // Validate required fields
                if ((fields.uid != null) &&
                    (fields.firstName != null) &&
                    (fields.LastName != null) &&
                    (fields.psw != null)) {

                    var UserData = {
                        UserID: fields.uid.toLowerCase(),
                        FirstName: _ToCamelCase(fields.firstName),
                        LastName: _ToCamelCase(fields.LastName),
                        Password: fields.psw
                    };

                    return resolve({ UserData: UserData });
                } else {
                    return resolve({ UserData: null });
                }
            });
        });
    }

    // ================================================================
    // READ / FIND METHODS
    // ================================================================

    /**
     * Find users by key-value pair
     * USAGE: const result = await user.Find({ UserGroup: "admin" })
     * RETURNS: { UserArr: [...] } or { UserArr: null } or { Err: error }
     */
    async Find(KeyValuePair) {
        try {
            const UserArr = await user.find(KeyValuePair);
            if (UserArr.length > 0) {
                return { UserArr: UserArr };
            } else {
                return { UserArr: null };
            }
        } catch (err) {
            return { Err: err };
        }
    }

    /**
     * Find single user with password verification
     * USAGE: const result = await user.FindOne("john_doe", "password", true)
     * RETURNS: { User: user } or { User: null } or { Err: error }
     */
    async FindOne(UserName, Password, VerifyPwd) {
        try {
            var KeyValuePair = { 'UserID': UserName };
            const User = await user.findOne(KeyValuePair);

            if (!User) {
                return { User: null };
            }

            if (VerifyPwd == true) {
                // Verify password using bcrypt
                const valid = await User.verifyPassword(Password);
                if (valid) {
                    return { User: User };
                } else {
                    return { User: null };
                }
            } else {
                return { User: User };
            }
        } catch (err) {
            return { Err: err };
        }
    }

    /**
     * Find single user by key-value pair (no password verification)
     * USAGE: const result = await user.FindOneRec({ UserID: "john_doe" })
     * RETURNS: { Rec: user } or { Rec: null } or { Err: error }
     */
    async FindOneRec(KeyValuePair) {
        try {
            const Rec = await user.findOne(KeyValuePair);
            if (!Rec) {
                return { Rec: null };
            }
            return { Rec: Rec };
        } catch (err) {
            return { Err: err };
        }
    }

    // ================================================================
    // UPDATE METHODS
    // ================================================================

    /**
     * Update user (with markModified for nested fields)
     * USAGE: const result = await user.Update(updatedUser)
     * RETURNS: { SavedDoc: user } or { SavedDoc: null }
     */
    async Update(UpdateObject) {
        if (!UpdateObject) {
            return { SavedDoc: null };
        }

        try {
            UpdateObject.markModified('Fields');
            const savedDoc = await UpdateObject.save();
            return { SavedDoc: savedDoc };
        } catch (err) {
            return { SavedDoc: null };
        }
    }

    /**
     * Update user (simplified)
     * USAGE: const result = await user.UpdateUser(updatedUser)
     * RETURNS: { SavedDoc: user } or { SavedDoc: null }
     */
    async UpdateUser(UpdateObject) {
        if (!UpdateObject) {
            return { SavedDoc: null };
        }

        try {
            const savedDoc = await UpdateObject.save();
            return { SavedDoc: savedDoc };
        } catch (err) {
            return { SavedDoc: null };
        }
    }

    // ================================================================
    // DELETE METHODS
    // ================================================================

    /**
     * Delete user by key-value pair
     * USAGE: const result = await user.DeleteUser({ UserID: "john_doe" })
     * RETURNS: { DeleteResp: response } or { Err: error }
     */
    async DeleteUser(KeyValuePair) {
        try {
            const Resp = await user.deleteOne(KeyValuePair);
            return { DeleteResp: Resp };
        } catch (err) {
            return { Err: err };
        }
    }

    // ================================================================
    // AUTHENTICATION METHODS
    // ================================================================

    /**
     * Get login details from request (form data)
     * USAGE: const loginData = await user.GetLoginDetails(req)
     * RETURNS: { Username: string, Password: string } or { Username: null }
     */
    async GetLoginDetails(req) {
        return new Promise((resolve, reject) => {
            var form = new formidable.IncomingForm();

            form.parse(req, function(err, fields, files) {
                if (err) {
                    return reject({ Err: err });
                }

                if ((fields.uid != null) &&
                    (fields.uid != "") &&
                    (fields.psw != null) &&
                    (fields.psw != "")) {

                    return resolve({ Username: fields.uid, Password: fields.psw });
                } else {
                    return resolve({ Username: null });
                }
            });
        });
    }

    /**
     * Compare and validate login details (password strength)
     * USAGE: const result = await user.CompareLoginDetails(req)
     * RETURNS: { Username: string, Password: string } or { Err: string }
     * 
     * Validates:
     * - Password length >= 8 characters
     * - Contains at least 1 special character
     * - Contains at least 1 uppercase letter
     * - Passwords match
     */
    async CompareLoginDetails(req) {
        return new Promise((resolve, reject) => {
            var form = new formidable.IncomingForm();

            form.parse(req, function(err, fields, files) {
                if (err) {
                    return reject({ Err: err });
                }

                // Check password length
                if (fields.psw.length < 8 || fields.psw1.length < 8) {
                    return resolve({
                        Err: "Password too short, Password length should be at least 8 characters long"
                    });
                }

                // Check for special characters
                if (!hasSpecialChar(fields.psw)) {
                    return resolve({
                        Err: "No special character, Please add at least one special character"
                    });
                }

                // Check for uppercase letters
                if (!hasUpperCase(fields.psw)) {
                    return resolve({
                        Err: "No upper case letter, Please add at least one upper case letter"
                    });
                }

                // Check if passwords match
                if ((fields.uid != null) &&
                    (fields.uid != "") &&
                    (fields.psw != null) &&
                    (fields.psw != "") &&
                    (fields.psw1 != "") &&
                    (fields.psw1 != "") &&
                    (fields.psw == fields.psw1)) {

                    return resolve({ Username: fields.uid, Password: fields.psw });
                } else {
                    return resolve({ Err: "Passwords do not match" });
                }
            });
        });
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    /**
     * Convert string to CamelCase
     * USAGE: const name = user.ToCamelCase("john doe")
     * RETURNS: "John Doe"
     */
    ToCamelCase(str) {
        return _ToCamelCase(str);
    }

    /**
     * Check if string has special characters
     * USAGE: const hasSpecial = user.hasSpecialChar("password!")
     * RETURNS: true/false
     */
    hasSpecialChar(str) {
        return hasSpecialChar(str);
    }

    /**
     * Check if string has uppercase letters
     * USAGE: const hasUpper = user.hasUpperCase("Password")
     * RETURNS: true/false
     */
    hasUpperCase(str) {
        return hasUpperCase(str);
    }

    /**
     * Escape regex special characters
     * USAGE: const escaped = user.escapeRegExp("hello.*")
     * RETURNS: "hello\.\*"
     */
    escapeRegExp(str) {
        return escapeRegExp(str);
    }
};