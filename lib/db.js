import sqlite3 from 'sqlite3';
import mssql from 'mssql';
import path from 'path';

const isAzure = process.env.AZURE_SQL_CONNECTIONSTRING || 
                (process.env.DB_SERVER && process.env.DB_DATABASE);

let sqliteDb = null;
let mssqlPool = null;

// Initialize connection
async function getDb() {
  if (isAzure) {
    if (!mssqlPool) {
      const config = {
        server: process.env.DB_SERVER || '',
        database: process.env.DB_DATABASE || '',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        options: {
          encrypt: true, // Use encryption for Azure SQL
          trustServerCertificate: false,
        },
        connectionString: process.env.AZURE_SQL_CONNECTIONSTRING
      };
      
      try {
        if (config.connectionString) {
          mssqlPool = await mssql.connect(config.connectionString);
        } else {
          mssqlPool = await mssql.connect(config);
        }
        console.log('Connected to Azure SQL Database');
      } catch (err) {
        console.error('Failed to connect to Azure SQL Database:', err);
        throw err;
      }
    }
    return { type: 'azure', connection: mssqlPool };
  } else {
    if (!sqliteDb) {
      const dbPath = path.resolve(process.cwd(), 'local.db');
      sqliteDb = new sqlite3.Database(dbPath);
      console.log(`Connected to local SQLite database at ${dbPath}`);
    }
    return { type: 'local', connection: sqliteDb };
  }
}

/**
 * Execute a query with parameters.
 * Placeholders in the SQL string should be '?' (e.g. SELECT * FROM Users WHERE id = ?)
 */
export async function query(sql, params = []) {
  const dbInfo = await getDb();
  
  if (dbInfo.type === 'azure') {
    const request = dbInfo.connection.request();
    
    // Map ? placeholders to @p0, @p1, etc.
    let mssqlSql = sql;
    params.forEach((val, idx) => {
      request.input(`p${idx}`, val);
      // Replace the first '?' found
      mssqlSql = mssqlSql.replace('?', `@p${idx}`);
    });
    
    const result = await request.query(mssqlSql);
    
    // Normalize return values (rows array)
    return result.recordset;
  } else {
    return new Promise((resolve, reject) => {
      dbInfo.connection.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

/**
 * Execute a single query (useful for INSERT where we need the last inserted ID).
 * Returns { insertId, rowsAffected }
 */
export async function execute(sql, params = []) {
  const dbInfo = await getDb();
  
  if (dbInfo.type === 'azure') {
    const request = dbInfo.connection.request();
    let mssqlSql = sql;
    
    params.forEach((val, idx) => {
      request.input(`p${idx}`, val);
      mssqlSql = mssqlSql.replace('?', `@p${idx}`);
    });
    
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    if (isInsert && !mssqlSql.includes('OUTPUT') && !mssqlSql.includes('SCOPE_IDENTITY()')) {
      mssqlSql = mssqlSql + '; SELECT SCOPE_IDENTITY() as insertId;';
    }
    
    const result = await request.query(mssqlSql);
    
    let insertId = null;
    if (isInsert && result.recordset && result.recordset.length > 0) {
      insertId = result.recordset[0].insertId;
    }
    
    return {
      insertId,
      rowsAffected: result.rowsAffected[0] || 0,
      rows: result.recordset || []
    };
  } else {
    return new Promise((resolve, reject) => {
      dbInfo.connection.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            insertId: this.lastID,
            rowsAffected: this.changes,
            rows: []
          });
        }
      });
    });
  }
}

/**
 * Run DDL scripts (which might contain multiple queries separated by semicolons).
 */
export async function runScript(script) {
  const dbInfo = await getDb();
  if (dbInfo.type === 'azure') {
    const request = dbInfo.connection.request();
    await request.query(script);
  } else {
    return new Promise((resolve, reject) => {
      dbInfo.connection.exec(script, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
