document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const channelName = document.getElementById('channelName');
    const channelAvatar = document.getElementById('channelAvatar');
    const subscriberCount = document.getElementById('subscriberCount');
    const likeCount = document.getElementById('likeCount');
    const videoDescription = document.getElementById('videoDescription');
    const commentsContainer = document.getElementById('commentsContainer');
    const recommendations = document.getElementById('recommendations');
    const commentCount = document.getElementById('commentCount');
    const newCommentInput = document.getElementById('newCommentInput');
    const submitCommentBtn = document.getElementById('submitCommentBtn');
    const cancelCommentBtn = document.getElementById('cancelCommentBtn');
    const commentButtons = document.querySelector('.comment-buttons');

    // --- LOCAL "DATABASE" ---
    // Simulates a backend by using localStorage to store user-generated content.
    const localComments = JSON.parse(localStorage.getItem('yt-clone-comments')) || {};
    const localLikes = JSON.parse(localStorage.getItem('yt-clone-likes')) || {};

    // --- INITIALIZATION ---
    const BASE_URL = 'https://www.googleapis.com/youtube/v3';
    const videoId = getVideoIdFromURL();

    if (videoId) {
        loadWatchPage(videoId);
    } else {
        document.body.innerHTML = '<h1>Error: Video ID not found in URL.</h1>';
    }

    // --- EVENT LISTENERS ---
    newCommentInput.addEventListener('focus', () => {
        commentButtons.style.display = 'flex';
    });

    newCommentInput.addEventListener('input', () => {
        submitCommentBtn.disabled = newCommentInput.value.trim() === '';
    });

    cancelCommentBtn.addEventListener('click', () => {
        newCommentInput.value = '';
        submitCommentBtn.disabled = true;
        commentButtons.style.display = 'none';
        newCommentInput.blur();
    });

    submitCommentBtn.addEventListener('click', () => {
        handleNewComment();
    });

    // --- FUNCTIONS ---
    function getVideoIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('v');
    }

    async function loadWatchPage(videoId) {
        try {
            const [videoData, commentsData] = await Promise.all([
                fetchVideoDetails(videoId),
                fetchComments(videoId),
                // Recommendations are fetched after the main content
            ]);

            if (!videoData) {
                document.body.innerHTML = `<h1>Error: Video with ID "${videoId}" not found.</h1>`;
                return;
            }

            populateVideoDetails(videoData);
            populateComments(commentsData);
            
            // Fetch recommendations separately
            fetchRecommendations(videoId).then(populateRecommendations);

        } catch (error) {
            console.error('Error loading watch page:', error);
            document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
        }
    }

    async function fetchVideoDetails(id) {
        const url = `${BASE_URL}/videos?part=snippet,statistics&id=${id}&key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch video details');
        const data = await response.json();
        return data.items[0];
    }

    async function fetchComments(id) {
        const url = `${BASE_URL}/commentThreads?part=snippet&videoId=${id}&maxResults=20&order=relevance&key=${API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) { console.error("Could not fetch comments"); return []; }
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.error("Error fetching API comments:", error);
            return []; // Return empty array on fetch failure
        }
    }

    async function fetchRecommendations(id) {
        const url = `${BASE_URL}/search?part=snippet&relatedToVideoId=${id}&type=video&maxResults=15&key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) { console.error("Could not fetch recommendations"); return []; }
        const data = await response.json();
        return data.items;
    }
    
    async function fetchChannelDetails(channelId) {
        const url = `${BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch channel details');
        const data = await response.json();
        return data.items[0];
    }

    function populateVideoDetails(data) {
        const snippet = data.snippet;
        const stats = data.statistics;

        videoPlayer.src = `https://www.youtube.com/embed/${data.id}?autoplay=1`;
        videoTitle.textContent = snippet.title;
        videoDescription.textContent = snippet.description;
        
        likeCount.textContent = formatNumber(stats.likeCount);
        commentCount.textContent = `${formatNumber(stats.commentCount)} Comments`;

        fetchChannelDetails(snippet.channelId).then(channel => {
            if (!channel) return;
            channelName.textContent = channel.snippet.title;
            subscriberCount.textContent = `${formatNumber(channel.statistics.subscriberCount)} subscribers`;
            if (channel.snippet.thumbnails && channel.snippet.thumbnails.default) {
                channelAvatar.src = channel.snippet.thumbnails.default.url;
            }
        });
    }

    function populateComments(apiComments) {
        commentsContainer.innerHTML = '';
        const videoComments = localComments[videoId] || [];
        
        // Display new local comments first
        videoComments.slice().reverse().forEach(comment => {
            const commentEl = createCommentElement(comment, true);
            commentsContainer.appendChild(commentEl);
        });
        
        // Display comments from API
        if (apiComments) {
            apiComments.forEach(commentThread => {
                const comment = commentThread.snippet.topLevelComment;
                const commentEl = createCommentElement(comment);
                commentsContainer.appendChild(commentEl);
            });
        }
        
        const totalComments = (apiComments ? apiComments.length : 0) + videoComments.length;
        commentCount.textContent = `${formatNumber(totalComments)} Comments`;
    }

    function populateRecommendations(videos) {
        if (!videos || videos.length === 0) {
            recommendations.innerHTML = '<p>No recommendations found.</p>';
            return;
        }
        recommendations.innerHTML = '';
        videos.forEach(video => {
            const recCard = createRecommendationCard(video);
            recommendations.appendChild(recCard);
        });
    }

    function createRecommendationCard(videoData) {
        const snippet = videoData.snippet;
        const card = document.createElement('a');
        card.href = `watch.html?v=${videoData.id.videoId}`;
        card.className = 'rec-video-card';
        card.innerHTML = `
            <img src="${snippet.thumbnails.medium.url}" alt="${snippet.title}" class="rec-video-thumbnail" loading="lazy">
            <div class="rec-video-meta">
                <h3 class="rec-video-title">${snippet.title}</h3>
                <div class="rec-video-info">
                    <p>${snippet.channelTitle}</p>
                    <p>${timeAgo(snippet.publishedAt)}</p>
                </div>
            </div>
        `;
        return card;
    }

    function createCommentElement(commentData, isLocal = false) {
        const snippet = isLocal ? commentData.snippet : commentData.snippet;
        const commentId = isLocal ? commentData.id : commentData.id;

        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.dataset.commentId = commentId;

        const isLiked = localLikes[videoId] && localLikes[videoId][commentId];
        const likedClass = isLiked ? 'liked' : '';

        commentEl.innerHTML = `
            <img src="${snippet.authorProfileImageUrl}" alt="${snippet.authorDisplayName}" loading="lazy">
            <div class="comment-body">
                <p class="comment-author">${snippet.authorDisplayName} • ${timeAgo(snippet.publishedAt)}</p>
                <p class="comment-text">${snippet.textDisplay.replace(/\n/g, '<br>')}</p>
                <div class="comment-actions">
                    <button class="like-btn ${likedClass}"><svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></button>
                    <span class="like-count">${formatNumber(snippet.likeCount)}</span>
                    <button><svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02-7.05c-.09-.23-.14-.47-.14-.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg></button>
                    <span>Reply</span>
                </div>
            </div>
        `;

        const likeButton = commentEl.querySelector('.like-btn');
        likeButton.addEventListener('click', () => handleLike(commentId));

        return commentEl;
    }

    function handleLike(commentId) {
        if (!localLikes[videoId]) {
            localLikes[videoId] = {};
        }

        const commentLiked = localLikes[videoId][commentId];
        
        // Update the like status
        localLikes[videoId][commentId] = !commentLiked;
        localStorage.setItem('yt-clone-likes', JSON.stringify(localLikes));
        
        // Re-render the specific comment to update its appearance
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            const likeButton = commentElement.querySelector('.like-btn');
            const likeCountSpan = commentElement.querySelector('.like-count');
            
            let currentLikes = parseInt(likeCountSpan.textContent.replace(/,/g, '')) || 0;
            
            if (localLikes[videoId][commentId]) { // Just liked
                likeButton.classList.add('liked');
                currentLikes++;
            } else { // Unliked
                likeButton.classList.remove('liked');
                currentLikes--;
            }
            likeCountSpan.textContent = formatNumber(currentLikes);
        }
    }

    function handleNewComment() {
        const text = newCommentInput.value.trim();
        if (!text) return;

        const newComment = {
            id: `local-${Date.now()}`,
            snippet: {
                authorDisplayName: 'Guest User',
                authorProfileImageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
                publishedAt: new Date().toISOString(),
                textDisplay: text,
                likeCount: 0,
            }
        };

        if (!localComments[videoId]) {
            localComments[videoId] = [];
        }
        localComments[videoId].push(newComment);
        localStorage.setItem('yt-clone-comments', JSON.stringify(localComments));

        // Add the new comment to the top of the list
        const commentEl = createCommentElement(newComment, true);
        commentsContainer.prepend(commentEl);

        // Reset input field
        newCommentInput.value = '';
        submitCommentBtn.disabled = true;
        commentButtons.style.display = 'none';

        // Update total comment count
        const currentTotal = parseInt(commentCount.textContent.replace(/,/g, '').split(' ')[0]) + 1;
        commentCount.textContent = `${formatNumber(currentTotal)} Comments`;
    }
}); 