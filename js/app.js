
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

  // ===== PINKIFY OFFLINE STORAGE =====

  const DB_NAME = "PinkifyDB";
  const DB_VERSION = 1;
  const STORE_NAME = "songs";

  function openPinkifyDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveAudioFile(file) {
    const db = await openPinkifyDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const name = file.name.replace(/\.[^/.]+$/, "");

      const request = store.add({
        name: name,
        file: file
      });

      request.onsuccess = () => {
        resolve({
          id: request.result,
          name: name,
          file: file
        });
      };

      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  async function getSavedAudioFiles() {
    const db = await openPinkifyDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  async function deleteSavedAudioFile(id) {
    if (id === undefined || id === null) return;

    const db = await openPinkifyDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  
  // ===== PLAY LOCAL SONGS =====

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

      removeButton.addEventListener("click", async () => {
        const wasCurrentSong = index === currentIndex;

        try {
          await deleteSavedAudioFile(song.id);
        } catch (error) {
          console.error("Could not remove saved song:", error);
          trackStatus.textContent = "Could not remove the saved song.";
          return;
        }

        URL.revokeObjectURL(song.url);
        songs.splice(index, 1);

        if (songs.length === 0) {
          audioPlayer.pause();
          audioPlayer.removeAttribute("src");
          audioPlayer.load();

          currentIndex = -1;
          trackTitle.textContent = "No song selected";
          trackStatus.textContent =
            "Choose a song from your device to begin.";

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

  // Restore saved songs when Pinkify opens.
  async function restoreSavedSongs() {
    try {
      const savedSongs = await getSavedAudioFiles();

      savedSongs.forEach((song) => {
        songs.push({
          id: song.id,
          name: song.name,
          url: URL.createObjectURL(song.file)
        });
      });

      renderPlaylist();

      if (songs.length > 0) {
        trackStatus.textContent = "Your saved songs are ready.";
      }
    } catch (error) {
      console.error("Could not load saved songs:", error);
      trackStatus.textContent =
        "Could not load saved songs from this browser.";
    }
  }

  
  // ===== UPLOAD AND SAVE AUDIO =====

  uploadInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const audioFiles = files.filter((file) =>
      file.type.startsWith("audio/")
    );

    if (!audioFiles.length) {
      trackStatus.textContent = "Please choose an audio file.";
      uploadInput.value = "";
      return;
    }

    try {
      for (const file of audioFiles) {
        const savedSong = await saveAudioFile(file);

        songs.push({
          id: savedSong.id,
          name: savedSong.name,
          url: URL.createObjectURL(savedSong.file)
        });
      }

      renderPlaylist();
      trackStatus.textContent = "Your songs are saved on this device.";

      if (currentIndex === -1 && songs.length > 0) {
        playSong(0);
      }
    } catch (error) {
      console.error("Failed to save audio:", error);
      trackStatus.textContent =
        "Could not save your songs. Please try again.";
    }

    uploadInput.value = "";
  });

  audioPlayer.addEventListener("ended", () => {
    if (currentIndex < songs.length - 1) {
      playSong(currentIndex + 1);
    } else {
      trackStatus.textContent =
        "You've reached the end of your playlist.";
    }
  });

  restoreSavedSongs();

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


/* ===== PINKIFY SONG SEARCH ===== */

const searchResults = document.getElementById("search-results");
const pagination = document.createElement("div");

pagination.id = "search-pagination";
pagination.className = "search-pagination";

if (searchResults) {
  searchResults.after(pagination);
}

let currentQuery = "";
let currentPage = 1;
let pageTokens = { 1: "" };
let totalPages = 1;

async function loadSearchPage(page) {
  if (!searchResults || !youtubeStatus) return;

  currentPage = page;
  youtubeStatus.textContent = "Searching for songs...";
  searchResults.replaceChildren();
  pagination.replaceChildren();

  try {
    const token = pageTokens[page] || "";
    const params = new URLSearchParams({ q: currentQuery });

    if (token) {
      params.set("pageToken", token);
    }

    const response = await fetch(
      `https://fictional-rotary-phone-jj7g576gv54phprjr-5000.app.github.dev/api/search?${params}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Search failed.");
    }

    if (!data.results || data.results.length === 0) {
      youtubeStatus.textContent = "No songs found.";
      return;
    }

    data.results.forEach((song) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "search-result-card";

      const thumbnail = document.createElement("img");
      thumbnail.src = song.thumbnail;
      thumbnail.alt = "";
      thumbnail.loading = "lazy";

      const details = document.createElement("span");
      details.className = "search-result-details";

      const title = document.createElement("strong");
      title.innerHTML = song.title
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

      const channel = document.createElement("small");
      channel.textContent = song.channel;

      details.append(title, channel);
      card.append(thumbnail, details);

      card.addEventListener("click", () => {
        youtubeInput.value = song.videoId;

        if (
          youtubePlayer &&
          typeof youtubePlayer.loadVideoById === "function"
        ) {
          youtubePlayer.loadVideoById(song.videoId);
          youtubeStatus.textContent = `Playing: ${song.title}`;
        } else {
          youtubeStatus.textContent =
            "YouTube player is still loading. Please try again.";
        }
      });

      searchResults.appendChild(card);
    });

    if (data.nextPageToken && page < 6) {
      pageTokens[page + 1] = data.nextPageToken;
      totalPages = Math.max(totalPages, page + 1);
    } else {
      totalPages = page;
    }

    youtubeStatus.textContent =
      `Showing ${data.results.length} songs on page ${page}.`;

    renderPagination();
  } catch (error) {
    youtubeStatus.textContent = error.message;
  }
}

function renderPagination() {
  pagination.replaceChildren();

  if (totalPages <= 1) return;

  function addPageButton(label, page, active = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = "page-button";

    if (active) button.classList.add("active");

    button.addEventListener("click", () => loadSearchPage(page));
    pagination.appendChild(button);
  }

  if (currentPage > 1) {
    addPageButton("‹", currentPage - 1);
  }

  for (let page = 1; page <= totalPages; page++) {
    if (
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
    ) {
      addPageButton(String(page), page, page === currentPage);
    } else if (
      page === currentPage - 2 ||
      page === currentPage + 2
    ) {
      const dots = document.createElement("span");
      dots.textContent = "…";
      pagination.appendChild(dots);
    }
  }

  if (currentPage < totalPages && pageTokens[currentPage + 1]) {
    addPageButton("›", currentPage + 1);
  }
}

if (youtubeInput && youtubeLoadButton && searchResults) {
  youtubeInput.placeholder = "Search songs or artists...";
  youtubeLoadButton.textContent = "Search";

  youtubeLoadButton.addEventListener("click", () => {
    const query = youtubeInput.value.trim();

    if (!query) {
      youtubeStatus.textContent = "Please enter a song or artist name.";
      return;
    }

    currentQuery = query;
    currentPage = 1;
    pageTokens = { 1: "" };
    totalPages = 1;

    loadSearchPage(1);
  });
}
