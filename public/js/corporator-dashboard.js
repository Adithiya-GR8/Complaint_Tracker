const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const reviewBtn = document.getElementById('view-area-complaints-btn');
const reviewSection = document.getElementById('area-complaints-section');
const complaintList = document.getElementById('area-complaint-list');
const feedbackSection = document.getElementById('feedback-section');
const corpActionsSection = document.getElementById('corp-actions');
const complaintIdInput = document.getElementById('corp-complaint-id');
const statusSelect = document.getElementById('corp-status');
const statusDesc = document.getElementById('corp-status-desc');
const submitStatusBtn = document.getElementById('submit-status-btn');

let corporatorId, corpAreaId, corpName;

window.addEventListener('DOMContentLoaded', () => {
  const loggedInCorporator = localStorage.getItem('loggedInCorporator');
  if (!loggedInCorporator) {
    console.error('Missing loggedInCorporator in localStorage. Redirecting to login.');
    window.location.href = 'index.html';
    return;
  }
  try {
    const corpData = JSON.parse(loggedInCorporator);
    corporatorId = corpData.corporator_id;
    corpAreaId = corpData.area_id;
    corpName = corpData.full_name;
  } catch (e) {
    console.error('Failed to parse loggedInCorporator:', e);
    window.location.href = 'index.html';
    return;
  }

  if (!corporatorId || !corpAreaId || !corpName) {
    console.error('Missing required corporator values. Redirecting to login.');
    window.location.href = 'index.html';
    return;
  }

  console.log('Corporator loaded:', corporatorId, corpAreaId);
  userName.textContent = `Welcome, ${corpName}`;
  loadAreaComplaints();
  loadFeedback();
});

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'index.html';
});

reviewBtn.addEventListener('click', () => {
  reviewSection.classList.remove('hidden');
  corpActionsSection.classList.add('hidden');
  loadAreaComplaints();
  loadFeedback();
});

submitStatusBtn.addEventListener('click', async () => {
  const complaintId = complaintIdInput.value;
  const newStatus = statusSelect.value;
  const description = statusDesc.value;

  if (!complaintId || !newStatus || !description) {
    alert('All fields are required.');
    console.warn('Validation failed: Missing field(s).');
    return;
  }

  try {
    const res = await fetch(`/api/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, description, corporator_id: corporatorId })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Status updated successfully.');
      console.log('Status update successful:', data);
      corpActionsSection.classList.add('hidden');
      reviewSection.classList.remove('hidden');
      loadAreaComplaints();
      loadFeedback();
    } else {
      alert(data.error || 'Failed to update status.');
      console.error('Server error during status update:', data);
    }
  } catch (err) {
    alert('Error while updating status.');
    console.error('Fetch error during status update:', err);
  }
});

async function loadAreaComplaints() {
  if (!corpAreaId || !corporatorId) {
    console.error('Missing or invalid area_id or corporator_id from localStorage:', corpAreaId, corporatorId);
    return;
  }

  console.log('Loading complaints for area ID:', corpAreaId);

  try {
    const res = await fetch(`/api/area-complaints/${corpAreaId}?corporator_id=${corporatorId}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Fetch failed:', res.status, errorText);
      throw new Error('Failed to fetch complaints.');
    }

    const complaints = await res.json();
    console.log('Complaints received:', complaints);

    if (complaints.length === 0) {
      complaintList.innerHTML = '<p>No complaints found for your area.</p>';
      return;
    }

    // Show only the latest 5 complaints
    const latestComplaints = complaints.slice(0, 5);

    complaintList.innerHTML = latestComplaints.map(c => `
      <div class="complaint-card">  
        <h4>${c.title}</h4>
        <p>${c.description}</p>
        <p>Status: <strong>${c.status}</strong></p>
        <button onclick="viewComplaint('${c.complaint_id}')">Take Action</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error fetching complaints:', err);
    complaintList.innerHTML = '<p>Error loading complaints.</p>';
  }
}


async function loadFeedback() {
  if (!corporatorId) {
    console.warn('Missing corporator ID for feedback loading.');
    return;
  }

  try {
    const res = await fetch(`/api/corporator-feedback/${corporatorId}`);
    const feedbacks = await res.json();

    console.log('Raw feedback data:', feedbacks); // <-- Add this

    if (!res.ok) {
      console.error('Error fetching feedback:', feedbacks);
      feedbackSection.innerHTML = '<p>Error loading feedback.</p>';
      return;
    }

    if (!feedbacks.length) {
      feedbackSection.innerHTML = '<p>No feedback available.</p>';
      console.warn('No feedbacks returned from API.');
      return;
    }

    feedbackSection.innerHTML = feedbacks.map(f => `
      <div class="feedback-card" id="feedback-${f.feedback_id}">
        <h4>${f.title}</h4>
        <p><strong>Feedback:</strong> ${f.content}</p>
        <small>${new Date(f.created_at).toLocaleString()}</small>
        <button onclick="closeFeedback(${f.feedback_id})">Close</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load feedback:', err);
    feedbackSection.innerHTML = '<p>Error loading feedback.</p>';
  }
}



function closeFeedback(id) {
  const el = document.getElementById(`feedback-${id}`);
  if (el) {
    console.log(`Closing feedback ${id}`);
    el.remove();
  } else {
    console.warn(`No feedback element found for id ${id}`);
  }
}

async function closeFeedback(id) {
  const el = document.getElementById(`feedback-${id}`);
  if (el) el.remove();

  try {
    const response = await fetch(`/api/feedback/${id}/close`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to close feedback');
    }

    console.log(`Feedback ${id} marked as closed.`);
  } catch (err) {
    console.error('Error closing feedback:', err);
  }
}


function viewComplaint(id) {
  complaintIdInput.value = id;
  corpActionsSection.classList.remove('hidden');
  reviewSection.classList.add('hidden');
}
