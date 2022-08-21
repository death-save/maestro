// @ts-check
import CombatTrack from "./modules/combat-track.js";
import HypeTrack from "./modules/hype-track.js";
import ItemTrack from "./modules/item-track.js";
import { migrationHandler } from "./modules/migration.js";
import * as Misc from "./modules/misc.js";
import * as Playback from "./modules/playback.js";
import { registerModuleSettings } from "./modules/settings.js";

/**
 * Orchestrates (pun) module functionality
 */
export default class Conductor {
    static begin() {
        Conductor._hookOnInit();
        Conductor._hookOnReady();
    }

    /**
     * Init Hook
     */
    static async _hookOnInit() {
        Hooks.on("init", async () => {
            game.maestro = {};
            await registerModuleSettings();
            Conductor._initHookRegistrations();
        });
    }

    /**
     * Ready Hook
     */
    static async _hookOnReady() {
        Hooks.on("ready", async () => {
            game.maestro.hypeTrack = new HypeTrack();
            game.maestro.itemTrack = new ItemTrack();
            game.maestro.combatTrack = new CombatTrack();

            HypeTrack._onReady();
            ItemTrack._onReady();
            CombatTrack._onReady();

            Misc._checkForCriticalPlaylist();
            Misc._checkForFailurePlaylist();

            // Macros/external methods
            game.maestro.pause = Playback.pauseSounds;
            game.maestro.playByName = Playback.playSoundByName;
            game.maestro.findSound = Playback.findPlaylistSound;
            game.maestro.pauseAll = Playback.pauseAll;
            game.maestro.resume = Playback.resumeSounds;

            //Set a timeout to allow the sheets to register correctly before we try to hook on them
            window.setTimeout(Conductor._readyHookRegistrations, 500);
            //Conductor._readyHookRegistrations();

            if (game.version >= "0.4.4" && Misc.isFirstGM()) {
                game.maestro.migration = {};
                migrationHandler();
            }
        });
    }

    /**
     * Init Hook Registrations
     */
    static _initHookRegistrations() {
        Conductor._hookOnRenderPlaylistDirectory();
    }

    /**
     * Ready Hook Registrations
     */
    static _readyHookRegistrations() {
        // Sheet/App Render Hooks
        Conductor._hookOnRenderActorSheet();
        Conductor._hookOnRenderItemSheet();
        Conductor._hookOnRenderChatMessage();
        Conductor._hookOnRenderCombatTrackerConfig();

        // Pre-Create Hooks
        Conductor._hookOnPreCreateChatMessage();

        // Pre-update Hooks
        Conductor._hookOnPreUpdatePlaylistSound();
        Conductor._hookOnPreUpdatePlaylist();
        Conductor._hookOnPreUpdateCombat();

        // Update Hooks
        Conductor._hookOnUpdateCombat();
        //Conductor._hookOnUpdatePlaylist();

        // Delete hooks
        Conductor._hookOnDeleteCombat();
        Conductor._hookOnDeleteItem();
    }

    /**
     * PreUpdate Playlist Hook
     */
    static _hookOnPreUpdatePlaylist() {
        Hooks.on("preUpdatePlaylist", (playlist, update, options, userId) => {
            // unused
        });
    }

    /**
     * PreUpdate Playlist Sound Hook
     */
    static _hookOnPreUpdatePlaylistSound() {
        Hooks.on("preUpdatePlaylistSound", (sound, update, options, userId) => {
            Misc._onPreUpdatePlaylistSound(sound, update, options, userId);
        });
    }

    /**
     * PreCreate Chat Message Hook
     */
    static _hookOnPreCreateChatMessage() {
        Hooks.on("preCreateChatMessage", (message, options, userId) => {
            Misc._onPreCreateChatMessage(message, options);
        });
    }

    static _hookOnDeleteItem() {
        Hooks.on("deleteItem", (item, options, userId) => {
            ItemTrack._onDeleteItem(item, options, userId);
        });
    }

    /**
     * PreUpdate Combat Hook
     */
    static _hookOnPreUpdateCombat() {
        Hooks.on("preUpdateCombat", (combat, update, options, userId) => {
            CombatTrack._onPreUpdateCombat(combat, update, options, userId);
        });
    }

    /**
     * Update Combat Hook
     */
    static _hookOnUpdateCombat() {
        Hooks.on("updateCombat", (combat, update, options, userId) => {
            HypeTrack._onUpdateCombat(combat, update, options, userId);
            CombatTrack._onUpdateCombat(combat, update, options, userId);
        });
    }

    /**
     * Delete Combat Hook
     */
    static _hookOnDeleteCombat() {
        Hooks.on("deleteCombat", (combat, options, userId) => {
            HypeTrack._onDeleteCombat(combat, options, userId);
            CombatTrack._onDeleteCombat(combat, options, userId);
        });
    }
    
    /**
     * Render Actor SheetsHook
     */
    static _hookOnRenderActorSheet() {
        Hooks.on("renderActorSheet", (app, html, data) => {
            HypeTrack._onRenderActorSheet(app, html, data);
        });
       
    }

    /**
     * RenderChatMessage Hook
     */
    static _hookOnRenderChatMessage() {
        Hooks.on("renderChatMessage", (message, html, data) => {
            ItemTrack._onRenderChatMessage(message, html, data);
            Misc._onRenderChatMessage(message, html, data);
        })
    }

    /**
     * RenderPlaylistDirectory Hook
     */
    static _hookOnRenderPlaylistDirectory() {
        Hooks.on("renderPlaylistDirectory", (app, html, data) => {
            Misc._onRenderPlaylistDirectory(app, html, data);
        });
    }

    /**
     * Render CombatTrackerConfig Hook
     */
    static _hookOnRenderCombatTrackerConfig() {
        Hooks.on("renderCombatTrackerConfig", (app, html, data) => {
            CombatTrack._onRenderCombatTrackerConfig(app, html, data);
        });
    }

    /**
     * Render Item Sheet Hook
     */
    static _hookOnRenderItemSheet() {
        Hooks.on("renderItemSheet", (app, html, data) => {
            ItemTrack._onRenderItemSheet(app, html, data);
        });
        
    }
}

/**
 * Tap, tap, tap, ahem
 * Shall we begin?
 * 
 * Initiates the module
 */
Conductor.begin();
