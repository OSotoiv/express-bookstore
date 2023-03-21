/** Common config for bookstore. */

require("dotenv").config();
let DB_URI = {
  user: process.env.DB_USER,
  host: 'localhost',
  database: '',
  password: process.env.DB_PASSWORD
}
DB_URI.database = (process.env.NODE_ENV === "test")
  ? "bookstore_test"
  : "bookstore";

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
};