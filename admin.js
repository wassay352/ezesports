// ===================================
// ADMIN.JS
// Handles admin authentication and tournament/match management
// ===================================

// Admin credentials (hardcoded for front-end only)

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Check if user is logged in
function checkAdminAuth() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Form elements
const createTournamentForm = document.getElementById('create-tournament-form');
const addMatchForm = document.getElementById('add-match-form');

// Display elements
const adminTournamentsList = document.getElementById('admin-tournaments-list');
const matchTournamentSelect = document.getElementById('match-tournament-select');
const recentEntries = document.getElementById('recent-entries');

// ===================================
// AUTHENTICATION
// ===================================

if (loginForm) {
    // Check if already logged in
    if (checkAdminAuth()) {
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadAdminDashboard();
    }

    // Handle login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            loginScreen.style.display = 'none';
            adminDashboard.style.display = 'block';
            loadAdminDashboard();
            showToast('Login successful!', 'success');
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.style.display = 'block';
            
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    });
}

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        location.reload();
    });
}

// ===================================
// TAB SWITCHING
// ===================================

tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// ===================================
// TOURNAMENT MANAGEMENT
// ===================================

// Create Tournament
if (createTournamentForm) {
    createTournamentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tournamentName = document.getElementById('tournament-name-input').value;
        const tournamentDate = document.getElementById('tournament-date-input').value;
        const totalMatches = document.getElementById('tournament-matches-input').value;
        
        // Get existing tournaments
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        
        // Create new tournament
        const newTournament = {
            id: generateId(),
            name: tournamentName,
            date: tournamentDate,
            totalMatches: parseInt(totalMatches),
            createdAt: new Date().toISOString()
        };
        
        // Add to tournaments array
        tournaments.push(newTournament);
        
        // Save to localStorage
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
        
        // Reset form
        createTournamentForm.reset();
        
        // Reload tournament list
        loadTournamentsList();
        updateTournamentSelect();
        
        showToast('Tournament created successfully!', 'success');
    });
}

// Load tournaments list in admin
function loadTournamentsList() {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    
    if (tournaments.length === 0) {
        adminTournamentsList.innerHTML = '<div class="empty-state"><p>No tournaments created yet</p></div>';
        return;
    }
    
    adminTournamentsList.innerHTML = tournaments.map(tournament => `
        <div class="admin-tournament-item">
            <div class="admin-tournament-info">
                <h4>${tournament.name}</h4>
                <p>Date: ${formatDate(tournament.date)} | Total Matches: ${tournament.totalMatches}</p>
            </div>
            <button class="delete-tournament" onclick="deleteTournament('${tournament.id}')">DELETE</button>
        </div>
    `).join('');
}

// Delete tournament
function deleteTournament(tournamentId) {
    if (!confirm('Are you sure you want to delete this tournament? All match data will be lost.')) {
        return;
    }
    
    // Get tournaments
    let tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    
    // Remove tournament
    tournaments = tournaments.filter(t => t.id !== tournamentId);
    
    // Save
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    
    // Delete all matches for this tournament
    let matches = JSON.parse(localStorage.getItem('matches') || '[]');
    matches = matches.filter(m => m.tournamentId !== tournamentId);
    localStorage.setItem('matches', JSON.stringify(matches));
    
    // Reload
    loadTournamentsList();
    updateTournamentSelect();
    loadRecentEntries();
    
    showToast('Tournament deleted successfully!', 'success');
}

// Update tournament select dropdown
function updateTournamentSelect() {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    
    if (matchTournamentSelect) {
        matchTournamentSelect.innerHTML = '<option value="">-- Select Tournament --</option>' +
            tournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
}

// ===================================
// MATCH DATA MANAGEMENT
// ===================================

// Calculate total points in real-time
const placementPointsInput = document.getElementById('placement-points-input');
const killPointsInput = document.getElementById('kill-points-input');
const totalPointsDisplay = document.getElementById('total-points-display');

if (placementPointsInput && killPointsInput) {
    function updateTotalPoints() {
        const placementPoints = parseInt(placementPointsInput.value) || 0;
        const killPoints = parseInt(killPointsInput.value) || 0;
        const total = placementPoints + killPoints;
        totalPointsDisplay.textContent = total;
    }
    
    placementPointsInput.addEventListener('input', updateTotalPoints);
    killPointsInput.addEventListener('input', updateTotalPoints);
}

// Add Match Data
if (addMatchForm) {
    addMatchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tournamentId = document.getElementById('match-tournament-select').value;
        const matchNumber = document.getElementById('match-number-input').value;
        const teamName = document.getElementById('team-name-input').value;
        const placementPosition = document.getElementById('placement-position-input').value;
        const placementPoints = document.getElementById('placement-points-input').value;
        const killPoints = document.getElementById('kill-points-input').value;
        
        if (!tournamentId) {
            showToast('Please select a tournament', 'error');
            return;
        }
        
        // Get existing matches
        const matches = JSON.parse(localStorage.getItem('matches') || '[]');
        
        // Create new match entry
        const newMatch = {
            id: generateId(),
            tournamentId: tournamentId,
            matchNumber: parseInt(matchNumber),
            teamName: teamName,
            placementPosition: parseInt(placementPosition),
            placementPoints: parseInt(placementPoints),
            killPoints: parseInt(killPoints),
            totalPoints: parseInt(placementPoints) + parseInt(killPoints),
            createdAt: new Date().toISOString()
        };
        
        // Add to matches array
        matches.push(newMatch);
        
        // Save to localStorage
        localStorage.setItem('matches', JSON.stringify(matches));
        
        // Reset form
        addMatchForm.reset();
        updateTotalPoints();
        
        // Reload recent entries
        loadRecentEntries();
        
        showToast('Match data added successfully!', 'success');
    });
}

// Load recent entries
function loadRecentEntries() {
    const matches = JSON.parse(localStorage.getItem('matches') || '[]');
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    
    if (matches.length === 0) {
        recentEntries.innerHTML = '<div class="empty-state"><p>No match data added yet</p></div>';
        return;
    }
    
    // Sort by creation date (most recent first)
    const sortedMatches = matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Show last 10 entries
    const recentMatches = sortedMatches.slice(0, 10);
    
    recentEntries.innerHTML = recentMatches.map(match => {
        const tournament = tournaments.find(t => t.id === match.tournamentId);
        const tournamentName = tournament ? tournament.name : 'Unknown Tournament';
        
        return `
            <div class="entry-item">
                <strong>${tournamentName}</strong> - Match ${match.matchNumber}<br>
                Team: ${match.teamName} | Position: ${match.placementPosition} | 
                Placement Pts: ${match.placementPoints} | Kill Pts: ${match.killPoints} | 
                <strong>Total: ${match.totalPoints}</strong>
            </div>
        `;
    }).join('');
}

// ===================================
// LOAD DASHBOARD
// ===================================

function loadAdminDashboard() {
    loadTournamentsList();
    updateTournamentSelect();
    loadRecentEntries();
}

// ===================================
// UTILITY FUNCTIONS (FIXED & REQUIRED)
// ===================================

// Generate unique ID
function generateId() {
    return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// Format date (YYYY-MM-DD → 28 Jan 2026)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Toast notification system
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
