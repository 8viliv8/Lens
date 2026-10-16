# APP DECK v0.1 — Windows VST3 prototype

This is an **unverified** JUCE VST3/Standalone prototype, not a released binary.

## Features in source
- Glass-style native UI
- 8 sample slots; WAV/AIFF/MP3 subject to JUCE codec availability
- LOOP and SHOT modes; MIDI note triggers for SHOT
- Host transport and tempo reading
- State saves file paths and slot parameters

## Known limitations
- No pitch-preserving time stretching or true BPM matching.
- Loop lengths are not fitted to musical bars.
- Samples are decoded fully into memory, with a maximum of 20 million frames each.
- Sample file paths must remain accessible when a DAW project is reopened.
- The editor only operates on one selected channel at a time.
- Real-time safety and Cubase compatibility have not been verified.
- Audio playback is not verified until a Windows build and DAW test pass.

## Windows CI
See [GitHub Actions](../../actions/workflows/app-deck-windows.yml) on the `app-deck-v01-build` branch. Workflow uploads VST3 and standalone build artifacts if successful.

## Manual build
Install Visual Studio C++ build tools, CMake, Ninja, and Git, then:
```powershell
cmake -S app-deck -B app-deck/build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build app-deck/build --target AppDeck_VST3 AppDeck_Standalone --parallel 2
```

JUCE is fetched from GitHub during configuration.
