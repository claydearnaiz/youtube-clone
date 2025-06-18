document.addEventListener('DOMContentLoaded', () => {
    const searchResultsTitle = document.getElementById('searchResultsTitle');
    const searchResultsGrid = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');

    const API_KEY = 'AIzaSyBfbv1YRGe_jLlJdbEVUK_8MQ6dKe2hHf4';
    const BASE_URL = 'https://www.googleapis.com/youtube/v3';

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (query) {
        searchResultsTitle.textContent = `Search results for "${query}"`;
        searchInput.value = query;
        loadSearchResults(query);
    } else {
        searchResultsTitle.textContent = 'Please enter a search term.';
    }

    async function loadSearchResults(q) {
        searchResultsGrid.innerHTML = '<p class="loading-text">Searching...</p>';
        
        try {
            const videos = await fetchSearchResults(q);
            renderSearchResults(videos);
        } catch (error) {
            searchResultsGrid.innerHTML = `<p class="error-text">Failed to load search results. ${error.message}</p>`;
        }
    }

    async function fetchSearchResults(q) {
        const url = `${BASE_URL}/search?part=snippet&q=${q}&type=video&maxResults=25&key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch search results.');
        const data = await response.json();
        
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        const detailsUrl = `${BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        return data.items.map(item => {
            const detailItem = detailsData.items.find(d => d.id === item.id.videoId);
            return {
                id: item.id.videoId,
                title: item.snippet.title,
                channel: { name: item.snippet.channelTitle },
                views: detailItem ? formatNumber(detailItem.statistics.viewCount) : 'N/A',
                uploaded: timeAgo(item.snippet.publishedAt),
                duration: detailItem ? formatDuration(detailItem.contentDetails.duration) : 'N/A',
            };
        });
    }

    function renderSearchResults(videos) {
        searchResultsGrid.innerHTML = '';
        if (videos.length === 0) {
            searchResultsGrid.innerHTML = '<p>No results found.</p>';
            return;
        }
        videos.forEach(video => {
            // Re-using the createVideoCard function from utils.js
            const card = createVideoCard(video);
            searchResultsGrid.appendChild(card);
        });
    }
}); 