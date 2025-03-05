import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

const YOUTUBE_API_KEY = "AIzaSyDk0isSIpVLgUrYIOux4PQa7C7RIRwfR1k"; // Replace with your API key



function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [secondVideoUrl, setSecondVideoUrl] = useState(null);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playersReady, setPlayersReady] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState(""); // New optional input

  const checkPlayersReady = useCallback(() => {
    const video1El = document.getElementById('video1');
    const video2El = document.getElementById('video2');

    // Explicitly check if both iframes exist and players are initialized
    if (video1El && video2El && player1 && player2) {
      console.log("Both players are definitively ready!");
      setPlayersReady(true);
    } else {
      console.log("Players not ready. Checking:", {
        video1: !!video1El, 
        video2: !!video2El, 
        player1: !!player1, 
        player2: !!player2
      });
      setPlayersReady(false);
    }
  }, [player1, player2]);

  useEffect(() => {
    // Add a periodic check to ensure players are ready
    const readinessInterval = setInterval(checkPlayersReady, 500);

    // Cleanup interval when component unmounts
    return () => clearInterval(readinessInterval);
  }, [checkPlayersReady]);

  useEffect(() => {
    // Load YouTube Iframe API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube Iframe API is ready");
        // Manually trigger player initialization
        initializePlayers();
      };
    } else {
      initializePlayers();
    }
  }, [secondVideoUrl]);

  const initializePlayers = () => {
    // Only try to create players if both video containers exist
    const video1El = document.getElementById('video1');
    const video2El = document.getElementById('video2');

    if (video1El && video2El && window.YT && window.YT.Player) {
      console.log("Attempting to create players");
      
      // Create first player
      const player1Instance = new window.YT.Player('video1', {
        events: {
          onReady: (event) => {
            console.log("Player 1 is ready");
            setPlayer1(event.target);
          },
          onError: (error) => {
            console.error("Player 1 error:", error);
          }
        }
      });

      // Create second player
      const player2Instance = new window.YT.Player('video2', {
        events: {
          onReady: (event) => {
            console.log("Player 2 is ready");
            setPlayer2(event.target);
          },
          onError: (error) => {
            console.error("Player 2 error:", error);
          }
        }
      });
    } else {
      console.log("Cannot create players. Elements:", {
        video1El, 
        video2El, 
        YTReady: !!window.YT, 
        PlayerReady: !!(window.YT && window.YT.Player)
      });
    }
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*vi=))([^#&?]*).*/);
    return match ? match[1] : null;
  };

  const fetchDescription = async (videoId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`
      );

      const description = response.data.items[0]?.snippet?.description || "";
      console.log("Video Description:", description);

      const firstLink = description.match(/https?:\/\/(www\.)?youtu\.be\/\S+|https?:\/\/(www\.)?youtube\.com\/watch\?v=\S+/);
      console.log("Extracted Link:", firstLink ? firstLink[0] : "No link found");

      if (firstLink) {
        setSecondVideoUrl(firstLink[0]);
      } else {
        setSecondVideoUrl(null);
      }

    } catch (error) {
      console.error("Error fetching video description:", error.response?.data || error);
      setSecondVideoUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchVideos = () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return;

    if (customVideoUrl) {
        console.log("🎯 Using custom WR video:", customVideoUrl);
        setSecondVideoUrl(customVideoUrl);  // Use user input
    } else {
        console.log("🔎 Fetching previous WR from description...");
        fetchDescription(videoId);  // Use extracted video from description
    }
  };

  const syncVideos = () => {
    if (!playersReady) {
        console.error("🚨 YouTube players are not fully loaded yet!");
        return;
    }

    console.log("⏳ Syncing videos to 3rd second and pausing...");
    player1.seekTo(3, true);  // 🔹 false prevents auto-play
    player2.seekTo(3, true);

    // 🔹 Explicitly pause both videos to prevent unwanted playback
    setTimeout(() => {
        player1.pauseVideo();
        player2.pauseVideo();
    }, 100);
};

  const pauseVideos = () => {
    if (!playersReady) {
        console.error("🚨 YouTube players are not fully loaded yet!");
        return;
    }

    console.log("⏸️ Pausing both videos...");
    player1.pauseVideo();
    player2.pauseVideo();
};

  const resumeVideos = () => {
    if (!playersReady) {
        console.error("🚨 YouTube players are not fully loaded yet!");
        return;
    }

    console.log("▶️ Resuming both videos...");
    player1.playVideo();
    player2.playVideo();
  };

  const syncToZero = () => {
    if (!playersReady) {
        console.error("🚨 YouTube players are not fully loaded yet!");
        return;
    }

    console.log("⏳ Syncing videos to 0th second and pausing...");
    player1.seekTo(0, true);  
    player2.seekTo(0, true);

    // 🔹 Pause after seeking
    setTimeout(() => {
        player1.pauseVideo();
        player2.pauseVideo();
    }, 100);
};

  return (
    <div className="App">
        <h1>TF2 Tempus WR Comparator</h1>
        
        <input
    type="text"
    placeholder="Enter YouTube Video URL"
    value={videoUrl}
    onChange={(e) => setVideoUrl(e.target.value)}
    />
    <input
        type="text"
        placeholder="(Optional) Enter Older WR Video URL"
        value={customVideoUrl}
        onChange={(e) => setCustomVideoUrl(e.target.value)}
    />
    <button onClick={handleFetchVideos}>Compare</button>

        {loading && <p>Loading...</p>}

        {/* Video Container */}
        <div className="video-container">
            {videoUrl && (
                <iframe
                    id="video1"
                    width="720" height="405"  // Bigger Video
                    src={`https://www.youtube.com/embed/${extractVideoId(videoUrl)}?enablejsapi=1`}
                    frameBorder="0"
                    allowFullScreen
                ></iframe>
            )}
            {secondVideoUrl && (
                <iframe
                    id="video2"
                    width="720" height="405"  // Bigger Video
                    src={`https://www.youtube.com/embed/${extractVideoId(secondVideoUrl)}?enablejsapi=1`}
                    frameBorder="0"
                    allowFullScreen
                ></iframe>
            )}
        </div>

        {/* Buttons */}
        {secondVideoUrl && (
    <div className="button-container">
        <button className="sync-button" onClick={syncVideos} disabled={!playersReady}>
            {playersReady ? "Sync to 0:00:00" : "Waiting for Players..."}
        </button>
        <button className="zero-button" onClick={syncToZero} disabled={!playersReady}>
            Sync to -0:03:00
        </button>
        <button className="pause-button" onClick={pauseVideos} disabled={!playersReady}>
            Pause Both
        </button>
        <button className="resume-button" onClick={resumeVideos} disabled={!playersReady}>
            Resume Both
        </button>
    </div>
)}
    </div>
);}

export default App;