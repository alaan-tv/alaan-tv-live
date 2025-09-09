/**
 * YouTube Channel Videos Fetcher
 * 
 * This script fetches the latest videos from a YouTube channel using the YouTube Data API v3
 * and displays them in a responsive grid layout.
 * 
 * Features:
 * - Fetches latest videos from a specified channel
 * - Displays videos in a responsive grid with thumbnails and titles
 * - Handles API errors gracefully with fallback options
 * - Caches results to reduce API quota usage
 */

class YouTubeChannelVideos {
    constructor(options) {
        this.options = {
            apiKey: '', // YouTube Data API key (required)
            channelId: '', // YouTube channel ID (required)
            channelUsername: '', // Alternative to channelId
            maxResults: 10, // Number of videos to display
            containerSelector: '#youtube-api-container', // Container element
            cacheExpiration: 3600, // Cache expiration in seconds (1 hour)
            featuredVideo: true, // Whether to show the first video as featured (optional)
            ...options
        };
        
        this.container = document.querySelector(this.options.containerSelector);
        this.cacheKey = `youtube-videos-${this.options.channelId || this.options.channelUsername}`;
    }
    
    /**
     * Initialize the YouTube videos fetcher
     */
    init() {
        if (!this.container) {
            console.error('YouTube container element not found');
            return;
        }
        
        if (!this.options.apiKey) {
            console.error('YouTube API key is required');
            return;
        }
        
        if (!this.options.channelId && !this.options.channelUsername) {
            console.error('Either channelId or channelUsername is required');
            return;
        }
        
        // Try to get videos from cache first
        const cachedVideos = this.getFromCache();
        if (cachedVideos) {
            this.renderVideos(cachedVideos);
            return;
        }
        
        // Show loading state
        this.showLoading();
        
        // Fetch videos from API
        this.fetchVideos()
            .then(videos => {
                if (videos && videos.length > 0) {
                    this.saveToCache(videos);
                    this.renderVideos(videos);
                } else {
                    this.showError('No videos found');
                }
            })
            .catch(error => {
                console.error('Error fetching YouTube videos:', error);
                this.showError('Failed to load videos');
            });
    }
    
    /**
     * Fetch videos from YouTube API
     */
    async fetchVideos() {
        try {
            // Step 1: Get channel ID if only username is provided
            let channelId = this.options.channelId;
            if (!channelId && this.options.channelUsername) {
                channelId = await this.getChannelIdFromUsername();
            }
            
            if (!channelId) {
                throw new Error('Could not determine channel ID');
            }
            
            // Step 2: Get channel uploads playlist ID
            const channelResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${this.options.apiKey}`
            );
            
            if (!channelResponse.ok) {
                throw new Error('Failed to fetch channel data');
            }
            
            const channelData = await channelResponse.json();
            if (!channelData.items || channelData.items.length === 0) {
                throw new Error('Channel not found');
            }
            
            const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
            
            // Step 3: Get videos from uploads playlist
            const videosResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${this.options.maxResults}&playlistId=${uploadsPlaylistId}&key=${this.options.apiKey}`
            );
            
            if (!videosResponse.ok) {
                throw new Error('Failed to fetch videos');
            }
            
            const videosData = await videosResponse.json();
            if (!videosData.items || videosData.items.length === 0) {
                return [];
            }
            
            // Process video data
            return videosData.items.map(item => {
                const snippet = item.snippet;
                return {
                    id: snippet.resourceId.videoId,
                    title: snippet.title,
                    description: snippet.description,
                    thumbnail: snippet.thumbnails.high || snippet.thumbnails.medium || snippet.thumbnails.default,
                    publishedAt: new Date(snippet.publishedAt),
                    channelTitle: snippet.channelTitle
                };
            });
        } catch (error) {
            console.error('Error in fetchVideos:', error);
            throw error;
        }
    }
    
    /**
     * Get channel ID from username
     */
    async getChannelIdFromUsername() {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${this.options.channelUsername}&key=${this.options.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch channel ID');
            }
            
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                // Try to get channel by handle
                return this.getChannelIdFromHandle();
            }
            
            return data.items[0].id;
        } catch (error) {
            console.error('Error getting channel ID from username:', error);
            return null;
        }
    }
    
    /**
     * Get channel ID from handle (@username)
     */
    async getChannelIdFromHandle() {
        try {
            // This is a workaround since YouTube API doesn't directly support handles
            // We use the search endpoint to find the channel
            const username = this.options.channelUsername.replace('@', '');
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${username}&type=channel&maxResults=1&key=${this.options.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch channel by handle');
            }
            
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                throw new Error('Channel not found by handle');
            }
            
            return data.items[0].snippet.channelId;
        } catch (error) {
            console.error('Error getting channel ID from handle:', error);
            return null;
        }
    }
    
    /**
     * Render videos in the container
     */
    renderVideos(videos) {
        // Hide loading indicator
        document.getElementById('youtube-loading').style.display = 'none';
        
        // Clear container
        this.container.innerHTML = '';
        
        // Create channel info header
        const channelInfo = document.createElement('div');
        channelInfo.className = 'youtube-channel-info';
        channelInfo.innerHTML = `
            <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 8px;">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
                ${videos[0]?.channelTitle || 'آخر الفيديوهات من يوتيوب'}
            </h3>
        `;
        this.container.appendChild(channelInfo);
        
        // Create featured video (first video) if option is enabled
        let startIndex = 0;
        if (this.options.featuredVideo && videos.length > 0) {
            const featuredVideo = videos[0];
            const featuredElement = document.createElement('div');
            featuredElement.className = 'youtube-featured-video';
            
            // Format date in Arabic
            const publishDate = new Intl.DateTimeFormat('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(featuredVideo.publishedAt);
            
            featuredElement.innerHTML = `
                <a href="https://www.youtube.com/watch?v=${featuredVideo.id}" target="_blank" class="youtube-video-link">
                    <div class="youtube-thumbnail-container">
                        <img src="${featuredVideo.thumbnail.url}" alt="${featuredVideo.title}" class="youtube-thumbnail">
                        <div class="youtube-play-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)"></circle>
                                <polygon points="10 8 16 12 10 16 10 8" fill="#ffffff"></polygon>
                            </svg>
                        </div>
                    </div>
                    <div class="youtube-video-info">
                        <h4 class="youtube-video-title">${featuredVideo.title}</h4>
                        <div class="youtube-video-date">${publishDate}</div>
                    </div>
                </a>
            `;
            
            this.container.appendChild(featuredElement);
            startIndex = 1; // Skip the first video in the grid if it's featured
        }
        
        // Create videos grid for all or remaining videos
        const grid = document.createElement('div');
        grid.className = 'youtube-videos-grid';
        
        // Display all videos or skip the first one if it's featured
        videos.slice(startIndex).forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'youtube-video-item';
            
            // Format date in Arabic
            const publishDate = new Intl.DateTimeFormat('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(video.publishedAt);
            
            videoElement.innerHTML = `
                <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="youtube-video-link">
                    <div class="youtube-thumbnail-container">
                        <img src="${video.thumbnail.url}" alt="${video.title}" class="youtube-thumbnail">
                        <div class="youtube-play-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)"></circle>
                                <polygon points="10 8 16 12 10 16 10 8" fill="#ffffff"></polygon>
                            </svg>
                        </div>
                    </div>
                    <div class="youtube-video-info">
                        <h4 class="youtube-video-title">${video.title}</h4>
                        <div class="youtube-video-date">${publishDate}</div>
                    </div>
                </a>
            `;
            
            grid.appendChild(videoElement);
        });
        
        this.container.appendChild(grid);
        
        // Add "View More" button
        const viewMoreBtn = document.createElement('div');
        viewMoreBtn.className = 'youtube-view-more';
        viewMoreBtn.innerHTML = `
            <a href="https://www.youtube.com/${this.options.channelUsername || 'channel/' + this.options.channelId}" target="_blank" class="youtube-view-more-btn">
                عرض المزيد من الفيديوهات
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 5px;">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                </svg>
            </a>
        `;
        this.container.appendChild(viewMoreBtn);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        // We'll use the external loading indicator instead of creating one in the container
        document.getElementById('youtube-loading').style.display = 'flex';
        this.container.innerHTML = ''; // Clear the container for videos
    }
    
    /**
     * Show error message
     */
    showError(message) {
        // Hide loading indicator
        document.getElementById('youtube-loading').style.display = 'none';
        
        this.container.innerHTML = `
            <div class="youtube-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>${message}</p>
                <a href="https://www.youtube.com/${this.options.channelUsername || 'channel/' + this.options.channelId}" target="_blank" class="youtube-error-link">
                    زيارة القناة على يوتيوب
                </a>
            </div>
        `;
    }
    
    /**
     * Save videos to localStorage cache
     */
    saveToCache(videos) {
        try {
            const cacheData = {
                videos,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }
    
    /**
     * Get videos from localStorage cache
     */
    getFromCache() {
        try {
            const cacheData = localStorage.getItem(this.cacheKey);
            if (!cacheData) return null;
            
            const { videos, timestamp } = JSON.parse(cacheData);
            const expirationTime = timestamp + (this.options.cacheExpiration * 1000);
            
            // Check if cache is expired
            if (Date.now() > expirationTime) {
                localStorage.removeItem(this.cacheKey);
                return null;
            }
            
            return videos;
        } catch (error) {
            console.error('Error getting from cache:', error);
            return null;
        }
    }
}

// Add CSS styles
const addYouTubeStyles = () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Featured video styles */
        .youtube-featured-video {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            margin-bottom: 25px;
            background-color: #111;
        }
        
        .youtube-featured-video:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        
        .youtube-featured-video .youtube-video-title {
            font-size: 18px;
            line-height: 1.5;
            -webkit-line-clamp: 2;
            margin-bottom: 10px;
        }
        
        .youtube-featured-video .youtube-video-date {
            font-size: 14px;
        }
        
        .youtube-featured-video .youtube-video-info {
            padding: 16px;
        }
        
        /* Regular videos grid */
        .youtube-videos-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        @media (max-width: 768px) {
            .youtube-videos-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .youtube-featured-video .youtube-video-title {
                font-size: 16px;
            }
        }
        
        @media (max-width: 480px) {
            .youtube-videos-grid {
                grid-template-columns: 1fr;
            }
            
            .youtube-featured-video .youtube-video-title {
                font-size: 15px;
            }
        }
        
        .youtube-video-item {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .youtube-video-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .youtube-video-link {
            text-decoration: none;
            color: inherit;
            display: block;
        }
        
        .youtube-thumbnail-container {
            position: relative;
            padding-top: 56.25%; /* 16:9 aspect ratio */
            background-color: #f0f0f0;
        }
        
        .youtube-thumbnail {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .youtube-play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.8;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        .youtube-video-item:hover .youtube-play-button,
        .youtube-featured-video:hover .youtube-play-button {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
        }
        
        .youtube-video-info {
            padding: 12px;
            background-color: #111;
        }
        
        .youtube-video-title {
            margin: 0 0 8px 0;
            font-size: 14px;
            line-height: 1.4;
            font-weight: 600;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            direction: rtl;
            text-align: right;
        }
        
        .youtube-video-date {
            font-size: 12px;
            color: #606060;
            direction: rtl;
            text-align: right;
        }
        
        .youtube-channel-info {
            margin-bottom: 15px;
        }
        
        .youtube-channel-info h3 {
            margin: 0;
            font-size: 18px;
            display: flex;
            align-items: center;
            direction: rtl;
        }
        
        .youtube-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 0;
        }
        
        .youtube-loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #ff0000;
            animation: youtube-spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes youtube-spin {
            to { transform: rotate(360deg); }
        }
        
        .youtube-error {
            text-align: center;
            padding: 40px 0;
            color: #666;
        }
        
        .youtube-error svg {
            margin-bottom: 15px;
            color: #ff0000;
        }
        
        .youtube-error-link {
            display: inline-block;
            margin-top: 15px;
            padding: 8px 16px;
            background-color: #ff0000;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .youtube-view-more {
            text-align: center;
            margin-top: 20px;
        }
        
        .youtube-view-more-btn {
            display: inline-block;
            padding: 8px 16px;
            background-color: #ff0000;
            color: #606060;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        
        .youtube-view-more-btn:hover {
            background-color: #e8e8e8;
        }
    `;
    document.head.appendChild(styleElement);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add styles
    addYouTubeStyles();
});