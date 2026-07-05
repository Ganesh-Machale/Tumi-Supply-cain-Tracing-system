const db = require('../config/db');
const { convertToCSV } = require('../utils/csvExport');

// GET /api/reports/summary
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Base filter for date range
    let dateFilter = '';
    let params = [];
    if (startDate) {
      dateFilter += ' AND supply_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND supply_date <= ?';
      params.push(endDate);
    }

    // 1. General sum (Quantity, Value, Record count)
    const [summaryResult] = await db.query(
      `SELECT 
         COALESCE(SUM(quantity), 0) AS total_qty,
         COALESCE(SUM(total_value), 0) AS total_value,
         COUNT(*) AS total_records
       FROM supply_records
       WHERE status != 'CANCELLED' ${dateFilter}`,
      params
    );

    // 2. Active Locations Count
    const [locationsResult] = await db.query('SELECT COUNT(*) AS active_locations FROM locations WHERE is_active = true');

    // 3. Pending Shipments (PENDING, DISPATCHED, IN_TRANSIT)
    const [pendingResult] = await db.query(
      `SELECT COUNT(*) AS pending_shipments 
       FROM supply_records 
       WHERE status IN ('PENDING', 'DISPATCHED', 'IN_TRANSIT') ${dateFilter}`,
      params
    );

    // 4. Current Month Stats (for Dashboard Cards)
    const [monthResult] = await db.query(
      `SELECT 
         COALESCE(SUM(quantity), 0) AS month_qty,
         COALESCE(SUM(total_value), 0) AS month_value
       FROM supply_records
       WHERE status != 'CANCELLED' 
         AND MONTH(supply_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(supply_date) = YEAR(CURRENT_DATE())`
    );

    res.json({
      total_qty: summaryResult[0].total_qty,
      total_value: summaryResult[0].total_value,
      total_records: summaryResult[0].total_records,
      active_locations: locationsResult[0].active_locations,
      pending_shipments: pendingResult[0].pending_shipments,
      month_qty: monthResult[0].month_qty,
      month_value: monthResult[0].month_value
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ message: 'Error generating report summary' });
  }
};

// GET /api/reports/by-region
const getByRegion = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = '';
    let params = [];

    if (startDate) {
      filter += ' AND sr.supply_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      filter += ' AND sr.supply_date <= ?';
      params.push(endDate);
    }

    const query = `
      SELECT l.region, 
             COALESCE(SUM(sr.quantity), 0) AS total_qty, 
             COALESCE(SUM(sr.total_value), 0) AS total_value
      FROM supply_records sr
      JOIN locations l ON sr.to_location_id = l.id
      WHERE sr.status != 'CANCELLED' ${filter}
      GROUP BY l.region
      ORDER BY total_qty DESC
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generating region report:', error);
    res.status(500).json({ message: 'Error generating region report' });
  }
};

// GET /api/reports/by-product
const getByProduct = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = '';
    let params = [];

    if (startDate) {
      filter += ' AND sr.supply_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      filter += ' AND sr.supply_date <= ?';
      params.push(endDate);
    }

    const query = `
      SELECT p.sku_code, p.name AS product_name, p.category AS product_category,
             COALESCE(SUM(sr.quantity), 0) AS total_qty, 
             COALESCE(SUM(sr.total_value), 0) AS total_value
      FROM supply_records sr
      JOIN products p ON sr.product_id = p.id
      WHERE sr.status != 'CANCELLED' ${filter}
      GROUP BY p.id
      ORDER BY total_qty DESC
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generating product report:', error);
    res.status(500).json({ message: 'Error generating product report' });
  }
};

// GET /api/reports/by-status
const getByStatus = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = '';
    let params = [];

    if (startDate) {
      filter += ' AND supply_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      filter += ' AND supply_date <= ?';
      params.push(endDate);
    }

    const query = `
      SELECT status, 
             COUNT(*) AS count, 
             COALESCE(SUM(quantity), 0) AS total_qty
      FROM supply_records
      WHERE 1=1 ${filter}
      GROUP BY status
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generating status report:', error);
    res.status(500).json({ message: 'Error generating status report' });
  }
};

// GET /api/reports/trend
const getTrend = async (req, res) => {
  try {
    const { startDate, endDate, range = '30' } = req.query;
    let filter = '';
    let params = [];

    if (startDate && endDate) {
      filter += ' AND supply_date >= ? AND supply_date <= ?';
      params.push(startDate, endDate);
    } else {
      // Default to last N days
      filter += ' AND supply_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)';
      params.push(parseInt(range) || 30);
    }

    const query = `
      SELECT DATE_FORMAT(supply_date, '%Y-%m-%d') AS date, 
             COALESCE(SUM(quantity), 0) AS total_qty, 
             COALESCE(SUM(total_value), 0) AS total_value
      FROM supply_records
      WHERE status != 'CANCELLED' ${filter}
      GROUP BY supply_date
      ORDER BY supply_date ASC
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error generating trend report:', error);
    res.status(500).json({ message: 'Error generating trend report' });
  }
};

// GET /api/reports/export (CSV Download)
const exportCsv = async (req, res) => {
  try {
    const { startDate, endDate, status, region, product } = req.query;
    let query = `
      SELECT sr.reference_no AS 'Reference No', 
             p.sku_code AS 'Product SKU', 
             p.name AS 'Product Name', 
             fl.name AS 'From Location', 
             tl.name AS 'To Location', 
             sr.quantity AS 'Quantity', 
             sr.unit_price AS 'Unit Price', 
             sr.total_value AS 'Total Value', 
             DATE_FORMAT(sr.supply_date, '%Y-%m-%d') AS 'Supply Date', 
             sr.status AS 'Status', 
             sr.notes AS 'Notes'
      FROM supply_records sr
      JOIN products p ON sr.product_id = p.id
      JOIN locations fl ON sr.from_location_id = fl.id
      JOIN locations tl ON sr.to_location_id = tl.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate) {
      query += ' AND sr.supply_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND sr.supply_date <= ?';
      params.push(endDate);
    }
    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }
    if (region) {
      query += ' AND (fl.region = ? OR tl.region = ?)';
      params.push(region, region);
    }
    if (product) {
      query += ' AND (p.name LIKE ? OR p.sku_code LIKE ?)';
      const searchParam = `%${product}%`;
      params.push(searchParam, searchParam);
    }

    query += ' ORDER BY sr.supply_date DESC, sr.id DESC';

    const [rows] = await db.query(query, params);
    const csvContent = convertToCSV(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tume_supply_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting report data' });
  }
};

module.exports = {
  getSummary,
  getByRegion,
  getByProduct,
  getByStatus,
  getTrend,
  exportCsv
};
