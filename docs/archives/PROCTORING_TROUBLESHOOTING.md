# 🎥 Proctoring Setup Troubleshooting Guide

## Issue: Camera/Microphone Not Working

### Quick Solution: Use Testing Mode! ⚡

For testing on localhost, you can **skip proctoring entirely**:

1. On the "Proctored Exam Setup" screen
2. Scroll to the bottom
3. Click **"Skip Proctoring (Testing Mode)"** button
4. Exam will start without camera/microphone!

---

## Why Camera Might Not Work

### 1. **Browser Permissions**
**Problem**: Browser blocked camera/microphone access

**Solutions**:
- **Chrome**: Click the camera icon in address bar → Allow
- **Edge**: Click the camera icon in address bar → Allow
- **Firefox**: Click the camera icon in address bar → Allow

**How to check**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - `NotAllowedError: Permission denied`
   - `NotFoundError: No camera found`
   - `NotReadableError: Camera in use`

### 2. **Camera Already in Use**
**Problem**: Another application is using your camera (Teams, Zoom, Skype, etc.)

**Solution**:
- Close all other applications using camera
- Refresh the page
- Try clicking "Enable Camera & Microphone" again

### 3. **No Camera/Microphone Found**
**Problem**: Your device doesn't have a camera/microphone or it's disabled

**Solution**:
- Check if your laptop has a built-in camera
- Check if external webcam is connected and powered on
- Check Windows Device Manager:
  - Press `Win + X` → Device Manager
  - Expand "Cameras" and "Audio inputs and outputs"
  - Make sure devices are enabled (no yellow/red icons)

### 4. **HTTPS Not Required for Localhost**
**Good news**: Modern browsers allow camera access on `localhost` even without HTTPS!

However, if you need HTTPS for production:
- Use a service like ngrok
- Set up SSL certificates
- Deploy to a hosting service with HTTPS

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

Press **F12** to open DevTools, then check Console tab for errors:

**Expected Success Messages**:
```
✅ Connected to proctoring server
🎥 Requesting camera and microphone access...
✅ Camera and microphone access granted
Stream tracks: [{kind: "video", enabled: true}, {kind: "audio", enabled: true}]
✅ Video metadata loaded
```

**Common Error Messages**:
```
❌ NotAllowedError: Permission denied
   → Solution: Allow camera in browser

❌ NotFoundError: Requested device not found
   → Solution: Connect a webcam

❌ NotReadableError: Could not start video source
   → Solution: Close other apps using camera

❌ OverconstrainedError: Constraints not satisfied
   → Solution: Camera doesn't support 640x480 (rare)
```

### Step 2: Test Camera in Browser

Open a new tab and go to: **https://webcamtests.com/**
- If camera works there → Permission issue with your app
- If camera doesn't work → System/hardware issue

### Step 3: Check Windows Camera Privacy Settings

1. Press `Win + I` to open Settings
2. Go to **Privacy & Security** → **Camera**
3. Make sure:
   - "Camera access" is **ON**
   - "Let apps access your camera" is **ON**
   - "Let desktop apps access your camera" is **ON**
4. Scroll down and allow for your browser (Chrome, Edge, Firefox)

Same for microphone:
- **Privacy & Security** → **Microphone**

---

## 🎯 Recommended Testing Flow

### For Development/Testing:

1. **Option A: Skip Proctoring** (Fastest)
   ```
   Click "Skip Proctoring (Testing Mode)" button
   ↓
   Exam starts immediately
   ↓
   No camera/microphone needed
   ```

2. **Option B: Test with Camera** (Full experience)
   ```
   Allow camera when prompted
   ↓
   Wait for video preview
   ↓
   Click "Start Proctored Exam"
   ↓
   Grant fullscreen permission
   ↓
   Exam starts with proctoring
   ```

### For Production:

1. Deploy to HTTPS server (required for production)
2. Test camera permissions with real students
3. Provide clear instructions to students:
   - Close other apps using camera
   - Allow permissions when prompted
   - Use supported browser (Chrome, Edge, Firefox)

---

## 🛠️ Fixes Applied

### Enhanced Camera Permission Handler

**Before**:
```javascript
// Basic error handling
catch (error) {
  console.error('Camera access error:', error);
  setCameraError('Camera access denied. Please enable camera to continue.');
}
```

**After**:
```javascript
// Detailed error messages based on error type
catch (error) {
  if (error.name === 'NotAllowedError') {
    errorMessage = 'Please allow camera and microphone access in your browser settings.';
  } else if (error.name === 'NotFoundError') {
    errorMessage = 'No camera or microphone found. Please connect a device.';
  } else if (error.name === 'NotReadableError') {
    errorMessage = 'Camera is being used by another application.';
  }
  // ... more error types
}
```

### Auto-Request Camera on Load

**New Feature**: Camera permission is automatically requested when page loads
- Better UX (no need to click button first)
- Shows permission prompt immediately
- Gives clear feedback if denied

### Better Logging

**Console messages now include**:
- 🎥 When requesting camera
- ✅ When access granted
- 🎬 Stream track details (video + audio)
- ✅ When video metadata loaded
- ❌ Detailed error messages

---

## 📊 Component Flow

### Setup Phase:
```
1. Component mounts
   ↓
2. Socket.io connects to server
   ↓
3. Auto-request camera (500ms delay)
   ↓
4. Show camera preview if granted
   ↓
5. User clicks "Start Proctored Exam"
   OR
   User clicks "Skip Proctoring"
   ↓
6. Exam starts
```

### Exam Phase:
```
1. Enter fullscreen mode
   ↓
2. Start video recording
   ↓
3. Start frame analysis (every 2 seconds)
   ↓
4. Monitor for violations:
   - Tab switching
   - Fullscreen exit
   - Multiple faces
   - Looking away
   - High noise
   ↓
5. Send alerts to faculty in real-time
```

---

## 🔐 Browser Compatibility

### ✅ Fully Supported:
- **Chrome** 89+
- **Edge** 89+
- **Firefox** 88+
- **Safari** 14+ (macOS/iOS)
- **Opera** 75+

### ⚠️ Limited Support:
- **Internet Explorer** (NOT supported - use Edge)
- **Older browsers** (update to latest version)

### Required APIs:
- `navigator.mediaDevices.getUserMedia()` - ✅ All modern browsers
- `document.requestFullscreen()` - ✅ All modern browsers
- `Socket.io` - ✅ Works everywhere
- `RecordRTC` - ✅ Works everywhere

---

## 🎓 Student Instructions

### Before the Exam:

1. **Use a supported browser**
   - Chrome, Edge, or Firefox (latest version)

2. **Close other applications**
   - Zoom, Teams, Skype, Discord, etc.

3. **Test your camera**
   - Go to https://webcamtests.com/
   - Make sure camera works properly

4. **Check internet connection**
   - Stable connection required for video upload

5. **Find a quiet, well-lit space**
   - Good lighting for face detection
   - Minimal background noise

### During Exam Setup:

1. **Allow camera and microphone** when prompted
2. **Position yourself** so face is clearly visible
3. **Check requirements** are all green checkmarks
4. **Click "Start Proctored Exam"**
5. **Allow fullscreen** when prompted

### During the Exam:

✅ **DO**:
- Keep your face visible in camera
- Stay in fullscreen mode
- Look at the screen
- Work independently

❌ **DON'T**:
- Switch tabs or windows
- Use other monitors (if detected)
- Leave fullscreen mode
- Have other people in frame
- Use copy/paste (blocked)
- Right-click (disabled)

---

## 🚨 Common Violations & Alerts

### Automatic Detection:

| Violation | Detection | Faculty Alert | Student Alert |
|-----------|-----------|---------------|---------------|
| **Tab Switch** | Visibility API | ⚠️ Real-time | ⚠️ Popup |
| **Exit Fullscreen** | Fullscreen API | ⚠️ Real-time | ⚠️ Popup |
| **Multiple Faces** | Face detection | 🔴 Real-time | None |
| **No Face** | Face detection | 🟡 Real-time | None |
| **Looking Away** | Head pose | 🟡 Real-time | None |
| **High Noise** | Audio analysis | 🟡 Real-time | None |
| **Copy/Paste** | Clipboard API | ⚠️ Real-time | ⚠️ Blocked |
| **Right Click** | Context menu | ⚠️ Real-time | ⚠️ Blocked |

---

## 📹 Recording & Storage

### Video Recording:
- **Format**: WebM
- **Quality**: 1 Mbps, 15 fps
- **Duration**: Full exam length
- **Size**: ~7.5 MB per minute
- **Upload**: Automatic after exam submission

### Storage Location:
```
Backend: /recordings/
Filename: exam_{examId}_student_{studentId}_{attemptId}.webm
```

### Frame Analysis:
- **Frequency**: Every 2 seconds
- **Format**: JPEG (base64)
- **Processing**: Server-side (Python/OpenCV or cloud API)
- **Results**: Real-time alerts to faculty

---

## 🔧 Configuration Options

### Disable Proctoring for Testing:

**Option 1**: Use "Skip Proctoring" button (already available)

**Option 2**: Environment variable (for dev):
```env
# In .env file
PROCTORING_ENABLED=false
```

**Option 3**: Feature flag (for specific exams):
```javascript
// In exam creation
{
  proctoring_enabled: false  // Disable for this exam
}
```

---

## 🆘 Still Having Issues?

### Quick Checklist:
- [ ] Used Chrome/Edge/Firefox (latest version)
- [ ] Allowed camera/microphone in browser
- [ ] Closed other apps using camera
- [ ] Camera works on https://webcamtests.com/
- [ ] Windows privacy settings allow camera
- [ ] Tried refreshing the page
- [ ] Checked browser console for errors

### For Testing:
- [ ] Used "Skip Proctoring (Testing Mode)" button
- [ ] Bypassed camera requirements completely
- [ ] Exam started without issues

### For Production Issues:
1. Check backend logs for errors
2. Check Socket.io connection status
3. Verify proctoring service is running
4. Test with different devices/browsers
5. Contact system administrator

---

## 📚 Additional Resources

### Documentation:
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [Socket.io](https://socket.io/docs/v4/)
- [RecordRTC](https://recordrtc.org/)

### Testing Tools:
- **Camera Test**: https://webcamtests.com/
- **Microphone Test**: https://www.onlinemictest.com/
- **WebRTC Test**: https://test.webrtc.org/

---

## ✅ Success Indicators

### Camera Working:
- ✅ Green checkmark next to "Webcam enabled"
- ✅ Live video preview showing your face
- ✅ "Live" indicator with pulsing dot
- ✅ "Enable Camera & Microphone" button becomes "Disable Camera & Microphone"

### Microphone Working:
- ✅ Green checkmark next to "Microphone enabled"
- ✅ Audio level indicator moving (if visible)
- ✅ No "No microphone found" error

### Ready to Start:
- ✅ All requirements showing green checkmarks
- ✅ "Start Proctored Exam" button enabled (not grayed out)
- ✅ Video preview showing clearly
- ✅ No error messages visible

---

**Remember**: For testing purposes, you can always use **"Skip Proctoring (Testing Mode)"** button to bypass all camera requirements! 🎉

**For production**: Make sure to test with real devices and browsers before deploying to students.
