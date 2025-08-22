// import express from "express";
// import pkg from "pg";
// import dotenv from "dotenv";
// import router from "./routes"; // Make sure routes/index.ts or routes.ts exists

// dotenv.config();
// const { Pool } = pkg;

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware to parse JSON requests
// app.use(express.json());

// // Setup PostgreSQL pool using environment variables or fallback connection string
// export const pool = new Pool({
//   connectionString:
//     process.env.DATABASE_URL ||
//     `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
// });

// // Test DB connection on startup
// pool.connect()
//   .then(client => {
//     return client.query("SELECT NOW()")
//       .then(res => {
//         console.log("✅ Connected to Postgres at", res.rows[0].now);
//         client.release();
//       })
//       .catch(err => {
//         client.release();
//         console.error("❌ Error testing database connection:", err);
//       });
//   })
//   .catch(err => {
//     console.error("❌ Failed to connect to Postgres:", err);
//   });

// // Global error handlers for uncaught exceptions and promise rejections
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// // Basic root route to confirm server is running
// app.get("/", (req, res) => {
//   res.send("🚀 Server is running and connected to Postgres!");
// });

// // Use your API routes under /api prefix
// app.use("/api", router);

// // Start the Express server
// app.listen(PORT, () => {
//   console.log(`🌐 Server is listening on http://localhost:${PORT}`);
// });
