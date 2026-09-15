var CommonFunctions = function () {};
CommonFunctions.prototype.isString = function (x) {
  return Object.prototype.toString.call(x) === "[object String]";
};

CommonFunctions.prototype.escapeRegExp = function (str) {
  if (!this.isString(str)) {
    return "";
  }
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

CommonFunctions.prototype.toCamelCase = function (str) {
  return str?.toLowerCase()?.replace(/(?:(^.)|(\s+.))/g, function (match) {
    return match?.charAt(match?.length - 1)?.toUpperCase();
  });
}; /* ToCamelCase */

CommonFunctions.prototype.hasSpecialChar = function (str) {
  let regex = /[@!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  return regex.test(str);
};

CommonFunctions.prototype.hasUpperCase = function (str) {
  return str !== str?.toLowerCase();
};

module.exports = new CommonFunctions();
