import postgres from "postgres"

// Create a singleton connection
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// For serverless environments, we use a connection pool
const sql = postgres(connectionString, {
  max: 10, // Max connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout after 10 seconds when connecting
})

export { sql }

// Helper to get today's date in YYYY-MM-DD format
export function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

// Helper to format date for queries
export function formatDate(date: Date | string): string {
  if (typeof date === "string") return date
  return date.toISOString().split("T")[0]
}
