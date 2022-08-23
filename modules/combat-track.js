import * as MAESTRO from "./config.js";
import { isFirstGM } from "./misc.js";
import * as Playback from "./playback.js";

/**
 * Attach a track or playlist to combat encounters that plays when the combat begins
 */
export default class CombatTrack {
    constructor() {
        this.playlist = null;
        this.pausedSounds = [];
    }

    /* -------------------------------------------- */
    /*                 Hook Handlers                */
    /* -------------------------------------------- */

    static _onReady() {
        if (game.maestro.combatTrack) {
            if (!game.maestro.combatTrack.playlist) game.maestro.combatTrack._checkForCombatTracksPlaylist();
        }
    }

    static async _onPreUpdateCombat(combat, update, options, userId) {
        if (game.maestro.combatTrack) {
            CombatTrack._checkCombatStart(combat, update, options);
        }
    }

    static async _onUpdateCombat(combat, update, options, userId) {
        if (game.maestro.combatTrack) {
            game.maestro.combatTrack._getCombatTrack(combat, update, options, userId);
        }
    }

    static async _onDeleteCombat(combat, options, userId) {
        if (game.maestro.combatTrack) {
            game.maestro.combatTrack._stopCombatTrack(combat);
        }
    }

    static async _onRenderCombatTrackerConfig(app, html, data) {
        CombatTrack._addCombatTrackButton(app, html, data);
    }

    /* -------------------------------------------- */
    /*               Handlers/Workers               */
    /* -------------------------------------------- */

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    async _checkForCombatTracksPlaylist() {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable);
        const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.createPlaylist);

        if(!isFirstGM() || !enabled || !createPlaylist) return;

        const combatPlaylist = game.playlists.getName(MAESTRO.DEFAULT_CONFIG.CombatTrack.playlistName);

        this.playlist = combatPlaylist ?? await this._createCombatTracksPlaylist();
    }

    /**
     * Create the Hype Tracks playlist if the create param is true
     */
    async _createCombatTracksPlaylist() {
        return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.CombatTrack.playlistName});
    }
    
    /**
     * Checks the updating Combat instance to determine if it just starting (round 0 => round 1)
     * @param {*} combat 
     * @param {*} update 
     * @param {*} options 
     */
    static _checkCombatStart(combat, update, options) {
        const combatStart = combat.round === 0 && update.round === 1;

        if (!isFirstGM() || !combatStart) return;

        setProperty(options, `${MAESTRO.MODULE_NAME}.${MAESTRO.FLAGS.CombatTrack.combatStarted}`, true);
    }

    /**
     * Checks for the existence of a Combat Track and initiates playback
     * @param combat
     * @param update
     */
    async _getCombatTrack(combat, update, options) {
        const combatStarted = getProperty(options, `${MAESTRO.MODULE_NAME}.${MAESTRO.FLAGS.CombatTrack.combatStarted}`);

        if (!isFirstGM() || !combatStarted) {
            return;
        }

        const flags = CombatTrack.getCombatFlags(combat);
        const defaultPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist);
        const defaultTrack = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultTrack);

        if (!flags && !defaultPlaylist) {
            return;
        }

        const playlist = flags ? flags.playlist : defaultPlaylist ? defaultPlaylist : "";
        const track = flags ? flags.track : defaultTrack ? defaultTrack : "";

        if (!playlist || !track) {
            return;
        }

        const pauseOtherSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.pauseOthers);
        
        if (pauseOtherSetting) {
            this.pausedSounds = await Playback.pauseAll();
        }

        // Depending on the track flag determine how and what to play
        switch (track) {
            case MAESTRO.DEFAULT_CONFIG.CombatTrack.playbackModes.all:
                return await Playback.playPlaylist(playlist);
                
            
            case MAESTRO.DEFAULT_CONFIG.CombatTrack.playbackModes.random:
                return await Playback.playTrack(track, playlist);
        
            default:
                return await Playback.playTrack(track, playlist);     
        }
    }
    
    /**
     * Stops any playing combat tracks
     * @param {*} combat 
     */
    async _stopCombatTrack(combat) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable);
        if (!isFirstGM() || !enabled) {
            return;
        }

        const flags = CombatTrack.getCombatFlags(combat);
        const defaultPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist);

        if (!flags && !defaultPlaylist) {
            return;
        }

        const playlistId = flags ? flags.playlist : defaultPlaylist ? defaultPlaylist : "";

        if (!playlistId) {
            return;
        }

        const playlist = game.playlists.get(playlistId);

        // Stop combat playlist if it is playing
        if (playlist.playing) {
            await playlist.stopAll();
            ui.playlists.render();
        }

        // Stop any individual playing or paused sounds in the playlist
        const soundsToStop = playlist.sounds.contents.filter(s => s.playing || s.pausedTime);
        const updates = soundsToStop.map(s => {
            return {
                _id: s.id,
                playing: false,
                pausedTime: null
            }
        });

        await playlist.updateEmbeddedDocuments("PlaylistSound", updates);
        ui.playlists.render();

        this._resumeOtherSounds();
    }

    /**
     * Resume any paused Sounds
     */
    _resumeOtherSounds() {
        const pauseOtherSoundSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.pauseOthers);
        const pausedSounds = this.pausedSounds;

        if (pauseOtherSoundSetting && pausedSounds) {
            Playback.resumeSounds(pausedSounds);
        }

        this.pausedSounds = [];
    }

    /**
     * Adds a button to the Combat sheet to open the Combat Track form
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} data 
     */
    static async _addCombatTrackButton(app, html, data) {
        if (!game.user.isGM) {
            return;
        }

        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable);
        if (!enabled) {
            return;
        }

        /**
         * Combat Track Button html literal
         * @todo replace with a template instead
         */
        const combatTrackConfigButton = $(
            `<a class="${MAESTRO.DEFAULT_CONFIG.CombatTrack.name}" title="${MAESTRO.MODULE_LABEL} ${MAESTRO.DEFAULT_CONFIG.CombatTrack.aTitle}">
                <i class="${MAESTRO.DEFAULT_CONFIG.CombatTrack.buttonIcon}"></i>
                <span> ${MAESTRO.DEFAULT_CONFIG.CombatTrack.buttonText}</span>
            </a>`
        );

        const header = html.find(".window-header");
        const closeButton = header.find("a.close");
        closeButton.before(combatTrackConfigButton);

        combatTrackConfigButton.on("click", async (event) => CombatTrack._onCombatTrackButtonClick(event));
        await app.setPosition({height: "auto"});
    }

    /**
     * Click handler for Combat Track button
     * @param {*} event 
     */
    static async _onCombatTrackButtonClick(event) {
        const combat = game.combat || null;
        const flags = combat ? await CombatTrack.getCombatFlags(combat) : null;
        const track = flags ? flags.track : "";
        const playlist = flags ? flags.playlist : "";

        CombatTrack._openTrackForm(combat, track, playlist, {closeOnSubmit: true});
    }
    
    /**
     * Builds data object and opens the Combat Track form
     * @param {Object} combat - the reference combat
     * @param {String} track - any existing track
     * @param {Object} options - form options
     */
    static _openTrackForm(combat, track, playlist, options){
        const data = {
            defaultPlaylist: game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist),
            defaultTrack: game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultTrack),
            currentTrack: track,
            currentPlaylist: playlist,
            playlists: game.playlists.contents
        }

        new CombatTrackForm(combat, data, options).render(true);
    }

    /* -------------------------------------------- */
    /*                    Helpers                   */
    /* -------------------------------------------- */

    /**
     * Gets the combat Track flags on an combat
     * @param {Object} combat - the combat to get flags from
     * @returns {Object} flags - an object containing the flags
     */
    static getCombatFlags(combat) {
        return combat.flags[MAESTRO.MODULE_NAME];
    }

    /**
     * Sets the Combat Track flags on an Combat instance
     * Handled as an update so all flags can be set at once
     * @param {Object} combat - the combat to set flags on
     * @param {String} playlistId - the playlist id to set
     * @param {String} trackId - the trackId or playback mode to set
     */
    async setCombatFlags(combat, playlistId, trackId) {
        return await combat.update({
            [`flags.${MAESTRO.MODULE_NAME}.${MAESTRO.DEFAULT_CONFIG.CombatTrack.flagNames.playlist}`]: playlistId,
            [`flags.${MAESTRO.MODULE_NAME}.${MAESTRO.DEFAULT_CONFIG.CombatTrack.flagNames.track}`]: trackId
        });
    }
    
    /**
     * 
     * @param {*} defaults 
     */
    async _setDefaultCombatTrack(defaults) {
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist, defaults.playlist);
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultTrack, defaults.track);
    }
}

/**
 * A FormApplication for managing the combat's track
 */
class CombatTrackForm extends FormApplication {
    constructor(combat, data, options){
        super(data, options);
        this.combat = combat;
        this.data = data;
    }
    
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "combat-track-form",
            title: MAESTRO.DEFAULT_CONFIG.CombatTrack.aTitle,
            template: MAESTRO.DEFAULT_CONFIG.CombatTrack.templatePath,
            classes: ["sheet"],
            width: 500,
            tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: `${game.combat ? "encounter" : "defaults"}`}]
        });
    }

    /**
     * Provide data to the handlebars template
     */
    async getData() {
        const data = {
            combat: this.combat,
            defaultPlaylist: this.data.defaultPlaylist,
            defaultTrack: this.data.defaultTrack,
            defaultPlaylistTracks: Playback.getPlaylistSounds(this.data.defaultPlaylist) || [],
            playlist: this.data.currentPlaylist || "default",
            playlists: this.data.playlists,
            playlistTracks: Playback.getPlaylistSounds(this.data.currentPlaylist) || [],
            track: this.data.currentTrack || "default"
        }
        return data;
    }

    /**
     * Executes on form submission.
     * Set the Hype Track flag on the specified Actor
     * @param {Object} event - the form submission event
     * @param {Object} formData - the form data
     */
    async _updateObject(event, formData) {
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultPlaylist, formData["default-playlist"]);
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.defaultTrack, formData["default-track"]);
        
        if (this.combat) {
            if (formData.playlist === "default" && formData.track === "default") {
                return;
            }

            const playlist = formData.playlist === "default" ? this.data.defaultPlaylist : formData.playlist;

            await game.maestro.combatTrack.setCombatFlags(this.combat, playlist, formData.track);
        }        
    }



    /**
     * Activates listeners on the form html
     * @param {*} html 
     */
    activateListeners(html) {
        super.activateListeners(html);        

        const defaultPlaylistSelect = html.find(".default-playlist-select");
        const playlistSelect = html.find(".playlist-select");

        if (defaultPlaylistSelect.length > 0) {
            defaultPlaylistSelect.on("change", event => {
                this.data.defaultPlaylist = event.target.value;
                this.render();
            });
        }

        if (playlistSelect.length > 0) {
            playlistSelect.on("change", event => {
                this.data.currentPlaylist = event.target.value;
                this.render();
            });
        }
        
    }

}