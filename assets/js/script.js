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
    
    // Set whether to show a featured video (first video larger than others)
    // Change this to false to disable the featured video and show all videos in a grid
    const showFeaturedVideo = false;
    
    // Make this setting available globally for the static fallback
    window.youtubeShowFeaturedVideo = showFeaturedVideo;
    
    // Create YouTube videos instance
    const youtubeVideos = new YouTubeChannelVideos({
        apiKey: youtubeApiKey,
        channelUsername: '@tarfiehplus', // Channel username with @ symbol
        maxResults: showFeaturedVideo?10:9,
        containerSelector: '#youtube-api-container',
        cacheExpiration: 3600, // Cache for 1 hour
        featuredVideo: showFeaturedVideo // Controls whether to show the first video as featured
    });
    
    // Initialize YouTube videos
    youtubeVideos.init();
    
    // Set up fallback mechanism if YouTube API fails
    setTimeout(function() {
        // If the YouTube API container is empty after 5 seconds, show fallback
        if (document.querySelector('#youtube-api-container .youtube-videos-grid') === null) {
            document.getElementById('youtube-fallback').style.display = 'block';
            
            // Check if secondary widget loads
            var checkSecondaryWidget = setInterval(function() {
                try {
                    var fallbackFrame = document.querySelector('#youtube-fallback iframe');
                    if (fallbackFrame && fallbackFrame.contentDocument && 
                        fallbackFrame.contentDocument.body.children.length > 0) {
                        // Secondary widget loaded successfully
                        clearInterval(checkSecondaryWidget);
                    }
                } catch(e) {
                    // CORS error, can't check content
                }
            }, 500); // Check every 500ms
            
            // After another 3 seconds, if secondary widget hasn't loaded, show static fallback
            setTimeout(function() {
                try {
                    if (document.querySelector('#youtube-fallback iframe').contentDocument.body.children.length === 0) {
                        document.getElementById('youtube-static-fallback').style.display = 'block';
                    }
                } catch(e) {
                    // If we can't access iframe content due to CORS, show static fallback
                    document.getElementById('youtube-static-fallback').style.display = 'block';
                }
            }, 3000); // Wait another 3 seconds for secondary widget
        }
    }, 5000); // Wait 5 seconds for YouTube API to load
});