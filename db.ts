// // db.ts
// import pg from "pg";
// import { drizzle } from "drizzle-orm/node-postgres";
// import dotenv from "dotenv";

// dotenv.config();

// const { Pool } = pg;

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: Number(process.env.DB_PORT),
// });

// pool.connect()
//   .then(client => {
//     console.log("✅ Connected to Postgres");
//     client.release();
//   })
//   .catch(err => {
//     console.error("❌ Connection error:", err);
//   });

// export const db = drizzle(pool);
