import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import axios from 'axios';

const VideoPlayer = ({ material, token }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const API_BASE = `${window.location.origin}/api`;
  const videoUrl = material.file_path
    ? `${API_BASE}/materials/${material.id}/file`
    : null;

  useEffect(() => {
    let cancelled = false;
    
    async function loadVideo() {
      if (!videoUrl || !token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch video with authentication
        const response = await axios.get(videoUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        });
        
        if (cancelled) return;
        
        // Create blob URL
        const url = URL.createObjectURL(response.data);
        setBlobUrl(url);
        setLoading(false);
        
      } catch (err) {
        if (cancelled) return;
        console.error('Video load failed:', err);
        setError(err.response?.status === 403 ? 'Access denied. Please check your permissions.' : 'Failed to load video');
        setLoading(false);
      }
    }
    
    loadVideo();
    
    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [videoUrl, token, material.id]);

  useEffect(() => {
    if (!blobUrl || loading || error) return;

    // Video.js options
    const options = {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{
        src: blobUrl,
        type: getVideoType(material.content_type)
      }],
      html5: {
        vhs: {
          overrideNative: !videojs.browser.IS_SAFARI
        }
      },
      playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      controlBar: {
        children: [
          'playToggle',
          'skipBackward',
          'skipForward',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'chaptersButton',
          'descriptionsButton',
          'subsCapsButton',
          'audioTrackButton',
          'loopToggle',
          'pictureInPictureToggle',
          'fullscreenToggle'
        ]
      },
      userActions: {
        hotkeys: function(event) {
          // Custom keyboard shortcuts
          const player = this;
          switch (event.which) {
            case 32: // Spacebar - play/pause
              event.preventDefault();
              if (player.paused()) {
                player.play();
              } else {
                player.pause();
              }
              break;
            case 37: // Left arrow - rewind 10s
              event.preventDefault();
              player.currentTime(player.currentTime() - 10);
              break;
            case 39: // Right arrow - forward 10s
              event.preventDefault();
              player.currentTime(player.currentTime() + 10);
              break;
            case 38: // Up arrow - volume up
              event.preventDefault();
              player.volume(Math.min(1, player.volume() + 0.1));
              break;
            case 40: // Down arrow - volume down
              event.preventDefault();
              player.volume(Math.max(0, player.volume() - 0.1));
              break;
            case 70: // F - fullscreen
              event.preventDefault();
              if (player.isFullscreen()) {
                player.exitFullscreen();
              } else {
                player.requestFullscreen();
              }
              break;
            case 77: // M - mute/unmute
              event.preventDefault();
              player.muted(!player.muted());
              break;
          }
        }
      }
    };

    // Initialize Video.js player
    playerRef.current = videojs(videoRef.current, options, function onPlayerReady() {
      console.log('Video.js player is ready');

      const player = this;

      // Add custom skip buttons functionality
      const skipBackward = player.controlBar.getChild('skipBackward');
      const skipForward = player.controlBar.getChild('skipForward');
      
      if (skipBackward) {
        skipBackward.on('click', function() {
          player.currentTime(Math.max(0, player.currentTime() - 10));
        });
      }
      
      if (skipForward) {
        skipForward.on('click', function() {
          player.currentTime(Math.min(player.duration(), player.currentTime() + 10));
        });
      }

      // Add loop toggle functionality
      const loopToggle = player.controlBar.getChild('loopToggle');
      if (loopToggle) {
        // Set initial state
        loopToggle.addClass(player.loop() ? 'vjs-loop-enabled' : 'vjs-loop-disabled');
        
        loopToggle.on('click', function() {
          const isLooping = player.loop();
          player.loop(!isLooping);
          loopToggle.toggleClass('vjs-loop-enabled');
          loopToggle.toggleClass('vjs-loop-disabled');
        });
      }

      // Handle errors
      player.on('error', function() {
        console.error('Video playback error:', player.error());
      });

      // Auto-complete when video ends
      player.on('ended', function() {
        console.log('Video ended, marking as complete');
        markVideoComplete();
      });

      // Remove progress saving - videos should be watched completely
      // Save progress removed as per requirements

      // Add keyboard shortcuts tooltip
      player.on('keydown', function(event) {
        if (event.which === 191 && event.shiftKey) { // Shift + ?
          event.preventDefault();
          showKeyboardShortcuts();
        }
      });
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [blobUrl, material.content_type, material.id, loading, error]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const getVideoType = (contentType) => {
    // If it's already a MIME type, use it
    if (contentType.startsWith('video/')) {
      return contentType;
    }
    // Otherwise, map simple types to common MIME types
    const typeMap = {
      'video': 'video/mp4', // Default assumption
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/avi',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'mkv': 'video/x-matroska'
    };
    return typeMap[contentType] || 'video/mp4';
  };

  const showKeyboardShortcuts = () => {
    setShowShortcuts(true);
    setTimeout(() => setShowShortcuts(false), 5000); // Hide after 5 seconds
  };

  const markVideoComplete = async () => {
    try {
      await axios.put(`${API_BASE}/progress/${material.id}/complete`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Video marked as complete');
    } catch (e) {
      console.warn('Mark video complete failed', e);
    }
  };

  if (!videoUrl) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <i className="fas fa-video" style={{ fontSize: '4rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
        <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>Video Not Available</h3>
        <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
          The video file could not be loaded.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '4rem', color: '#4299e1', marginBottom: '1rem' }}></i>
        <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>Loading Video...</h3>
        <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
          Please wait while we load the video file.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '4rem', color: '#e53e3e', marginBottom: '1rem' }}></i>
        <h3 style={{ margin: '0 0 1rem', color: '#2d3748' }}>Video Load Failed</h3>
        <p style={{ margin: '0 0 1.5rem', color: '#718096' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-city"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '70vh'
          }}
        />
      </div>
      
      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1000,
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Keyboard Shortcuts</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <div><kbd>Space</kbd> Play/Pause</div>
            <div><kbd>←→</kbd> Skip ±10s</div>
            <div><kbd>↑↓</kbd> Volume ±10%</div>
            <div><kbd>F</kbd> Fullscreen</div>
            <div><kbd>M</kbd> Mute</div>
            <div><kbd>Shift + ?</kbd> Show this</div>
          </div>
        </div>
      )}
      
      {/* Custom Styles for Loop Toggle */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .vjs-loop-enabled .vjs-icon-placeholder:before {
            content: '🔄';
          }
          .vjs-loop-disabled .vjs-icon-placeholder:before {
            content: '🔄';
            opacity: 0.5;
          }
          .video-js .vjs-control-bar .vjs-skip-backward,
          .video-js .vjs-control-bar .vjs-skip-forward {
            width: 2em;
          }
          .video-js .vjs-control-bar .vjs-skip-backward:before {
            content: '⏪';
          }
          .video-js .vjs-control-bar .vjs-skip-forward:before {
            content: '⏩';
          }
        `
      }} />
    </div>
  );
};

export default VideoPlayer;