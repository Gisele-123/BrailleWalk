BrailleWalk Mobile

Voice-first, camera-powered accessibility assistant for visually impaired users. Built with Expo and React Native.

Prerequisites
- Node.js 18+
- Android Studio (for Android local builds)
- Expo CLI (bundled via npx)
- For iOS builds on Windows, use EAS Build

Install & Build
1) Install dependencies
```
npm install
```

2) Android (local)
```
npx expo prebuild --platform android
npx expo run:android
```

3) Web (quick testing; uses Web Speech API if supported)
```
npx expo start --web
```

4) iOS (via EAS on Windows)
```
npm i -g eas-cli
eas login
EAS_NO_VCS=1 eas build:configure
EAS_NO_VCS=1 eas build -p ios --profile preview
```

Permissions
- Microphone (voice commands)
- Camera (scanning, onboarding face setup)
- iOS: NSMicrophoneUsageDescription, NSSpeechRecognitionUsageDescription (configured)
- Android: RECORD_AUDIO (configured)

Voice-first UX
The app speaks actions and listens globally. Recognition pauses while TTS speaks and resumes automatically.

Global one-word commands
- "read" — describe the current screen
- "repeat" — repeat key instructions
- "back" (on emergency active) — return to previous screen

Onboarding
- App speaks setup steps automatically
- Say "scan" to begin face setup

Scanner (Home)
- Say "scan" to start scanning
- Say "stop" to stop scanning
- Say "read" for a screen summary
- Say "repeat" to repeat instructions

Navigation
- Say "go" — app prompts "Please say your destination", then speak it (e.g. "kitchen")
- Say "stop" — stops navigation
- Say "read" — summary of the navigation screen
- Say "repeat" — repeats intro instructions
- Say "repeat step" — repeats current instruction

Emergency
- Say "sos" — start activation countdown
- Say "cancel" — cancel countdown
- Say "read" — summary of the emergency screen
- Emergency Active: "back" — return to emergency screen

Settings
- Say one-word toggles: "voice", "haptic", "auto", "contrast", "commands", "emergency"
- Say "read" — summary of the settings screen

Notes
- Voice input is managed globally via a context; it auto-resumes after the assistant finishes speaking.
- If microphone permission is denied, the assistant announces how to enable it.

Next Steps (Model integration)
Provide the YOLO model; we will integrate it to replace simulated detection with:
- Real-time object detection
- Scene description and OCR for signs
- Audio descriptions of images and videos

Troubleshooting
- If voice doesn’t work on Android, ensure microphone permission is granted and rebuild after prebuild.
- If Web Speech API isn’t supported in your browser, test on Android or use EAS build for iOS.


