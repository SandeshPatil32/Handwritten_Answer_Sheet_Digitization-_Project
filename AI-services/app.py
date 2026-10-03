import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from routes.scan_routes import scan_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

# Flask-side safety limit. Node/Multer also limits uploads to 10 MB.
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

app.register_blueprint(scan_bp, url_prefix="/api")


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "AnswerCheck AI Service",
            "geminiConfigured": bool(os.getenv("GEMINI_API_KEY")),
            "model": os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
            "htrEngine": os.getenv("HTR_ENGINE", "hybrid"),
            "trocrModel": os.getenv("TROCR_MODEL", "microsoft/trocr-base-handwritten"),
        }
    )


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"message": "File is too large. Maximum allowed size is 10 MB."}), 413


if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    app.run(host="127.0.0.1", port=port, debug=True)
