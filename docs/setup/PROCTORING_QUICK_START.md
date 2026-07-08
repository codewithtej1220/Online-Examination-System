# Advanced AI Proctoring - Quick Start 🚀

## ⚡ 3-Minute Setup

### 1️⃣ Install Dependencies (2 min)
```cmd
cd ai-service
pip install -r requirements.txt
```

**Note:** First run will download AI models (~200MB). Be patient!

### 2️⃣ Start AI Service (1 min)
```cmd
cd ai-service
python main.py
```

Watch for:
```
╔═══════════════════════════════════════════════════╗
║         OES Pro AI Microservice                  ║
║  Server running on: http://0.0.0.0:8000         ║
╚═══════════════════════════════════════════════════╝
```

### 3️⃣ Test Proctoring (30 sec)
Open http://localhost:8000/docs

Try the `/api/ai/proctor/analyze-stream` endpoint!

---

## 🎯 What Does It Do?

### **4 Simultaneous Checks (Every Frame):**

1. **👀 Gaze Tracking**
   - Detects if student looking away > 3 seconds
   - Tracks head pose (pitch, yaw, roll)
   - Monitors iris position

2. **👥 Face Detection**
   - Counts faces in frame
   - Flags if > 1 person detected
   - Detects unauthorized objects

3. **🔐 Identity Verification**
   - Compares face to baseline photo
   - Uses DeepFace + Facenet embeddings
   - Catches impersonation

4. **🎤 Audio Analysis**
   - Detects speech/whispering
   - Distinguishes from keyboard clicks
   - Compares to ambient baseline

---

## 📊 API Endpoints

### Start Session:
```bash
POST /api/ai/proctor/start-session
{
  "studentId": 1,
  "examId": 1,
  "attemptId": 1,
  "baselineImage": "data:image/jpeg;base64,...",
  "baselineAudio": "data:audio/wav;base64,..."
}
```

### Analyze Frame:
```bash
POST /api/ai/proctor/analyze-stream
{
  "studentId": 1,
  "examId": 1,
  "attemptId": 1,
  "frameData": "data:image/jpeg;base64,..."
}
```

### Get Summary:
```bash
GET /api/ai/proctor/session-summary/1/1/1
```

### End Session:
```bash
POST /api/ai/proctor/end-session/1/1/1
```

---

## 🎨 Sample Response

```json
{
  "success": true,
  "frame_number": 42,
  "processing_time_ms": 523,
  "aggregated_violations": {
    "has_violations": true,
    "severity": "high",
    "active_violations": [
      {
        "type": "multiple_faces",
        "severity": "high",
        "details": "2 faces detected"
      },
      {
        "type": "gaze_deviation",
        "severity": "medium",
        "details": "Looking away for 4.2s"
      }
    ]
  },
  "violation_summary": {
    "gaze": 3,
    "multi_face": 1,
    "identity": 0,
    "audio": 2
  }
}
```

---

## 🔧 Configuration

### Adjust Thresholds:

**Gaze Sensitivity** (`gaze_tracker.py`):
```python
self.gaze_away_threshold = 3.0  # Seconds (default: 3)
YAW_THRESHOLD = 30              # Degrees (default: 30)
```

**Identity Matching** (`face_verifier.py`):
```python
self.verification_threshold = 0.4  # Distance (default: 0.4)
# Lower = stricter matching
```

**Audio Detection** (`audio_analyzer.py`):
```python
self.energy_threshold = 0.02  # Volume (default: 0.02)
# Lower = more sensitive
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "ModuleNotFoundError" | Run `pip install -r requirements.txt` |
| Slow first run | AI models downloading (~200MB) |
| High CPU usage | Normal - uses 50-70% per session |
| "No face detected" | Ensure good lighting |
| "Model download failed" | Check internet connection |

---

## 📈 Performance Tips

1. **Frame Frequency:** Analyze every 30-60 seconds (not every frame!)
2. **Audio Optional:** Disable if not needed
3. **GPU Acceleration:** Install `tensorflow-gpu` if available
4. **Concurrent Sessions:** Max = CPU cores / 2

---

## 🎓 Integration Checklist

- [ ] AI service running on port 8000
- [ ] Backend routes configured
- [ ] Frontend captures frames every 30s
- [ ] Baseline photo captured at login
- [ ] Socket.io connected for real-time alerts
- [ ] Faculty dashboard shows live violations

---

## 🔥 Quick Test Script

```python
import requests
import base64

# Read test image
with open("test_face.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode()

# Test analysis
response = requests.post(
    "http://localhost:8000/api/ai/proctor/analyze-stream",
    json={
        "studentId": 1,
        "examId": 1,
        "attemptId": 1,
        "frameData": f"data:image/jpeg;base64,{img_b64}"
    }
)

print(response.json())
```

---

## 📚 Full Documentation

- **Complete Guide:** `ADVANCED_PROCTORING_COMPLETE.md`
- **Architecture:** See "Architecture Overview" section
- **API Reference:** http://localhost:8000/docs (when running)

---

**Need Help?** Check the complete documentation or review the code comments!

🎉 **Your AI proctoring system is ready to catch cheaters!**
