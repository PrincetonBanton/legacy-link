import fs from 'fs';
import MDBReader from 'mdb-reader';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export async function runMigration(mdbPath) {
  const sqlitePath = './migrated_data.sqlite';
  let tableStats = [];
  let mainTableSchema = [];
  let detectedType = "Unknown System";
  let mainTableName = null;

  // Clear old DB
  if (fs.existsSync(sqlitePath)) fs.unlinkSync(sqlitePath);

  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  const db = new sqlite3.Database(sqlitePath);
  const dbRun = promisify(db.run.bind(db));
  const tableNames = reader.getTableNames();

  // Detect System
  if (tableNames.includes('DRDetails')) {
    detectedType = "Production System";
    mainTableName = "DRDetails";
  } else if (tableNames.includes('MISDetails')) {
    detectedType = "Material Management System";
    mainTableName = "MISDetails";
  }

  for (const tableName of tableNames) {
    const table = reader.getTable(tableName);
    const rows = table.getData();
    const rawColumns = table.getColumns();
    const columnNames = rawColumns.map(c => c.name);

    if (tableName === mainTableName) {
      mainTableSchema = rawColumns.map(c => ({ name: c.name, type: c.type }));
    }

    tableStats.push({ name: tableName, rowCount: rows.length, colCount: columnNames.length });

    const colDefinitions = columnNames.map(col => `"${col}" TEXT`).join(', ');
    await dbRun(`CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefinitions})`);

    await dbRun("BEGIN TRANSACTION");
    const placeholders = columnNames.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`);

    rows.forEach(row => {
      const values = columnNames.map(col => {
        let val = row[col];

        if (val instanceof Date) {
          // 1. Check if the date is valid to avoid "Invalid Date" errors
          // 2. Convert to ISO String (e.g., "2024-05-20T12:00:00Z")
          // 3. Split at 'T' and take the first part: "2024-05-20"
          if (isNaN(val.getTime())) return null;            
          return val.toISOString().split('T')[0];
        }

        // Keep numbers as numbers, and everything else as is
        return (typeof val === 'number') ? val : val;
      });
      stmt.run(values);
    });

    await new Promise((resolve) => stmt.finalize(resolve));
    await dbRun("COMMIT");
  }

  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      resolve({
        success: true,
        dbType: detectedType,
        mainTable: mainTableName,
        schema: mainTableSchema,
        stats: tableStats
      });
    });
  });
}