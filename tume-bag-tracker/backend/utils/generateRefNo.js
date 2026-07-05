const db = require('../config/db');

const generateRefNo = async () => {
  const currentYear = new Date().getFullYear();
  const pattern = `TBK-${currentYear}-%`;
  
  // Find the latest reference number for the current year
  const [records] = await db.query(
    'SELECT reference_no FROM supply_records WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1',
    [pattern]
  );

  let nextNum = 1;
  if (records.length > 0) {
    const latestRef = records[0].reference_no;
    const parts = latestRef.split('-');
    const latestNum = parseInt(parts[2], 10);
    if (!isNaN(latestNum)) {
      nextNum = latestNum + 1;
    }
  }

  const paddedNum = String(nextNum).padStart(4, '0');
  return `TBK-${currentYear}-${paddedNum}`;
};

module.exports = generateRefNo;
