const db = require('../config/db');

// GET /api/alerts
const getAlerts = async (req, res) => {
  try {
    const { unreadOnly, alertType } = req.query;
    let query = `
      SELECT a.*, 
             p.sku_code AS product_sku, p.name AS product_name, p.category AS product_category,
             l.name AS location_name, l.type AS location_type, l.region AS location_region
      FROM alerts a
      JOIN products p ON a.product_id = p.id
      JOIN locations l ON a.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (unreadOnly === 'true') {
      query += ' AND a.is_read = false';
    }

    if (alertType && ['LOW_STOCK', 'OVERSTOCK', 'DELAYED_SHIPMENT'].includes(alertType)) {
      query += ' AND a.alert_type = ?';
      params.push(alertType);
    }

    query += ' ORDER BY a.created_at DESC';
    const [alerts] = await db.query(query, params);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

// PUT /api/alerts/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('UPDATE alerts SET is_read = true WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert marked as read successfully', id });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Error updating alert status' });
  }
};

module.exports = {
  getAlerts,
  markAsRead
};
