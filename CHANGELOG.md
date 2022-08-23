# Changelog

## Known Issues
1. ~~Critical Sounds do not play when roll made with advantage/disadvantage~~ (resolved in 0.9.0)
2. Critical Sounds ~~do~~ may not play with modules such as BetterRolls5e (possibly resolved in 0.7.6)
3. A GM must be logged in for many of the Maestro functions to work due to underlying Foundry permission requirements.
4. Game systems that do not include an Item Id reference in their item roll chat messages **cannot** be used with Item Tracks
---
## [0.9.0] - 2022-08-22
> This update adds support for Foundry VTT v10

### Combat Tracks
- **Combat Track Config** is no longer accessible from the Combat Tracker tab and is now available from the Combat Tracker Config form instead (the cog/gear icon in the Combat Tracker).
- - This change was made to avoid overloading the Combat Tracker controls.
- All GMs in a game can now access the **Combat Track Config**. 

### Hype Tracks
- Players can once again configure **Hype Tracks** for Actors they are the Owner of.

### Miscellaneous
- **Maesto Config** (aka Crit Success/Failure config) is no longer available in the Playlist tab in the sidebar. It is still available in the Module Settings.
- - This change was made to avoid overloading the Playlist tab actions.
- **Crit Success/Failure Tracks** should now work for modified rolls (eg. advantage/disadvantage in dnd5e)
- All GMs in a game can now edit the **Critical Success/Failure Tracks** config. 

### Localization
- Updated Spanish translation (thanks @lozanoje 🎉)

## [0.8.0] - 2021-12-31
> This update adds support for Foundry VTT v9
### Hype Tracks
- Added the ability to select a Hype Tracks playlist per Actor and additionally play all, or a random track (sound) from the selected playlist
- Suppressed the playback of Hype Tracks during Round 0 of Combat. This fixes the unintended repeated playing of the current combatant's Hype Track (if any) while initiative is being rolled. (Thanks @k-barber 🎉) 
- Fixed an issue that caused Hype Tracks to not resume playing other sounds (eg. Combat Track) when the round changes and the first Combatant has a Hype Track

### Item Tracks
- Added tracking of deleted owned items and their associated Item Tracks so tracks can still be played. This fixes a bug where consumable items (eg. items with charges) that were set to `Destroy on Empty` (or similar) use would not play their Item Track

### Miscellaneous
- Implemented a system to find the first active GM whenever an elevated/privileged action is required (eg. setting a `world` setting). Previously it was only checked if the current user was a GM, which could lead to unintended consequences or "race conditions" when multiple GMs were logged in

### Localization
- Spanish translation updated (as of 0.7.6) - thanks @lozalojo 🎉

## [0.7.6] - 2021-10-03
### Item Tracks
- Improved the detection of token/actor and items in chat messages for Item Tracks
- Added a setting for the item-id attribute checked for in chat messages for Item Tracks
> These changes combined should greatly improve compatibility with different game systems
### Various
- Random playback option in Hype, Combat, Critical Success/Failure Tracks is now actually random again
- Playlist loop toggle can now only be seen/set by a GM which avoids an error that occurs when a non-GM tries to configure it
- When Hype/Combat Tracks pause sounds, they will now pause regardless of whether the playlist itself is marked as "playing"
### Hype Tracks
- When combat ends Hype Tracks will also end
- Hype Tracks correctly pause Combat Tracks
### Combat Tracks
- Combat Tracks now include a setting to pause other playlist sounds while they are playing. At the end of a Combat Track, the previously paused sounds should resume
- If there is a combat encounter the Combat Tracks config will open to the ENCOUNTER tab instead of DEFAULTS
### Critical Success/Failure Tracks
- Critical Success/Failure Tracks now include settings to configure the number of faces/die type (eg. 20 for d20) to trigger off and the threshold for success and failure
---
## [0.7.5] - 2021-07-13
- Added Foundry VTT v0.8.x compatibility

## [0.7.4] - 2021-02-01
- Release workflow refinements

## [0.7.3] - 2021-01-31
- Skip processing playlist sound updates if already processed
- Improve some logic in Hype Track
- Improve some logic in Item Track

## [0.7.2] - 2020-10-31
### Added
- Português (Brasil) translation (thanks @rinnocenti!)
- Spanish translation (thanks @lozalojo)

### Fixed
- Combat Track config not opening

## [0.7.1] - 2020-06-20
### Added
- 한국어 (Korean) translation (thanks KLO!)

### Fixed
- Fixed bug where Combat Tracks playlist was not created when first enabled
- Maestro additional config now opens from the Module Settings menu

## [0.7.0] - 2020-06-19
### Added
- New macro methods:
- - `game.maestro.findSound` finds a playlist sound by its name or path
- - `game.maestro.playByName` allows playing a playlist sound using its name (best effort)
- - `game.maestro.pause` pauses one or many sounds (or names of sounds)
- - `game.maestro.pauseAll` pauses all active playlist sounds
- - `game.maestro.resume` resumes playing one or many sounds
- - `game.maestro.playHype` play an actor's hype track
- New setting to allow Hype Tracks to pause other playing sounds (disabled by default) -- paused sounds will resume when the Hype Track finishes

### Changed
- Players can now set **Hype Tracks** for Actors they own
- Refactored hooks to use new structure
- Certify compatibility with Foundry VTT 0.6.3
- Maestro Config is now also available in Module Settings

### Fixed
- Fixed bug where Hype Tracks could not be created/set when first enabled
- Fixed bug where Hype Tracks playlist was not created when first enabled
- Fixed bug where Item Tracks playlist was not created when first enabled

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
