const mysql = require("mysql");
const keys = require("../keys");
const util = require("util");
require("dotenv").config();

var pool = mysql.createPool({
  connectionLimit: 4,
  connectTimeout: 60 * 60 * 1000,
  host: process.env.WAITLIST_DB_URL || process.env.WAITLIST_LIVE_DB_URL,
  port: process.env.WAITLIST_DB_PORT || process.env.WAITLIST_LIVE_DB_PORT,
  user:
    process.env.WAITLIST_DB_USERNAME || process.env.WAITLIST_LIVE_DB_USERNAME,
  password: process.env.WAITLIST_DB_PASS || process.env.WAITLIST_LIVE_DB_PASS,
  database: process.env.WAITLIST_DB_NAME || process.env.WAITLIST_LIVE_DB_NAME
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }
  }
  if (connection) {
    console.log("Connection to Gevva DB made!");
    connection.release();
  }
  return;
});

/** We are using the built in util to promisy our mySQL queries */
pool.query = util.promisify(pool.query);

module.exports = pool;
