import {Pool} from "pg";

export type DatabaseTemplate = {
    queryOne: <T>(sql: string, mapping: (row: any) => T, ...args: any[]) => Promise<T>;
    query: <T>(sql: string, mapping: (row: any) => T, ...args: any[]) => Promise<T[]>;
    execute: (sql: string, ...args: any[]) => Promise<void>;
}

const create = (databaseUrl: string): DatabaseTemplate => {
    const pool = new Pool({connectionString: databaseUrl});

    return {
        queryOne: async <T>(sql: string, mapping: (row: any) => T, ...args: any[]) => {
            const result = await pool.query(sql, args);
            return mapping(result.rows[0]);
        },
        query: async <T>(sql: string, mapping: (row: any) => T, ...args: any[]) => {
            const result = await pool.query(sql, args);
            return result.rows.map(mapping);
        },
        execute: async (sql: string, ...args: any[]) => {
            await pool.query(sql, args);
        },
    };
};

export const databaseTemplate = {
    create,
}
