document.addEventListener('DOMContentLoaded', () => {
    const searchResultsContainer = document.getElementById('searchResults');
    const queryHeading = document.getElementById('searchQueryHeading');
    
    const query = getQueryFromURL();

    if (query) {
        queryHeading.textContent = `Search results for "${query}"`;
        fetchAndRenderResults(query);
    } else {
        queryHeading.textContent = 'Please enter a search term.';
    }

    function getQueryFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('q');
    }

    async function fetchAndRenderResults(searchQuery) {
        try {
            const searchParams = new URLSearchParams({
                endpoint: 'search',
                part: 'snippet',
                q: encodeURIComponent(searchQuery),
                type: 'video',
                maxResults: 25
            });
            const searchResponse = await fetch(`/api/youtube?${searchParams}`);
            const searchData = await searchResponse.json();

            if (!searchResponse.ok) throw new Error(searchData.error?.message || 'Failed to fetch search results');
            if (searchData.items.length === 0) {
                searchResultsContainer.innerHTML = '<p>No results found.</p>';
                return;
            }

            const videoIds = searchData.items.map(item => item.id.videoId).join(',');
            
            const detailsParams = new URLSearchParams({
                endpoint: 'videos',
                part: 'statistics,contentDetails',
                id: videoIds
            });
            const detailsResponse = await fetch(`/api/youtube?${detailsParams}`);
            const detailsData = await detailsResponse.json();

            if (!detailsResponse.ok) throw new Error(detailsData.error?.message || 'Failed to fetch video details');

            const combinedResults = searchData.items.map(item => {
                const details = detailsData.items.find(d => d.id === item.id.videoId);
                return {
                    ...item,
                    statistics: details?.statistics,
                    contentDetails: details?.contentDetails
                };
            });

            renderSearchResults(combinedResults);

        } catch (error) {
            console.error('Error fetching search results:', error);
            searchResultsContainer.innerHTML = `<p class="error-text">Failed to load search results.</p>`;
        }
    }

    function renderSearchResults(results) {
        searchResultsContainer.innerHTML = ''; // Clear existing
        results.forEach(item => {
            const resultCard = createSearchResultCard(item);
            searchResultsContainer.appendChild(resultCard);
        });
    }

    function createSearchResultCard(itemData) {
        const card = document.createElement('div');
        card.className = 'search-result-card';

        const snippet = itemData.snippet;
        const videoId = itemData.id.videoId;
        const viewCount = itemData.statistics ? formatNumber(itemData.statistics.viewCount) : 'N/A';
        const duration = itemData.contentDetails ? formatDuration(itemData.contentDetails.duration) : '';

        card.innerHTML = `
            <a href="watch.html?v=${videoId}" class="search-thumbnail">
                <img src="${snippet.thumbnails.medium.url}" alt="${snippet.title}" loading="lazy">
                <span class="video-duration">${duration}</span>
            </a>
            <div class="search-details">
                <a href="watch.html?v=${videoId}">
                    <h3 class="search-video-title">${snippet.title}</h3>
                </a>
                <div class="search-video-stats">
                    <span>${viewCount} views</span>
                    <span>•</span>
                    <span>${timeAgo(snippet.publishedAt)}</span>
                </div>
                <div class="search-channel-info">
                    <img src="https://ui-avatars.com/api/?name=${snippet.channelTitle.replace(/\s+/g, '+')}&background=random" alt="${snippet.channelTitle}" class="channel-avatar-sm" loading="lazy">
                    <span>${snippet.channelTitle}</span>
                </div>
                <p class="search-video-description">${snippet.description}</p>
            </div>
        `;
        return card;
    }
}); 