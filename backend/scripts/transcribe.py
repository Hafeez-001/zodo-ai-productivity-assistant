import sys
import os
import torch
from faster_whisper import WhisperModel

def transcribe(audio_path):
    # Check if GPU is available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    # Use float16 on GPU, int8 on CPU for speed
    compute_type = "float16" if device == "cuda" else "int8"

    try:
        # Load model (tiny or base for speed, medium or large-v3 for quality)
        model_size = "base"
        model = WhisperModel(model_size, device=device, compute_type=compute_type)

        # Transcribe
        segments, info = model.transcribe(audio_path, beam_size=5)

        # Combine segments
        transcript = " ".join([segment.text for segment in segments])
        print(transcript.strip())

    except Exception as e:
        print(f"Error during transcription: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_path>", file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    if not os.path.exists(audio_file):
        print(f"File not found: {audio_file}", file=sys.stderr)
        sys.exit(1)
        
    transcribe(audio_file)
