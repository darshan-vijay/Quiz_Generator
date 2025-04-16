export type Environment = {
  // No required environment variables
};

const fromEnv = (): Environment => ({
  // Empty object since no environment variables are required
});

export const environment = {
  fromEnv,
};
