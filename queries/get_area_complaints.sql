SELECT *
FROM Complaints
WHERE area_id = ?
AND (
    status IN ('PENDING', 'IN_PROGRESS')
    OR (status IN ('RESOLVED', 'REJECTED') AND last_updated_by = ?)
)
ORDER BY created_at DESC
LIMIT 5;
