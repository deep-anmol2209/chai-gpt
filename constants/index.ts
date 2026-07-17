export const MESSAGE_ROLES = {
  USER: "USER",
  ASSISTANT: "ASSISTANT",
  SYSTEM: "SYSTEM",
  TOOL: "TOOL",
} as const;

export type MessageRoleConstant = typeof MESSAGE_ROLES[keyof typeof MESSAGE_ROLES];

export const MESSAGE_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
} as const;

export type MessageStatusConstant = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];
