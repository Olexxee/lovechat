export const messageKeys = {
  all: ["messages"] as const,

  conversation: (conversationId: number) =>
    [...messageKeys.all, "conversation", conversationId] as const,
};
