// @ts-check
import * as MAESTRO from "./modules/config.js";
import { registerModuleSettings } from "./modules/settings.js";
import { migrationHandler } from "./modules/migration.js";
import HypeTrack from "./modules/hype-track.js";
import ItemTrack from "./modules/item-track.js";
import { _onPreUpdatePlaylistSound, _addPlaylistLoopToggle } from "./modules/playlist-loop.js";

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
        Hooks.on("init", () =>{
            game.maestro = {};
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

            if (game.maestro.hypeTrack) {
                game.maestro.hypeTrack._checkForHypeTracksPlaylist();
            }

            if (game.maestro.itemTrack) {
                game.maestro.itemTrack._checkForItemTracksPlaylist();
            }

            //Set a timeout to allow the sheets to register correctly before we try to hook on them
            window.setTimeout(Conductor._readyHookRegistrations, 500);
            //Conductor._readyHookRegistrations();

            if (game.data.version >= "0.4.4" && game.user.isGM) {
                game.maestro.migration = {};
                migrationHandler();
            }
        });
    }

    /**
     * Init Hook Registrations
     */
    static _initHookRegistrations() {
        registerModuleSettings();
        Conductor._hookOnRenderPlaylistDirectory();
    }

    /**
     * Ready Hook Registrations
     */
    static _readyHookRegistrations() {
        //Sheet/App Render Hooks
        Conductor._hookOnRenderActorSheet();
        Conductor._hookOnRenderItemSheet();

        Conductor._hookOnRenderChatMessage();

        

        //Pre-update Hooks
        Conductor._hookOnPreUpdatePlaylistSound();
        Conductor._hookOnPreUpdatePlaylist();

        //Update Hooks
        Conductor._hookOnUpdateCombat();
        //Conductor._hookOnUpdatePlaylist();
        
        
    }

    static _hookOnPreUpdatePlaylist() {
        Hooks.on("preUpdatePlaylist", (playlist, update) => {
        });
    }

    /**
     * PreUpdate Playlist Sound Hook
     */
    static _hookOnPreUpdatePlaylistSound() {
        Hooks.on("preUpdatePlaylistSound", (playlist, playlistId, update) => {
            _onPreUpdatePlaylistSound(playlist, update);
        });
    }

    /**
     * Update Combat Hook
     */
    static _hookOnUpdateCombat() {
        Hooks.on("updateCombat", (combat, update) => {
            game.maestro.hypeTrack._checkHype(combat, update);
        });
    }
    
    /**
     * Render Actor SheetsHook
     */
    static _hookOnRenderActorSheet() {
        if(!game.user.isGM) {
            return;
        }

        Hooks.on("renderActorSheet", (app, html, data) => {
            game.maestro.hypeTrack._addHypeButton(app, html, data);
        });
       
    }

    /**
     * RenderChatMessage Hook
     */
    static _hookOnRenderChatMessage() {
        Hooks.on("renderChatMessage", (message, html, data) => {
            game.maestro.itemTrack.chatMessageHandler(message, html, data);
        })
    }

    /**
     * RenderPlaylistDirectory Hook
     */
    static _hookOnRenderPlaylistDirectory() {
        Hooks.on("renderPlaylistDirectory", (app, html, data) => {
            _addPlaylistLoopToggle(app, html, data);
        });
    }

    /**
     * Render Item Sheet Hook
     */
    static _hookOnRenderItemSheet() {
        if(!game.user.isGM) {
            return;
        }

        Hooks.on("renderItemSheet", (app, html, data) => {
            game.maestro.itemTrack._addItemTrackButton(app, html, data);
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
