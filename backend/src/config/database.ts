import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // IMPORTANT: setează DB_NAME în .env pentru fiecare spital (ex: spital_brasov)
    database: process.env.DB_NAME || 'DSPD',
    port: Number(process.env.DB_PORT || 3306),
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Setează charset pentru conexiune
    typeCast: function (field: any, next: any) {
        if (field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'TEXT') {
            return field.string();
        }
        return next();
    }
});

export default pool; 