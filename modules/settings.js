import * as MAESTRO from "./config.js";
import { _checkForCriticalPlaylist, _checkForFailurePlaylist, MaestroConfigForm } from "./misc.js";

export const registerModuleSettings = function() {

    /* -------------------------------------------- */
    /*                  Hype Track                  */
    /* -------------------------------------------- */

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.HypeTrack.enable, {
        name: "MAESTRO.SETTINGS.HypeTrackEnableN",
        hint: "MAESTRO.SETTINGS.HypeTrackEnableH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: async s => {
            if (!game.maestro.hypeTrack) {
                return;
            }

            await game.maestro.hypeTrack._checkForHypeTracksPlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.HypeTrack.pauseOthers, {
        name: "MAESTRO.SETTINGS.HypeTrackPauseOthersN",
        hint: "MAESTRO.SETTINGS.HypeTrackPauseOthersH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: async s => {}
    }),

    /* -------------------------------------------- */
    /*                  Item Track                  */
    /* -------------------------------------------- */

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable, {
        name: "MAESTRO.SETTINGS.ItemTrackEnableN",
        hint: "MAESTRO.SETTINGS.ItemTrackEnableH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.createPlaylist, {
        name: "MAESTRO.SETTINGS.ItemTrackCreatePlaylistN",
        hint: "MAESTRO.SETTINGS.ItemTrackCreatePlaylistH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.maestro.itemTrack) {
                return;
            }

            game.maestro.itemTrack._checkForItemTracksPlaylist();
        }
    }),

    /* -------------------------------------------- */
    /*                 Combat Track                 */
    /* -------------------------------------------- */

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable, {
        name: "MAESTRO.SETTINGS.CombatTrackEnableN",
        hint: "MAESTRO.SETTINGS.CombatTrackEnableH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.createPlaylist, {
        name: "MAESTRO.SETTINGS.CombatTrackCreatePlaylistN",
        hint: "MAESTRO.SETTINGS.CombatTrackCreatePlaylistH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.maestro.combatTrack) {
                return;
            }

            game.maestro.combatTrack._checkForCombatTracksPlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist, {
        name: "MAESTRO.SETTINGS.CombatTrackDefaultPlaylistN",
        hint: "MAESTRO.SETTINGS.CombatTrackDefaultPlaylistH",
        scope: "world",
        type: String,
        default: "",
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultTrack, {
        name: "MAESTRO.SETTINGS.CombatTrackDefaultTrackN",
        hint: "MAESTRO.SETTINGS.CombatTrackDefaultTrackH",
        scope: "world",
        type: String,
        default: "",
        onChange: s => {
            
        }
    }),

    /* -------------------------------------------- */
    /*                   Migration                  */
    /* -------------------------------------------- */

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Migration.currentVersion, {
        name: "MAESTRO.SETTINGS.MigrateCurrentVersionN",
        hint: "MAESTRO.SETTINGS.MigrateCurrentVersionH",
        scope: "world",
        type: String,
        default: "",
        onChange: s => {

        }
    }),

    /* -------------------------------------------- */
    /*                     Misc                     */
    /* -------------------------------------------- */

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.disableDiceSound, {
        name: "MAESTRO.SETTINGS.DisableDiceSoundN",
        hint: "MAESTRO.SETTINGS.DisableDiceSoundH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {

        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks, {
        name: "MAESTRO.SETTINGS.EnableCriticalSuccessFailureTracksN",
        hint: "MAESTRO.SETTINGS.EnableCriticalSuccessFailureTracksH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {

        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.createCriticalSuccessPlaylist, {
        name: "MAESTRO.SETTINGS.CreateCriticalSuccessPlaylistN",
        hint: "MAESTRO.SETTINGS.CreateCriticalSuccessPlaylistH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks)) {
                return;
            }

            _checkForCriticalPlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.createCriticalFailurePlaylist, {
        name: "MAESTRO.SETTINGS.CreateCriticalFailurePlaylistN",
        hint: "MAESTRO.SETTINGS.CreateCriticalFailurePlaylistH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks)) {
                return;
            }

            _checkForFailurePlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks, {
        name: "MAESTRO.SETTINGS.CriticalSuccessFailureTracksN",
        hint: "MAESTRO.SETTINGS.CriticalSuccessFailureTracksH",
        scope: "world",
        type: Object,
        default: {
            criticalSuccessPlaylist: game.playlists ? game.playlists.entities.find(p => p.name === MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName) : "",
            criticalSuccessSound: "",
            criticalFailurePlaylist: game.playlists ? game.playlists.entities.find(p => p.name === MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName) : "",
            criticalFailureSound: ""
        },
        config: false,
        onChange: s => {

        }
    }),

    game.settings.registerMenu(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.maestroConfigMenu,{
        name: "MAESTRO.SETTINGS.Config.ButtonN",
        label: MAESTRO.DEFAULT_CONFIG.Misc.maestroConfigTitle,
        hint: "MAESTRO.SETTINGS.Config.ButtonH",
        icon: "fas fa-cog",
        type: MaestroConfigForm,
        restricted: true
    })
}