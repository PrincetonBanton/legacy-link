// src/ipc-handlers.js
import { runMigration } from './migration-util.js';
import sqlite3 from 'sqlite3';

export function setupIpcHandlers(ipcMain, dialog) {
  
  // --- FILE PICKER ---
  ipcMain.handle('select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Access Databases', extensions: ['mdb'] }]
    });
    return canceled ? null : filePaths[0];
  });

  // --- MIGRATION TRIGGER ---
  ipcMain.on('save-mdb-path', async (event, mdbPath) => {
    try {
      event.reply('migration-finished', await runMigration(mdbPath));
    } catch (err) {
      console.error("Migration Error:", err);
      event.reply('migration-finished', { success: false, error: err.message });
    }
  });

  // --- LOCATION FILTER LOOKUP ---
  ipcMain.handle('get-locations', () => queryDb(
    `SELECT DISTINCT TRIM(Area) || '-' || TRIM(AreaLoc) as label FROM Settings WHERE Area > '' ORDER BY Area ASC`,
    (rows) => rows.map(r => r.label)
  ));

  // --- DIAGNOSTIC DATA SAMPLE ---
  ipcMain.handle('debug-check-data', (event, { table }) => queryDb(
    `SELECT * FROM "${table}" LIMIT 3`, 
    (rows) => rows
  ));

  // --- LINE GRAPH TRANSITIONS CHANNEL ---
  ipcMain.handle('check-data-by-date', (event, { table, startDate, endDate }) => {
    const isProduction = table === "DRDetails";
    
    const dateCol = isProduction ? "DRDate" : "MISDate";
    const numCol = isProduction ? "DRNum" : "MISNum";
    const totalCol = isProduction ? "DRTotalAmount" : "MISTotal";

    const sql = `SELECT 
                  ${dateCol} as TransactionDate,
                  TRIM(${numCol}) as CleanNum, 
                  CAST(REPLACE(${totalCol}, ',', '') AS DECIMAL) as UniqueTotal 
                FROM "${table}" 
                WHERE ${dateCol} BETWEEN '${startDate}' AND '${endDate}'
                GROUP BY TRIM(${numCol})`;

    return queryDb(sql, (rows) => rows);
  });

  // --- BAR GRAPH VOLUMES CHANNEL ---
  ipcMain.handle('check-block-data', (event, { table, startDate, endDate }) => {
    const isProduction = table === "DRDetails";
    
    const dateCol = isProduction ? "DRDate" : "MISDate";
    const blockCol = isProduction ? "DRBlock" : "MISBlock";
    const amountCol = isProduction ? "DRAmount" : "MISAmount";

    const sql = `SELECT 
                  ${dateCol} as TransactionDate,
                  TRIM(${blockCol}) as CleanBlock,
                  COUNT(*) as RowCount,
                  SUM(CAST(REPLACE(${amountCol}, ',', '') AS DECIMAL)) as BlockSumTotal
                FROM "${table}" 
                WHERE ${dateCol} BETWEEN '${startDate}' AND '${endDate}'
                  AND ${blockCol} > ''
                GROUP BY TRIM(${blockCol})`;

    return queryDb(sql, (rows) => rows);
  });

  // --- ☁️ FIXED CLOUD SNAPSHOT DATAPACK CHANNEL ---
  ipcMain.handle('check-raw-cloud-data', (event, { table, startDate, endDate }) => {
    const dateColumn = table === 'DRDetails' ? 'DRDate' : 'MISDate';
    
    // Formatted query matching SQLite quotes syntax and date string boundaries
    const sql = `SELECT * FROM "${table}" 
                 WHERE ${dateColumn} BETWEEN '${startDate}' AND '${endDate}'
                 ORDER BY ${dateColumn} ASC`;

    // 🛠️ FIX: Routes directly through your working connection wrapper utility
    return queryDb(sql, (rows) => rows);
  });

  // --- 📦 LOCAL INVENTORY EXTRACTION CHANNEL ---
  ipcMain.handle('query-inventory', (event) => {
    // Selects all tracking metadata from the migrated SQLite Inventory storage table
    const sql = `SELECT * FROM "Inventory" ORDER BY ItemGroup ASC`;

    return queryDb(sql, (rows) => rows);
  });

  // --- CENTRALIZED DATABASE ENGINE WRAPPER ---
  const queryDb = (sql, cb) => new Promise((res) => {
    const db = new sqlite3.Database('./migrated_data.sqlite');
    db.all(sql, [], (err, rows) => {
      res({
        data: err ? null : cb(rows),
        executedSql: sql,
        error: err ? err.message : null
      });
      db.close();
    });
  });
}