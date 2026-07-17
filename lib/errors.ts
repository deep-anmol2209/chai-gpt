/**
 * Base custom error class for all application errors.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code = "INTERNAL_SERVER_ERROR", statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when the LLM model rate limit or quota is exceeded.
 */
export class ModelLimitExceededError extends AppError {
  constructor(message = "Model limit exceeded. Please wait a moment before trying again.") {
    super(message, "MODEL_LIMIT_EXCEEDED", 429);
  }
}

/**
 * Thrown when the Google GenAI API Key is missing from the environment.
 */
export class APIKeyMissingError extends AppError {
  constructor(message = "Something went wrong in backend.") {
    super(message, "API_KEY_MISSING", 500);
  }
}

/**
 * Thrown when the Google GenAI API Key is invalid.
 */
export class InvalidAPIKeyError extends AppError {
  constructor(message = "Something went wrong in backend.") {
    super(message, "INVALID_API_KEY", 500);
  }
}

/**
 * Thrown when database operations fail.
 */
export class DatabaseError extends AppError {
  constructor(message = "Something went wrong in backend.") {
    super(message, "DATABASE_ERROR", 500);
  }
}

/**
 * Thrown when a conversation is not found or user is unauthorized to access it.
 */
export class ConversationNotFoundError extends AppError {
  constructor(message = "Conversation not found.") {
    super(message, "CONVERSATION_NOT_FOUND", 404);
  }
}

/**
 * Thrown when the user is not authenticated.
 */
export class UnauthorizedError extends AppError {
  constructor(message = "You must be logged in to access this resource.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

/**
 * Maps an unknown server/API error into a standardized AppError response structure.
 * Logs the actual raw error details to the server console for debugging.
 */
export function mapServerError(error: any): { message: string; code: string; status: number } {
  // Always log the actual raw error on the server for debugging
  console.error("[Server Error Handler] Captured error:", error);

  // If it's already an AppError instance, return its fields
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      status: error.statusCode,
    };
  }

  // Handle specific Clerk authorization error names
  if (error.name === "ClerkProtectError") {
    return {
      message: "You must be logged in to access this resource.",
      code: "UNAUTHORIZED",
      status: 401,
    };
  }

  const messageStr = String(error.message || "");
  const responseBodyStr = String(error.responseBody || "");

  // Detect missing API keys
  if (
    error.name === "AI_LoadAPIKeyError" ||
    messageStr.includes("API key is missing") ||
    messageStr.includes("GOOGLE_GENERATIVE_AI_API_KEY")
  ) {
    return {
      message: "Something went wrong in backend.",
      code: "API_KEY_MISSING",
      status: 500,
    };
  }

  // Detect invalid API keys
  if (
    messageStr.includes("API key not valid") ||
    messageStr.includes("API_KEY_INVALID") ||
    responseBodyStr.includes("API_KEY_INVALID")
  ) {
    return {
      message: "Something went wrong in backend.",
      code: "INVALID_API_KEY",
      status: 500,
    };
  }

  // Detect Model rate limits (Gemini returns RESOURCE_EXHAUSTED or 429 status)
  if (
    error.statusCode === 429 ||
    error.status === 429 ||
    messageStr.includes("RESOURCE_EXHAUSTED") ||
    messageStr.includes("Quota exceeded") ||
    messageStr.includes("rate limit") ||
    responseBodyStr.includes("RESOURCE_EXHAUSTED")
  ) {
    return {
      message: "Model limit exceeded. Please wait a moment before trying again.",
      code: "MODEL_LIMIT_EXCEEDED",
      status: 429,
    };
  }

  // Handle Prisma / Database issues
  if (
    error.name?.includes("Prisma") ||
    messageStr.includes("prisma") ||
    messageStr.includes("database") ||
    messageStr.includes("db connection")
  ) {
    return {
      message: "Something went wrong in backend.",
      code: "DATABASE_ERROR",
      status: 500,
    };
  }

  // General fallback
  return {
    message: "Something went wrong in backend.",
    code: "INTERNAL_SERVER_ERROR",
    status: 500,
  };
}
