# Running Analysis

A Flask app for analyzing running form and displaying summary metrics.

## Local setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   . .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the app:
   ```bash
   python app.py
   ```

## Deployment notes

This app is designed to be hosted on a service that supports Python and OpenCV. Set the following environment variables when deploying:

```bash
GOOGLE_SHEETS_CSV_URL="https://docs.google.com/spreadsheets/.../export?format=csv"
GOOGLE_SHEETS_SUMMARY_URL="https://docs.google.com/spreadsheets/.../export?format=csv"
PORT=5000
```

The app will also work with the local generated CSV files if those environment variables are not set.
