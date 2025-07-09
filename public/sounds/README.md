# Kitchen Display Audio Files

This directory contains audio files used by the Kitchen Display System for new order alerts.

## Required Files

### new-order.mp3 / new-order.wav
- **Purpose**: Alert sound when new orders arrive in the kitchen
- **Duration**: 1-3 seconds
- **Volume**: Moderate (should be audible in kitchen environment)
- **Suggested sounds**: 
  - Kitchen bell chime
  - Pleasant notification tone
  - Order ready bell sound

## Audio Requirements

- **Format**: MP3 (primary) and WAV (fallback)
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128kbps (MP3)
- **Volume**: Normalized to prevent sudden loud sounds
- **Length**: Short (1-3 seconds) to avoid disruption

## Usage

The Kitchen Display System will automatically play these sounds when:
- New orders are received
- Audio alerts are enabled in the kitchen interface
- Browser audio permissions are granted

## Browser Compatibility

- Modern browsers support both MP3 and WAV formats
- The system includes fallback from MP3 to WAV
- Audio playback requires user interaction to enable (browser security)

## Installation

1. Place your audio files in this directory:
   - `new-order.mp3`
   - `new-order.wav`
2. Ensure files are accessible via HTTP
3. Test audio in the kitchen display interface

## Testing

You can test the audio alerts by:
1. Opening the Kitchen Display (`/kitchen/[restaurantId]`)
2. Ensuring audio is enabled (🔊 ON button)
3. Placing a test order or manually refreshing when new orders arrive

Note: The first audio play may require user interaction due to browser autoplay policies. 