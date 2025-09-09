# YouTube API Usage Guide

## Featured Video Option

The YouTube API implementation now includes an optional "featured video" functionality that allows you to control whether the first video should be displayed in a larger, more prominent format.

### How to Enable/Disable Featured Video

To enable or disable the featured video functionality, modify the `showFeaturedVideo` constant in `assets/js/script.js`:

```javascript
// Set whether to show a featured video (first video larger than others)
// Change this to false to disable the featured video and show all videos in a grid
const showFeaturedVideo = true; // Set to false to disable featured video
```

When `showFeaturedVideo` is set to:
- `true` (default): The first video will be displayed in a larger format at the top, with the remaining videos shown in a grid below.
- `false`: All videos will be displayed in a uniform grid layout with no featured video.

### Implementation Details

The featured video functionality is implemented in several components:

1. **YouTubeChannelVideos Class** (`assets/js/youtube-api.js`):
   - The constructor accepts a `featuredVideo` option (default: `true`)
   - The `renderVideos` method checks this option to determine how to display videos

2. **Initialization** (`assets/js/script.js`):
   - Sets a global `showFeaturedVideo` constant
   - Makes this setting available to other components via `window.youtubeShowFeaturedVideo`
   - Passes this setting to the YouTubeChannelVideos instance

3. **Static Fallback** (`widgets/youtube-widget.php`):
   - Uses the same setting from the global variable
   - Conditionally displays the featured video section based on this setting
   - Adds the first video to the grid if featured video is disabled

### Example: Disabling Featured Video

To display all videos in a uniform grid with no featured video:

```javascript
// In assets/js/script.js
const showFeaturedVideo = false;

// Make this setting available globally for the static fallback
window.youtubeShowFeaturedVideo = showFeaturedVideo;

// Create YouTube videos instance
const youtubeVideos = new YouTubeChannelVideos({
    apiKey: youtubeApiKey,
    channelUsername: '@tarfiehplus',
    maxResults: 9,
    containerSelector: '#youtube-api-container',
    cacheExpiration: 3600,
    featuredVideo: showFeaturedVideo // Pass the setting to the instance
});
```

### Example: Enabling Featured Video (Default)

To display the first video as featured (larger format) and the rest in a grid:

```javascript
// In assets/js/script.js
const showFeaturedVideo = true; // This is the default

// Make this setting available globally for the static fallback
window.youtubeShowFeaturedVideo = showFeaturedVideo;

// Create YouTube videos instance
const youtubeVideos = new YouTubeChannelVideos({
    apiKey: youtubeApiKey,
    channelUsername: '@tarfiehplus',
    maxResults: 9,
    containerSelector: '#youtube-api-container',
    cacheExpiration: 3600,
    featuredVideo: showFeaturedVideo // Pass the setting to the instance
});
```

## Benefits

- **Flexibility**: Easily switch between layouts without modifying the core code
- **Consistency**: Both dynamic content (API) and static fallback use the same setting
- **User Experience**: Choose the layout that best suits your content and design needs