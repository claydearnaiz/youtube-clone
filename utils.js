// --- HELPER FUNCTIONS ---

/**
 * Formats a number into a compact, human-readable string (e.g., 1.4M, 25K).
 * @param {string} numStr - The number as a string.
 * @returns {string} The formatted number string.
 */
function formatNumber(numStr) {
    if (!numStr) return '0';
    const num = parseInt(numStr, 10);
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toString();
}

/**
 * Converts an ISO 8601 date string to a "time ago" format.
 * @param {string} isoDate - The ISO date string.
 * @returns {string} The relative time string.
 */
function timeAgo(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

/**
 * Formats an ISO 8601 duration string (e.g., PT1M35S) into a human-readable format (e.g., 1:35).
 * @param {string} isoDuration - The ISO duration string.
 * @returns {string} The formatted time string.
 */
function formatDuration(isoDuration) {
    if (!isoDuration) return '';
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    
    const hours = (parseInt(match[1], 10) || 0);
    const minutes = (parseInt(match[2], 10) || 0);
    const seconds = (parseInt(match[3], 10) || 0);

    const s = seconds.toString().padStart(2, '0');
    const m = minutes.toString().padStart(hours > 0 ? 2 : 1, '0');
    
    if (hours > 0) {
        return `${hours}:${m}:${s}`;
    }
    return `${m}:${s}`;
}

/**
 * Creates and returns a DOM element for a single video card for the home/search grid.
 * @param {Object} videoData - Data for a single video.
 * @returns {HTMLElement} The video card element.
 */
function createVideoCard(videoData) {
    const card = document.createElement('div');
    card.className = 'video-card';
    if(videoData.category) {
        card.dataset.category = videoData.category;
    }

    const channelName = videoData.channel?.name || 'Unknown Channel';
    const channelAvatarUrl = videoData.channel?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=random&color=fff`;
    const videoTitle = videoData.title || 'Untitled Video';

    card.innerHTML = `
        <a href="watch.html?v=${videoData.id}" class="video-thumbnail">
            <img src="https://i.ytimg.com/vi/${videoData.id}/hq720.jpg" alt="${videoTitle}" loading="lazy">
            <span class="video-duration">${videoData.duration || ''}</span>
        </a>
        <div class="video-details">
            <a href="#" class="channel-avatar">
                <img src="${channelAvatarUrl}" alt="${channelName}">
            </a>
            <div class="video-meta">
                <a href="watch.html?v=${videoData.id}">
                    <h3 class="video-title">${videoTitle}</h3>
                </a>
                <div class="video-info">
                    <span>${channelName}</span>
                    <span>${videoData.views || '0'} views</span>
                    <span>•</span>
                    <span>${videoData.uploaded || ''}</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

// --- SHARED EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // --- DROPDOWN & THEME LOGIC ---
    const userAvatar = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileDropdown');
    const themeToggle = document.getElementById('themeToggle');

    if (userAvatar && profileDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // --- THEME SWITCHER LOGIC ---
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-mode', currentTheme === 'light');
    if(themeToggle) themeToggle.checked = currentTheme === 'light';

    if(themeToggle) {
        themeToggle.addEventListener('change', () => {
            const isLightMode = themeToggle.checked;
            document.body.classList.toggle('light-mode', isLightMode);
            localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
        });
    }

    // --- SEARCH LOGIC ---
    const searchForm = document.querySelector('.search-container');
    const searchInput = document.getElementById('searchInput');

    if(searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        });
    }
}); 