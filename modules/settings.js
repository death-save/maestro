import * as MAESTRO from "./config.js";

export const registerModuleSettings = function() {

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.HypeTrack.enable, {
        name: "SETTINGS.HypeTrackEnableN",
        hint: "SETTINGS.HypeTrackEnableH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.maestro.HypeTrack) {
                return;
            }

            game.maestro.HypeTrack._checkForHypeTracksPlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable, {
        name: "SETTINGS.ItemTrackEnableN",
        hint: "SETTINGS.ItemTrackEnableH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.createPlaylist, {
        name: "SETTINGS.ItemTrackCreatePlaylistN",
        hint: "SETTINGS.ItemTrackCreatePlaylistH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.maestro.ItemTrack) {
                return;
            }

            game.maestro.ItemTrack._checkForItemTracksPlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable, {
        name: "SETTINGS.CombatTrackEnableN",
        hint: "SETTINGS.CombatTrackEnableH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.createPlaylist, {
        name: "SETTINGS.CombatTrackCreatePlaylistN",
        hint: "SETTINGS.CombatTrackCreatePlaylistH",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: s => {
            if (!game.maestro.CombatTrack) {
                return;
            }

            game.maestro.CombatTrack._checkForCombatTracksPlaylist();
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist, {
        name: "SETTINGS.CombatTrackDefaultPlaylistN",
        hint: "SETTINGS.CombatTrackDefaultPlaylistH",
        scope: "world",
        type: String,
        default: "",
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultTrack, {
        name: "SETTINGS.CombatTrackDefaultTrackN",
        hint: "SETTINGS.CombatTrackDefaultTrackH",
        scope: "world",
        type: String,
        default: "",
        onChange: s => {
            
        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Migration.currentVersion, {
        name: "SETTINGS.MigrateCurrentVersionN",
        hint: "SETTINGS.MigrateCurrentVersionH",
        scope: "world",
        type: String,
        default: "",
        onChange: s => {

        }
    }),

    game.settings.register(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.disableDiceSound, {
        name: "SETTINGS.DisableDiceSoundN",
        hint: "SETTINGS.DisableDiceSoundH",
        scope: "world",
        type: Boolean,
        default: "",
        config: true,
        onChange: s => {

        }
    })
}