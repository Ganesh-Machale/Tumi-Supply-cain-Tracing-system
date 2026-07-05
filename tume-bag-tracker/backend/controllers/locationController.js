const db = require('../config/db');

// GET /api/locations
const getLocations = async (req, res) => {
  try {
    const { type, region } = req.query;
    let query = 'SELECT * FROM locations WHERE is_active = true';
    let params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }

    query += ' ORDER BY id DESC';
    const [locations] = await db.query(query, params);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Error fetching locations' });
  }
};

// GET /api/locations/:id
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [locations] = await db.query('SELECT * FROM locations WHERE id = ? AND is_active = true', [id]);
    if (locations.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(locations[0]);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ message: 'Error fetching location details' });
  }
};

// POST /api/locations
const createLocation = async (req, res) => {
  try {
    const { name, type, region, state, contact_person, phone } = req.body;

    if (!name || !type || !region || !state || !contact_person || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['WAREHOUSE', 'DISTRIBUTOR', 'RETAILER'].includes(type)) {
      return res.status(400).json({ message: 'Invalid location type' });
    }

    const [result] = await db.query(
      'INSERT INTO locations (name, type, region, state, contact_person, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, region, state, contact_person, phone]
    );

    res.status(201).json({
      message: 'Location created successfully',
      id: result.insertId,
      name,
      type,
      region,
      state,
      contact_person,
      phone
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Error creating location' });
  }
};

// PUT /api/locations/:id
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, region, state, contact_person, phone } = req.body;

    if (!name || !type || !region || !state || !contact_person || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['WAREHOUSE', 'DISTRIBUTOR', 'RETAILER'].includes(type)) {
      return res.status(400).json({ message: 'Invalid location type' });
    }

    const [result] = await db.query(
      'UPDATE locations SET name = ?, type = ?, region = ?, state = ?, contact_person = ?, phone = ? WHERE id = ?',
      [name, type, region, state, contact_person, phone, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({
      message: 'Location updated successfully',
      id,
      name,
      type,
      region,
      state,
      contact_person,
      phone
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};

module.exports = {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation
};
