# Changelog

## [Unreleased]
- Soundboard for SFX
- Possible support for external audio services (YouTube etc)

## [0.6.4] - 2020-04-18
### Fixed
- Migration no longer fails to set the new migration version in Foundry v0.5.2+

## [0.6.3] - 2020-02-24
### Fixed
- Critical Success/Failure no longer throws an error for non-GM users

## [0.6.2] - 2020-02-24
### Changed
- Revised versioning for Critical Success/Failure tracks release

### Fixed
- Corrected some bad translation strings in settings

## [0.6.1] - 2020-02-17
### Changed
- Fixed an issue with Hype Tracks not playing

## [0.6.0] - 2020-02-15
### Added
- Added Critical/Failure Tracks -- set a track or playlist to play when a critical or failure is rolled (limited system support at this time). Some sample sounds are included in the Sounds directory under the Maestro module directory.
- Added a new Maestro Config button (currently just used to set Critical Success/Failure Track selections)

### Changed
- Fixed an issue where the core Dice Sound was not suppressed when the relevant Maestro setting was enabled

## [0.5.3] - 2020-01-25
### Changed
- Fixed issue with Item Track Migration not working for Actor owned Items

## [0.5.2] - 2020-01-25
### Changed
- Fixed issue with Item Tracks causing warning for non-GMs
- Fixed issue with Combat Tracks playing at the wrong time

## [0.5.1] - 2020-01-25
### Added
- Added option to set default Combat Track (or playlist)

## [0.5.0] - 2020-01-24
### Added
- Added Combat Tracks -- set a playlist or track to play when a Combat encounter begins!
- Added Setting to disable the default dice roll sound on Chat Messages

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
