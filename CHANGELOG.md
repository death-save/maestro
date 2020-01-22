# Changelog

## [Unreleased]
- Critical hit sounds
- Soundboard for SFX

## [0.4.4] - 2020-01-19
### Changed
- Fixed issue with items that had no Item Track set (thanks `@tposney#1462` for finding this!)

## [0.4.3] - 2020-01-19
### Changed
- Fixed migration issues for tracks with no playlist set

## [0.4.2] - 2020-01-18
### Added
- Additional localization strings for Migration logging

### Changed
- Fixed bug with Item Tracks not playing
- Enabling the Hype Track Enable setting now correctly creates the Playlist without a reload
- Enabling the Item Track Create Playlist setting now correctly creates the Playlist without a reload

## [0.4.1] - 2020-01-18
### Added
- Japanese language translation (Thanks `Brother Sharp
#6921` on discord!)


## [0.4.0] - 2020-01-16
### Added
- Support for Foundry VTT 0.4.4
- Playlist Loop toggle
- Translation support

### Changed
- Module completely refactored to use [ES6 Modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/) 

### Removed
- Scene Playlist (deprecated by core functionality)
- Sequential Once Playback mode for Playlists (replaced by Playlist Loop toggle)