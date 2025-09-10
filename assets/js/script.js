document.addEventListener('DOMContentLoaded', function() {
    // Instagram Widget Handling
    // Get the Instagram iframe
    var instagramIframe = document.querySelector('.embedsocial-instagram iframe');
    
    // Hide loading indicator when iframe loads
    if (instagramIframe) {
        instagramIframe.onload = function() {
            document.getElementById('instagram-loading').style.display = 'none';
        };
        
        // If iframe fails to load after 5 seconds, show fallback
        setTimeout(function() {
            if (document.getElementById('instagram-loading').style.display !== 'none') {
                document.getElementById('instagram-loading').style.display = 'none';
                document.getElementById('instagram-fallback').style.display = 'block';
                
                // If fallback doesn't work after 3 more seconds, show static content
                setTimeout(function() {
                    document.getElementById('instagram-static-fallback').style.display = 'block';
                }, 3000);
            }
        }, 5000);
    } else {
        // If iframe doesn't exist at all, show fallback immediately
        document.getElementById('instagram-loading').style.display = 'none';
        document.getElementById('instagram-fallback').style.display = 'block';
        document.getElementById('instagram-static-fallback').style.display = 'block';
    }

    // YouTube Widget Handling
    // Initialize YouTube API
    // IMPORTANT: You must replace 'YOUR_API_KEY' with an actual YouTube Data API v3 key
    // Get your API key from: https://console.cloud.google.com/apis/credentials
    const youtubeApiKey = 'AIzaSyDJvk4A_K5SVv78Rl7Qaun_qFmU0_Xjo9Q'; // YouTube API key
    
    // Fetch fallback videos from JSON file
    let showFeaturedVideo = false;
    let fallbackVideos = [];
    
    // Fetch the fallback videos JSON file
    fetch('assets/data/fallback-videos.json')
        .then(response => response.json())
        .then(data => {
            // Get the showFeaturedVideo setting from the JSON
            showFeaturedVideo = data.showFeaturedVideo;
            
            // Make this setting available globally for the static fallback
            window.youtubeShowFeaturedVideo = showFeaturedVideo;
            
            // Get the fallback videos from the JSON
            fallbackVideos = data.videos;
            
            // Create YouTube videos instance
            const youtubeVideos = new YouTubeChannelVideos({
                apiKey: youtubeApiKey,
                channelUsername: '@tarfiehplus', // Channel username with @ symbol
                maxResults: showFeaturedVideo ? 10 : 9,
                containerSelector: '#youtube-api-container',
                cacheExpiration: 3600, // Cache for 1 hour
                featuredVideo: showFeaturedVideo, // Controls whether to show the first video as featured
                fallbackVideos: fallbackVideos // Fallback videos to use if API fails
            });
            
            // Initialize YouTube videos with integrated fallback mechanism
            youtubeVideos.init();
        })
        .catch(error => {
            console.error('Error loading fallback videos:', error);
            
            // Fallback to default settings if JSON fails to load
            showFeaturedVideo = false;
            window.youtubeShowFeaturedVideo = showFeaturedVideo;
            
            // Create YouTube videos instance with empty fallback videos
            const youtubeVideos = new YouTubeChannelVideos({
                apiKey: youtubeApiKey,
                channelUsername: '@tarfiehplus',
                maxResults: showFeaturedVideo ? 10 : 9,
                containerSelector: '#youtube-api-container',
                cacheExpiration: 3600,
                featuredVideo: showFeaturedVideo
            });
            
            youtubeVideos.init();
        });
});