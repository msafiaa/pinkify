
# Pinkify 🎀

A pink-themed music player designed for a simple and enjoyable listening experience.

## About

Pinkify is a web-based music player that combines a soft pink aesthetic with local audio playback and YouTube music search. Users can upload their own audio files, save them in browser storage, and listen to their saved tracks again after refreshing the page.

## Features

- **Local Music Playback** — Upload and play audio files from your device.
- **Persistent Local Storage** — Save uploaded audio files in IndexedDB so they remain available after refreshing the page.
- **Offline Playback** — Play previously saved local audio without an internet connection, provided the files remain stored in the browser.
- **YouTube Integration** — Load YouTube videos using a video link or video ID.
- **Music Search** — Search for songs and artists through the YouTube Data API.
- **Search Pagination** — Browse search results across multiple pages.
- **Pink-Themed Interface** — A soft, modern interface with a pink aesthetic.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Python
- Flask
- YouTube Data API v3
- YouTube IFrame Player API
- IndexedDB
- GitHub Codespaces

## Project Structure

    pinkify/
    ├── backend/
    │   ├── app.py
    │   └── requirements.txt
    ├── css/
    │   └── style.css
    ├── js/
    │   └── app.js
    ├── ui/
    │   └── index.html
    └── README.md

## Getting Started

### Prerequisites

- Python 3
- A modern web browser
- A YouTube Data API v3 API key for music search

### 1. Clone the repository

    git clone https://github.com/msafiaa/pinkify.git
    cd pinkify

### 2. Install backend dependencies

    pip install -r backend/requirements.txt

### 3. Configure the YouTube API key

Set your API key as an environment variable.

For macOS or Linux:

    export YOUTUBE_API_KEY="YOUR_API_KEY"

For Windows PowerShell:

    $env:YOUTUBE_API_KEY="YOUR_API_KEY"

**Security:** Never commit your API key or share it publicly. Keep it in an environment variable and restrict the key through Google Cloud Console.

### 4. Start the backend

    python backend/app.py

### 5. Start the frontend

Open a second terminal and serve the frontend directory containing `index.html`. For example, if the HTML file is inside `ui/`:

    python -m http.server 8000 --directory ui

Open the local server address shown in the terminal.

> If your frontend or backend uses a different port or URL, update the configuration accordingly.

## Offline Storage

Pinkify uses IndexedDB to store uploaded local audio files in the browser. Saved tracks can be restored after refreshing the page and played offline when the browser has retained the stored files.

Local audio storage is browser-specific. Clearing browser site data may delete saved tracks. YouTube search and streaming require an internet connection.

## API Usage

Pinkify uses the YouTube Data API v3 to search for videos and the YouTube IFrame Player API to play supported YouTube videos.

API availability and quota limits depend on the Google Cloud project configuration.

## Future Improvements

- Improve playlist management
- Add track metadata and playback controls
- Enhance responsive design for mobile devices
- Improve error handling and accessibility

## Author

Developed by **misaa**

## License

No license has been specified yet. Please check the repository owner’s intentions before reusing or redistributing this project.
