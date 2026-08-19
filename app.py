import io
import os
import csv
import re
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename

from video_processing import process_video

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__, static_folder='static', template_folder='templates')

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATA_FOLDER = os.path.join(BASE_DIR, 'data')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)


def normalize_google_sheet_url(sheet_url):
    if not sheet_url:
        return sheet_url

    if '/export?format=csv' in sheet_url:
        return sheet_url

    match = re.search(r'/spreadsheets/d/([A-Za-z0-9-_]+)', sheet_url)
    if not match:
        return sheet_url

    sheet_id = match.group(1)
    return f'https://docs.google.com/spreadsheets/d/1r0k_zDcLDCk7bZjGlA_AG8tFnR1-UhbW6PlpFYA8HqE/export?format=csv'


GOOGLE_SHEETS_CSV_URL = normalize_google_sheet_url(os.environ.get('GOOGLE_SHEETS_CSV_URL'))
GOOGLE_SHEETS_SUMMARY_URL = normalize_google_sheet_url(os.environ.get('GOOGLE_SHEETS_SUMMARY_URL'))


def read_csv_rows_from_url(csv_url):
    if not csv_url:
        return [], {}

    request = Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=30) as response:
        csv_text = response.read().decode('utf-8-sig')

    if not csv_text.strip():
        return [], {}

    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    summary_data = rows[0] if rows else {}
    return rows, summary_data


def get_analysis_payload(result=None):
    if GOOGLE_SHEETS_CSV_URL:
        try:
            detailed_rows, _ = read_csv_rows_from_url(GOOGLE_SHEETS_CSV_URL)
            summary_data = {}
            if GOOGLE_SHEETS_SUMMARY_URL:
                _, summary_data = read_csv_rows_from_url(GOOGLE_SHEETS_SUMMARY_URL)
            return detailed_rows, summary_data, (result or {}).get('output_video')
        except (URLError, HTTPError, ValueError):
            pass

    if not result:
        return [], {}, None

    analysis_results = []
    with open(result['detailed_csv'], mode='r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            analysis_results.append(row)

    summary_data = {}
    try:
        with open(result['summary_csv'], mode='r') as summary_file:
            csv_reader = csv.DictReader(summary_file)
            summary_data = next(csv_reader)
    except (FileNotFoundError, StopIteration):
        pass

    return analysis_results, summary_data, result.get('output_video')


@app.route('/')
def index():
    # Get list of uploaded videos that haven't been processed yet
    uploaded_videos = []
    for file in os.listdir(UPLOAD_FOLDER):
        #if file.lower().endswith(('.mp4', '.avi', '.mov', '.wmv')):
        if file.lower().endswith(('.mp4')):
            uploaded_videos.append(file)

    return render_template('index.html', uploaded_videos=uploaded_videos)


@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Save the uploaded video with secure filename
        filename = secure_filename(file.filename)
        video_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(video_path)

        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'Video uploaded successfully'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/start_analysis', methods=['POST'])
def start_analysis():
    try:
        # Get the filename from the request
        filename = request.form.get('filename')

        if not filename:
            return jsonify({'error': 'No filename provided'}), 400

        video_path = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404

        result = process_video(video_path)

        if not result:
            return jsonify({'error': 'Video processing failed'}), 500

        analysis_results, summary_data, output_video = get_analysis_payload(result)

        return jsonify({
            'analysis_results': analysis_results,
            'summary_data': summary_data,
            'output_video': output_video
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/list_videos')
def list_videos():
    try:
        # Get list of uploaded videos that haven't been processed yet
        uploaded_videos = []
        for file in os.listdir(UPLOAD_FOLDER):
            if file.lower().endswith(('.mp4', '.avi', '.mov', '.wmv')):
                uploaded_videos.append(file)

        return jsonify({
            'videos': uploaded_videos
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health_check():
    return jsonify({'status': 'ok'}), 200


# Keep the original analyze endpoint for backward compatibility
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Save the uploaded video with secure filename
        filename = secure_filename(file.filename)
        video_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(video_path)

        result = process_video(video_path)

        if not result:
            return jsonify({'error': 'Video processing failed'}), 500

        analysis_results, summary_data, output_video = get_analysis_payload(result)

        return jsonify({
            'analysis_results': analysis_results,
            'summary_data': summary_data,
            'output_video': output_video
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)