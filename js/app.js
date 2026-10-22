
/* ===== PINKIFY MUSIC PLAYER ===== */

console.log("Pinkify is ready!");

document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("music-upload");
  const audioPlayer = document.getElementById("audio-player");
  const trackTitle = document.getElementById("track-title");
  const trackStatus = document.getElementById("track-status");
  const trackCount = document.getElementById("track-count");
  const trackList = document.getElementById("track-list");

  let songs = [];
  let currentIndex = -1;

  function playSong(index) {
    if (index < 0 || index >= songs.length) return;

    currentIndex = index;
    const song = songs[index];

    audioPlayer.src = song.url;
    trackTitle.textContent = song.name;
    trackStatus.textContent = "Playing from your device";
    audioPlayer.play().catch(() => {
      trackStatus.textContent = "Press Play to start listening";
    });

    renderPlaylist();
  }

  function renderPlaylist() {
    trackList.replaceChildren();

    songs.forEach((song, index) => {
      
        const item = document.createElement("li");
        item.className = "track-item";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "track-select";
        if (index === currentIndex) {
            button.classList.add("playing-track");
        }
        button.textContent =
        (index === currentIndex ? "♫ " : "") + song.name;

        button.addEventListener("click", () => playSong(index));

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "track-remove";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${song.name}`);

        removeButton.addEventListener("click", () => {
        const wasCurrentSong = index === currentIndex;

        URL.revokeObjectURL(song.url);
        songs.splice(index, 1);

        if (songs.length === 0) {
            audioPlayer.pause();
            audioPlayer.removeAttribute("src");
            audioPlayer.load();

            currentIndex = -1;
            trackTitle.textContent = "No song selected";
            trackStatus.textContent = "Choose a song from your device to begin.";
            renderPlaylist();
            return;
        }

        if (wasCurrentSong) {
            currentIndex = -1;
            playSong(Math.min(index, songs.length - 1));
        } else {
            if (index < currentIndex) currentIndex--;
            renderPlaylist();
        }
        });

        item.append(button, removeButton);
        trackList.appendChild(item);

    });

    trackCount.textContent =
      songs.length === 1
        ? "1 song loaded"
        : `${songs.length} songs loaded`;
  }

  uploadInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const audioFiles = files.filter(
      (file) => file.type.startsWith("audio/")
    );

    if (!audioFiles.length) {
      trackStatus.textContent = "Please choose an audio file.";
      return;
    }

    audioFiles.forEach((file) => {
      songs.push({
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(file)
      });
    });

    renderPlaylist();
    trackStatus.textContent = "Choose a song to start listening.";

    if (currentIndex === -1) {
      playSong(0);
    }

    uploadInput.value = "";
  });

  audioPlayer.addEventListener("ended", () => {
    if (currentIndex < songs.length - 1) {
      playSong(currentIndex + 1);
    } else {
      trackStatus.textContent = "You've reached the end of your playlist.";
    }
  });

  console.log("Pinkify music player loaded successfully.");
});


/* ===== YOUTUBE ONLINE PLAYER ===== */

const youtubeInput = document.getElementById("youtube-search");
const youtubeLoadButton = document.getElementById("youtube-load");
const youtubeStatus = document.getElementById("youtube-status");

let youtubePlayer = null;
let youtubeApiReady = false;

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) {
    createYouTubePlayer();
    return;
  }

  if (document.getElementById("youtube-api-script")) return;

  const script = document.createElement("script");
  script.id = "youtube-api-script";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

window.onYouTubeIframeAPIReady = function () {
  youtubeApiReady = true;
  createYouTubePlayer();
};

function createYouTubePlayer() {
  if (!youtubeApiReady || youtubePlayer) return;

  youtubePlayer = new YT.Player("youtube-player", {
    width: "100%",
    height: "270",
    videoId: "",
    playerVars: {
      playsinline: 1
    },
    events: {
      onReady: function () {
        youtubeStatus.textContent = "YouTube player ready.";
      },
      onError: function () {
        youtubeStatus.textContent =
          "This video cannot be played here. Try another video.";
      }
    }
  });
}

if (youtubeInput && youtubeLoadButton && youtubeStatus) {
  loadYouTubeApi();

  
youtubeLoadButton.addEventListener("click", () => {
  const input = youtubeInput.value.trim();
  let videoId = "";

  try {
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      videoId = input;
    } else {
      const url = new URL(input);

      if (url.hostname === "youtu.be" ||
          url.hostname === "www.youtu.be") {
        videoId = url.pathname.slice(1).split("/")[0];
      } else if (
        ["youtube.com", "www.youtube.com", "m.youtube.com",
         "music.youtube.com"].includes(url.hostname)
      ) {
        if (url.pathname === "/watch") {
          videoId = url.searchParams.get("v") || "";
        } else {
          const match = url.pathname.match(
            /^\/(shorts|embed|live)\/([^/]+)/
          );
          if (match) videoId = match[2];
        }
      }
    }
  } catch {
    // Input isn't a valid URL or video ID.
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    youtubeStatus.textContent =
      "Please paste a valid YouTube video link or video ID.";
    return;
  }

  if (!youtubePlayer ||
      typeof youtubePlayer.loadVideoById !== "function") {
    youtubeStatus.textContent =
      "YouTube is still loading. Please try again in a moment.";
    return;
  }

  youtubePlayer.loadVideoById(videoId);
  youtubeStatus.textContent = "Loading YouTube video...";
});

}
