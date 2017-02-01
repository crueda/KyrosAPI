function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("DB_ERROR", "Database error");
define("SERVER_ERROR", "Server error");
define("ID_ERROR", "The id must be numeric");
define("LOGIN_INCORRECT", "Invalid user or password");
define("TOKEN_INCORRECT", "Invalid token");
define("TOKEN_EXPIRED", "Token expired");
define("NOT_ALLOW", "User not authorized");
define("MISSING_PARAMETER", "Missing parameter");
define("PARAMETER_ERROR", "Validation parameter error");
define("MISSING_REGISTER", "Missing element");
define("ID_NUMERIC_ERROR", "The id must be numeric");
define("DATE_INCORRECT", "Date incorrect format");
define("UNKONOWN_EVENT", "Unknown event");
define("UNKONOWN_STATUS", "Unknown status");
define("PARAMETER_ERROR_TYPE", "Incorrect type for parameter");
