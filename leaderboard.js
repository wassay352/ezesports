// ===================================
// LEADERBOARD.JS
// Handles tournament display and leaderboard calculations
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the tournaments page
    if (!document.getElementById('tournaments-grid')) {
        return;
    }
    
    // DOM Elements
    const tournamentsGrid = document.getElementById('tournaments-grid');
    const tournamentListView = document.getElementById('tournament-list-view');
    const leaderboardView = document.getElementById('leaderboard-view');
    const backToTournamentsBtn = document.getElementById('back-to-tournaments');
    const tournamentNameEl = document.getElementById('tournament-name');
    const tournamentDateEl = document.getElementById('tournament-date');
    const tournamentMatchesEl = document.getElementById('tournament-matches');
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    // Load tournaments on page load
    loadTournaments();
    
    // Back to tournaments button
    if (backToTournamentsBtn) {
        backToTournamentsBtn.addEventListener('click', function() {
            leaderboardView.style.display = 'none';
            tournamentListView.style.display = 'block';
        });
    }
    
    // ===================================
    // LOAD TOURNAMENTS
    // ===================================
    
    function loadTournaments() {
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        
        if (tournaments.length === 0) {
            tournamentsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <h3>No Tournaments Yet</h3>
                    <p>Tournaments will appear here once created by admin</p>
                </div>
            `;
            return;
        }
        
        // Sort tournaments by date (most recent first)
        tournaments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tournamentsGrid.innerHTML = tournaments.map(tournament => `
            <div class="tournament-card" onclick="viewLeaderboard('${tournament.id}')">
                <div class="tournament-icon">🏆</div>
                <h3>${tournament.name}</h3>
                <div class="tournament-meta">
                    <span>📅 ${formatDate(tournament.date)}</span>
                    <span>🎮 ${tournament.totalMatches} Matches</span>
                </div>
                <a href="#" class="view-leaderboard" onclick="event.preventDefault();">View Leaderboard →</a>
            </div>
        `).join('');
    }
    
    // ===================================
    // VIEW LEADERBOARD
    // ===================================
    
    window.viewLeaderboard = function(tournamentId) {
        const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
        const tournament = tournaments.find(t => t.id === tournamentId);
        
        if (!tournament) {
            showToast('Tournament not found', 'error');
            return;
        }
        
        // Update tournament info
        tournamentNameEl.textContent = tournament.name;
        tournamentDateEl.textContent = formatDate(tournament.date);
        tournamentMatchesEl.textContent = `${tournament.totalMatches} Matches`;
        
        // Calculate and display leaderboard
        const leaderboard = calculateLeaderboard(tournamentId);
        displayLeaderboard(leaderboard);
        
        // Switch views
        tournamentListView.style.display = 'none';
        leaderboardView.style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // ===================================
    // CALCULATE LEADERBOARD
    // ===================================
    
    function calculateLeaderboard(tournamentId) {
        const matches = JSON.parse(localStorage.getItem('matches') || '[]');
        
        // Filter matches for this tournament
        const tournamentMatches = matches.filter(m => m.tournamentId === tournamentId);
        
        if (tournamentMatches.length === 0) {
            return [];
        }
        
        // Group matches by team
        const teamStats = {};
        
        tournamentMatches.forEach(match => {
            const teamName = match.teamName;
            
            if (!teamStats[teamName]) {
                teamStats[teamName] = {
                    teamName: teamName,
                    matchesPlayed: 0,
                    totalKills: 0,
                    totalPlacementPoints: 0,
                    totalPoints: 0
                };
            }
            
            // Aggregate stats
            teamStats[teamName].matchesPlayed += 1;
            
            // Calculate kills from kill points (assuming 1 kill = 1 point, adjust if different)
            teamStats[teamName].totalKills += match.killPoints;
            
            teamStats[teamName].totalPlacementPoints += match.placementPoints;
            teamStats[teamName].totalPoints += match.totalPoints;
        });
        
        // Convert to array
        const leaderboard = Object.values(teamStats);
        
        // Sort by total points (descending), then by kills (descending)
        leaderboard.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            return b.totalKills - a.totalKills;
        });
        
        // Add rank
        leaderboard.forEach((team, index) => {
            team.rank = index + 1;
        });
        
        return leaderboard;
    }
    
    // ===================================
    // DISPLAY LEADERBOARD
    // ===================================
    
    function displayLeaderboard(leaderboard) {
        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <h3>No Match Data</h3>
                            <p>Match data will appear here once added by admin</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        leaderboardBody.innerHTML = leaderboard.map(team => {
            const rankClass = team.rank === 1 ? 'rank-1' : '';
            const rankBadgeClass = team.rank <= 3 ? `rank-${team.rank}` : '';
            
            return `
                <tr class="${rankClass}">
                    <td>
                        <div class="rank-badge ${rankBadgeClass}">${team.rank}</div>
                    </td>
                    <td class="team-col">${team.teamName}</td>
                    <td class="matches-col">${team.matchesPlayed}</td>
                    <td class="kills-col">${team.totalKills}</td>
                    <td class="placement-col">${team.totalPlacementPoints}</td>
                    <td class="total-col">
                        <span class="points-highlight">${team.totalPoints}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }
});

// ===================================
// HELPER FUNCTIONS
// ===================================

// Format date (if not already defined in app.js)
if (typeof formatDate === 'undefined') {
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}

// Show toast (if not already defined in app.js)
if (typeof showToast === 'undefined') {
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<div class="toast-message">${message}</div>`;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
}
