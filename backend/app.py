
import os

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


@app.route("/api/search")
def search_songs():
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({"error": "Please enter a song or artist name."}), 400

    if not YOUTUBE_API_KEY:
        return jsonify({"error": "YouTube API key is not configured."}), 500

    try:
        response = requests.get(
            YOUTUBE_SEARCH_URL,
            params={
                "part": "snippet",
                "q": f"{query} music",
                "type": "video",
                "videoEmbeddable": "true",
                "maxResults": 10,
                "key": YOUTUBE_API_KEY,
            },
            timeout=15,
        )

        data = response.json()

        if response.status_code != 200:
            return jsonify({
                "error": data.get("error", {}).get(
                    "message", "YouTube search failed."
                )
            }), response.status_code

        results = []

        for item in data.get("items", []):
            video_id = item["id"]["videoId"]
            snippet = item["snippet"]

            results.append({
                "videoId": video_id,
                "title": snippet["title"],
                "channel": snippet["channelTitle"],
                "thumbnail": snippet["thumbnails"]["medium"]["url"],
            })

        return jsonify({"results": results})

    except requests.RequestException:
        return jsonify({"error": "Could not connect to YouTube. Try again."}), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
