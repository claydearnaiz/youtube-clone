document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const videoGrid = document.getElementById('videoGrid');
    const categoryTabs = document.getElementById('categoryTabs');

    // --- EVENT LISTENERS ---
    menuBtn.addEventListener('click', toggleSidebar);
    if(categoryTabs) {
        categoryTabs.addEventListener('click', handleCategoryFilter);
    }

    // --- FUNCTIONS ---

    /**
     * Toggles the sidebar visibility and adjusts the main content margin.
     */
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');
    }

    /**
     * Handles clicks on category tabs to filter videos.
     * @param {Event} e - The click event.
     */
    function handleCategoryFilter(e) {
        if (e.target.classList.contains('category-tab')) {
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            loadVideos(category);
        }
    }

    /**
     * Loads videos into the grid, optionally filtering by category.
     * @param {string} category - The category to filter by (e.g., 'gaming', 'music').
     */
    async function loadVideos(category = 'all') {
        videoGrid.innerHTML = '<p class="loading-text">Loading videos...</p>';
        try {
            const videos = await fetchVideos(category);
            renderVideos(videos);
        } catch (error) {
            videoGrid.innerHTML = `<p class="error-text">Failed to load videos. ${error.message}</p>`;
        }
    }

    /**
     * Fetches videos from the YouTube API based on a category.
     * @param {string} category The category to fetch. 'all' fetches a random popular category.
     * @returns {Promise<Array<Object>>} A promise that resolves with video data.
     */
    async function fetchVideos(category = 'all') {
        const BASE_URL = 'https://www.googleapis.com/youtube/v3';
        
        const popularQueries = [
            'Software Engineering', 'Productivity Hacks', 'ReactJS Tutorials', 'JavaScript Crash Course', 'DIY Home Projects', 
            'Space Documentaries', 'Healthy Cooking Recipes', 'Workout Motivation 2024', 'Latest Financial News', 'Stand Up Comedy Specials',
            'Unreal Engine 5 Showcases', 'AI and Machine Learning', 'Formula 1 Highlights', 'Travel Vlogs Bali'
        ];

        try {
            let url;
            let query = category;
            if (category === 'all') {
                const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
                query = randomQuery;
            }
            
            url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=24&key=${API_KEY}`;

            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error.message}`);
            }

            const data = await response.json();

            if (data.items.length === 0) {
                return [];
            }
            
            const videoIds = data.items.map(item => item.id.videoId).join(',');
            
            const detailsUrl = `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            if (!detailsResponse.ok) {
                throw new Error('Failed to fetch video details');
            }
            const detailsData = await detailsResponse.json();
            
            return detailsData.items;

        } catch (error) {
            console.error('Error fetching videos:', error);
            videoGrid.innerHTML = `<p class="error-text">Failed to load videos. ${error.message}</p>`;
            return [];
        }
    }

    /**
     * Renders an array of video data into the video grid.
     * @param {Array<Object>} videos The array of video data.
     */
    function renderVideos(videos) {
        if (!videos || videos.length === 0) {
            videoGrid.innerHTML = '<p class="error-text">No videos found. The API might be unavailable or the category is empty.</p>';
            return;
        }
        
        videoGrid.innerHTML = ''; // Clear previous results
        videos.forEach(video => {
            const videoCard = createVideoCard({
                id: video.id,
                title: video.snippet.title,
                channel: {
                    name: video.snippet.channelTitle,
                    avatar: null 
                },
                views: video.statistics ? formatNumber(video.statistics.viewCount) : '0',
                uploaded: timeAgo(video.snippet.publishedAt),
                duration: video.contentDetails ? formatDuration(video.contentDetails.duration) : '',
                category: video.snippet.categoryId
            });

            if(video.contentDetails?.duration) {
                videoGrid.appendChild(videoCard);
            }
        });
    }

    /**
     * Initializes the page by fetching and rendering videos for the active category.
     */
    async function init() {
        const activeTab = document.querySelector('.category-tab.active');
        const initialCategory = activeTab ? activeTab.dataset.category : 'all';
        await loadVideos(initialCategory);
    }

    // --- INITIALIZATION ---
    init();
}); 