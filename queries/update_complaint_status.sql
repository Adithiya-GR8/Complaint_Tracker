UPDATE Complaints
SET status = ?,
    status_description = ?,
    last_updated_by = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE complaint_id = ?;
