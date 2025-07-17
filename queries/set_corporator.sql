INSERT INTO CorporatorInfo (area_id, full_name, email, password_hash)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    area_id = VALUES(area_id);
