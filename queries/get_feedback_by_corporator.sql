SELECT F.feedback_id, F.complaint_id, F.feedback_text AS content, F.created_at, C.title
FROM Feedback F
JOIN Complaints C ON F.complaint_id = C.complaint_id
WHERE C.last_updated_by = ? AND F.closed = FALSE
ORDER BY F.created_at DESC
LIMIT 5;
