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

  // --- 🍇 NEW FEATURE: PRODUCT PIE GRAPH VOLUMES CHANNEL ---
  ipcMain.handle('check-product-data', (event, { table, startDate, endDate }) => {
    const isProduction = table === "DRDetails";
    
    // Determine target column based on whether the source table is Production or Material Management
    const dateCol = isProduction ? "DRDate" : "MISDate";
    const productCol = isProduction ? "DRProduct" : "MISGroup";
    const amountCol = isProduction ? "DRAmount" : "MISAmount";

    const sql = `SELECT 
                  ${dateCol} as TransactionDate,
                  TRIM(${productCol}) as CleanProduct,
                  COUNT(*) as RowCount,
                  SUM(CAST(REPLACE(${amountCol}, ',', '') AS DECIMAL)) as ProductSumTotal
                FROM "${table}" 
                WHERE ${dateCol} BETWEEN '${startDate}' AND '${endDate}'
                  AND ${productCol} > ''
                GROUP BY TRIM(${productCol})`;

    return queryDb(sql, (rows) => rows);
  });

  // --- ☁️ FIXED CLOUD SNAPSHOT DATAPACK CHANNEL ---
  ipcMain.handle('check-raw-cloud-data', (event, { table, startDate, endDate }) => {
    let sql = '';

    if (table === 'Inventory') {
      sql = `SELECT * FROM "Inventory" ORDER BY ItemGroup ASC`;
    } else {
      const dateColumn = table === 'DRDetails' ? 'DRDate' : 'MISDate';
      sql = `SELECT * FROM "${table}" 
             WHERE ${dateColumn} BETWEEN '${startDate}' AND '${endDate}'
             ORDER BY ${dateColumn} ASC`;
    }

    return queryDb(sql, (rows) => rows);
  });

  // --- 📦 LOCAL INVENTORY EXTRACTION CHANNEL ---
  ipcMain.handle('query-inventory', (event) => {
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