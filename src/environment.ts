export type Environment = {
    databaseUrl: string,
}

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (value === undefined || value === "") {
        throw new Error(`Environment variable ${name} is required, but was not found`);
    }
    return value;
};

const fromEnv = (): Environment => ({
    databaseUrl: requireEnv("DATABASE_URL"),
});

export const environment = {
    fromEnv,
};
