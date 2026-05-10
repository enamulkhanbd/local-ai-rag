# Backend

FastAPI backend for the local RAG app.

## Supported Sources

- Websites via URL input
- PDF documents
- Microsoft Office files: Word, Excel, PowerPoint, including common legacy/template variants
- Text-based files: TXT, MD, RTF, CSV, TSV, JSON, XML, HTML
- OpenDocument files: ODT, ODS, ODP
- Email exports: EML, MSG, MBOX
- Images
- Audio
- Video

## Setup

1. Create a `.env` file in the project root with the API keys you want to use:

```env
GOOGLE_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
DEEPSEEK_API_KEY=your_deepseek_key
OPENROUTER_API_KEY=your_openrouter_key
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the API:

```bash
python3 main.py
```

The frontend calls this backend at `http://localhost:8000`.
