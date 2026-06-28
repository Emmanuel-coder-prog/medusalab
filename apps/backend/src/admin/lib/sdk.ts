// SDK client is handled by Medusa Admin SDK automatically
// This file is kept for future use if custom SDK operations are needed

export const API_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"

export default { API_BASE_URL }
