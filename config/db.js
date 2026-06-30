const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "autoequip",
});

pool.getConnection()
  .then(conn => {
    console.log("Connected to database");
    conn.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err.message);
  });

module.exports = pool;