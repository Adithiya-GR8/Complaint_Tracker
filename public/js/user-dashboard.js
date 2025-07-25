// user-dashboard.js

// DOM Elements
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const newComplaintBtn = document.getElementById('new-complaint-btn');
const viewComplaintsBtn = document.getElementById('view-complaints-btn');
const newComplaintSection = document.getElementById('new-complaint-section');
const viewComplaintsSection = document.getElementById('view-complaints-section');
const feedbackSection = document.getElementById('feedback-section');
const complaintList = document.getElementById('complaint-list');
const pastComplaintList = document.getElementById('past-complaint-list');
const submitComplaintBtn = document.getElementById('submit-complaint-btn');
const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const backToComplaintsBtn = document.getElementById('back-to-complaints-btn');

let userId = null;
let userNameValue = null;

function checkAuth() {
    const role = localStorage.getItem('role');
    if (role !== 'user') {
        console.warn("Unauthorized access. Redirecting to login.");
        return (window.location.href = 'index.html');
    }

    userId = localStorage.getItem('user_id');
    userNameValue = localStorage.getItem('username');

    if (!userId) {
        console.error("No user_id in localStorage.");
        return (window.location.href = 'index.html');
    }

    userName.textContent = `Welcome, ${userNameValue || 'User'}`;
    showSection(newComplaintSection);
}

function handleLogout() {
    const disableAutoLogin = confirm('Would you like to disable automatic login for future visits?');
    if (disableAutoLogin) localStorage.removeItem('auto_login');
    localStorage.clear();
    window.location.href = 'index.html';
}

function showSection(section) {
    newComplaintSection.classList.add('hidden');
    viewComplaintsSection.classList.add('hidden');
    feedbackSection.classList.add('hidden');
    section.classList.remove('hidden');
}

async function loadComplaints() {
    try {
        const response = await fetch(`/api/complaints/${userId}`);
        const complaints = await response.json();

        console.log("Fetched complaints:", complaints);

        const activeComplaints = complaints.filter(c =>
            c.status === 'PENDING' || c.status === 'IN_PROGRESS'
        );

        const pastComplaints = complaints
            .filter(c => c.status === 'RESOLVED' || c.status === 'REJECTED')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        renderComplaints(activeComplaints, complaintList);
        renderComplaints(pastComplaints, pastComplaintList);
    } catch (error) {
        console.error('Error loading complaints:', error);
        complaintList.innerHTML = '<p>Error loading complaints.</p>';
    }
}

function renderComplaints(complaints, container) {
    if (!complaints.length) {
        container.innerHTML = '<p>No complaints found.</p>';
        return;
    }

    container.innerHTML = complaints.map(c => {
    const statusClass = `status-${c.status.toLowerCase().replace(/ /g, '-')}`;
    const isFeedbackAllowed = c.status === 'RESOLVED' || c.status === 'REJECTED';
    const isPastComplaint = c.status === 'RESOLVED' || c.status === 'REJECTED';
    return `
        <div class="complaint-card" data-id="${c.complaint_id}" data-feedback="${isFeedbackAllowed}">
            <div class="complaint-title">${c.title}</div>
            <span class="complaint-status ${statusClass}">${c.status}</span>
            <p><strong>Your complaint:</strong> ${c.description}</p>
            ${c.status_description ? `<p><strong>Corporator response:</strong> ${c.status_description}</p>` : ''}
            <div class="complaint-date">Created: ${new Date(c.created_at).toLocaleString()}</div>
            ${isFeedbackAllowed ? '<button class="btn feedback-btn">Give Feedback</button>' : ''}
        </div>
    `;
    }).join('');


<<<<<<< Updated upstream
    container.querySelectorAll('.feedback-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.complaint-card');
            const complaintId = card.dataset.id;
            showFeedbackForm(complaintId);
        });
=======
    container.querySelectorAll('.complaint-card[data-feedback="true"]').forEach(card => {
    card.addEventListener('click', function(e) {
        // Prevent click if close button was clicked
        if (e.target.classList.contains('close-btn')) return;
        const complaintId = card.dataset.id;
        showFeedbackForm(complaintId);
>>>>>>> Stashed changes
    });
});
// Add event listeners for close buttons
container.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = btn.getAttribute('data-close-id');
        closeComplaint(id);
    });
});
}

async function closeComplaint(id) {
  const el = document.querySelector(`.complaint-card[data-id=\"${id}\"]`);
  if (el) el.remove();

  try {
    const response = await fetch(`/api/complaints/${id}/close`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to close complaint');
    }

    console.log(`Complaint ${id} marked as closed.`);
  } catch (err) {
    console.error('Error closing complaint:', err);
  }
}


function showFeedbackForm(complaintId) {
    console.log("Opening feedback form for complaint ID:", complaintId);
    document.getElementById('fb-complaintid').value = complaintId;
    showSection(feedbackSection);
}

async function submitComplaint() {
    const title = document.getElementById('comp-title').value.trim();
    const description = document.getElementById('comp-description').value.trim();

    if (!title || !description) {
        console.warn("Complaint title or description missing");
        return alert('Please fill in all fields');
    }

    try {
        const res = await fetch('/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, title, description })
        });

        const data = await res.json();
        console.log("Submit complaint response:", data);

        if (res.ok) {
            alert('Complaint submitted!');
            document.getElementById('comp-title').value = '';
            document.getElementById('comp-description').value = '';
            showSection(viewComplaintsSection);
            loadComplaints();
        } else {
            console.error("Complaint submission failed:", data.error);
            alert(data.error);
        }
    } catch (error) {
        console.error("Error during complaint submission:", error);
        alert('An error occurred while submitting the complaint.');
    }
}

async function submitFeedback() {
    const complaintId = document.getElementById('fb-complaintid').value;
    const feedbackText = document.getElementById('fb-text').value;
    const rating = document.getElementById('fb-rating').value;

    if (!feedbackText || !rating) return alert('Please fill in all fields');

    const payload = {
        user_id: userId,
        complaint_id: complaintId,
        feedback_text: feedbackText,
        rating
    };

    console.log('Submitting feedback with payload:', payload);

    try {
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const contentType = res.headers.get('content-type');

        if (!res.ok) {
            console.error(`Fetch failed: ${res.status}`, await res.text());
            alert('Feedback submission failed. Check the console for more details.');
            return;
        }

        if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            console.log('Feedback submission response:', data);
            alert('Feedback submitted!');
            document.getElementById('fb-text').value = '';
            document.getElementById('fb-rating').value = '';
            showSection(viewComplaintsSection);
        } else {
            console.warn('Unexpected response type:', contentType);
            alert('Unexpected server response. Please try again.');
        }

    } catch (error) {
        console.error('Error during feedback submission:', error);
        alert('An error occurred while submitting feedback.');
    }
}


document.addEventListener('DOMContentLoaded', checkAuth);
logoutBtn.addEventListener('click', handleLogout);
newComplaintBtn?.addEventListener('click', () => showSection(newComplaintSection));
viewComplaintsBtn?.addEventListener('click', () => {
    showSection(viewComplaintsSection);
    loadComplaints();
});
submitComplaintBtn?.addEventListener('click', submitComplaint);
submitFeedbackBtn?.addEventListener('click', submitFeedback);
const closeFeedbackBtn = document.getElementById('close-feedback-btn');
backToComplaintsBtn?.addEventListener('click', () => showSection('my-complaints'));
closeFeedbackBtn?.addEventListener('click', () => {
    const complaintId = document.getElementById('fb-complaintid').value;
    closeComplaint(complaintId);
    showSection('my-complaints');
});
