const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users (ADMIN only)
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id DESC');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users list' });
  }
};

// PUT /api/users/:id/role (ADMIN only)
const changeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid or missing role value' });
    }

    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', id, role });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ message: 'Error changing user role' });
  }
};

// PUT /api/users/:id/deactivate (ADMIN only)
const toggleDeactivate = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ message: 'Missing is_active boolean flag' });
    }

    // Prevent self-deactivation
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const [result] = await db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User account is now ${is_active ? 'active' : 'deactivated'}`, id, is_active });
  } catch (error) {
    console.error('Error toggling user active state:', error);
    res.status(500).json({ message: 'Error toggling user active state' });
  }
};

// PUT /api/users/change-password (Authenticated User)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    // Retrieve current password hash
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    const isOldValid = bcrypt.compareSync(oldPassword, user.password_hash);
    if (!isOldValid) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash and save new password
    const salt = bcrypt.genSaltSync(12);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
};

module.exports = {
  getUsers,
  changeRole,
  toggleDeactivate,
  changePassword
};
