# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (updated for newer Debian versions)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libmagic1 \
    libgl1 \
    libglib2.0-0 \
    libopenblas-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non-root user and switch to it (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory to the home directory
WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Expose the port (Hugging Face uses 7860 by default)
ENV PORT=7860
EXPOSE 7860

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
