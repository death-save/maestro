import * as MAESTRO from "./config.js";

/**
 * Attach a track or playlist to combat encounters that plays when the combat begins
 */
export default class CombatTrack {
    constructor() {
        this.playlist = null;
    }

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    async _checkForCombatTracksPlaylist() {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable);
        const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.createPlaylist);

        if(!game.user.isGM || !enabled || !createPlaylist) {
            return;
        }

        const combatPlaylist = game.playlists.entities.find(p => p.name == MAESTRO.DEFAULT_CONFIG.CombatTrack.playlistName);
        if(!combatPlaylist) {
            this.playlist = await this._createCombatTracksPlaylist(true);
        } else {
            this.playlist = combatPlaylist;
        }
    }

    /**
     * Create the Hype Tracks playlist if the create param is true
     * @param {Boolean} create - whether or not to create the playlist
     */
    async _createCombatTracksPlaylist(create) {
        if (!create) {
            return;
        }
        return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.CombatTrack.playlistName});
    }

    /**
     * Checks for the existence of a Combat Track and initiates playback
     * @param combat
     * @param update
     */
    async _checkCombatTrack(combat, update) {
        if (!game.user.isGM) {
            return;
        }

        if (update.round !== 1 && update.turn !== 0) {
            return;
        }

        const flags = await CombatTrack.getCombatFlags(combat);

        if (!flags) {
            return;
        }

        const track = flags.track || "";
        const playlist = flags.playlist || "";

        // Depending on the track flag determine how and what to play
        switch (track) {
            case MAESTRO.DEFAULT_CONFIG.CombatTrack.playbackModes.all:
                return await this._playPlaylist(playlist);
                
            
            case MAESTRO.DEFAULT_CONFIG.CombatTrack.playbackModes.random:
                return await this._playTrack(track, playlist);
        
            default:
                if (!track) {
                    break;
                }

                return await this._playTrack(track, playlist);     
        }
    }
    
    /**
     * Stops any playing combat tracks
     * @param {*} combat 
     */
    _stopCombatTrack(combat) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.CombatTrack.enable);
        if (!game.user.isGM || !enabled) {
            return;
        }

        const flags = CombatTrack.getCombatFlags(combat);

        if (!flags) {
            return;
        }

        const playlist = flags.playlist;

        if (!playlist) {
            return;
        }

        game.playlists.get(playlist).stopAll();


    }

    /**
     * Gets the combat Track flags on an combat
     * @param {Object} combat - the combat to get flags from
     * @returns {Promise} flags - an object containing the flags
     */
    static getCombatFlags(combat) {
        return combat.data.flags[MAESTRO.MODULE_NAME];
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

        const existingButton = html.find(`.${MAESTRO.DEFAULT_CONFIG.CombatTrack.name}`);
        if (existingButton.length > 0 || !game.combat) {
            return existingButton.remove();
        }

        /**
         * Combat Track Button html literal
         * @todo replace with a template instead
         */
        const combatTrackButton = $(
            `<a class="${MAESTRO.DEFAULT_CONFIG.CombatTrack.name}" title="${MAESTRO.DEFAULT_CONFIG.CombatTrack.aTitle}">
                <i class="${MAESTRO.DEFAULT_CONFIG.CombatTrack.buttonIcon}"></i>
                <span> ${MAESTRO.DEFAULT_CONFIG.CombatTrack.buttonText}</span>
            </a>`
        );

        /**
         * Finds the header and the close button
         */
        const combatHeader = html.find("#combat-round");
        const settingsButton = combatHeader.find(".combat-settings");
    
        /**
         * Create an instance of the hypeButton before the close button
         */
        settingsButton.before(combatTrackButton);
    
        /**
         * Register a click listener that opens the Hype Track form
         */
        combatTrackButton.click(async ev => {

            const combat = game.combat;
            
            const flags = await CombatTrack.getCombatFlags(combat);
            const track = flags ? flags.track : "";
            const playlist = flags ? flags.playlist : "";
            CombatTrack._openTrackForm(combat, track, playlist, {closeOnSubmit: true});
        });
    }
    
    /**
     * Builds data object and opens the Combat Track form
     * @param {Object} combat - the reference combat
     * @param {String} track - any existing track
     * @param {Object} options - form options
     */
    static _openTrackForm(combat, track, playlist, options){
        const data = {
            "currentTrack": track,
            "currentPlaylist": playlist,
            "playlists": game.playlists.entities
        }
        new CombatTrackForm(combat, data, options).render(true);
    }

    /**
     * For a given trackId get the corresponding playlist sound
     * @param {String} trackId 
     */
    _getPlaylistSound(trackId) {
        if (!this.playlist) {
            return;
        }
        return this.playlist.sounds.find(s => s.id == trackId);
    }

    /**
     * Play a playlist using its default playback method
     * @param {String} playlistId
     */
    async _playPlaylist(playlistId) {
        if (!playlistId) {
            return;
        }

        const playlist = await game.playlists.get(playlistId);

        if (!playlist) {
            return;
        }

        playlist.playAll();
    }

    /**
     * Play a playlist sound based on the given trackId
     * @param {String} playlistId - the playlist id
     * @param {String} trackId - the track Id or playback mode
     */
    async _playTrack(trackId, playlistId) {
        if (!playlistId) {
            return;
        }

        const playlist = await game.playlists.get(playlistId);

        if (!playlist) {
            return;
        }

        if (trackId === MAESTRO.DEFAULT_CONFIG.CombatTrack.playbackModes.random) {
            trackId = playlist._getPlaybackOrder()[0];
        }

        if(!trackId) {
            return;
        }

        await playlist.updateEmbeddedEntity("PlaylistSound", {_id: trackId, playing: true});
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
            width: 500
        });
    }

    /**
     * Get a specific playlist's tracks
     */
    async getPlaylistSounds(playlistId) {
        if (!playlistId) {
            return;
        }
        const playlist = game.playlists.get(playlistId);

        if (!playlist) {
            return;
        }

        return await game.playlists.get(playlistId).sounds;
    } 

    /**
     * Provide data to the handlebars template
     */
    async getData() {
        const data = {
            playlist: this.data.currentPlaylist,
            playlists: this.data.playlists,
            playlistTracks: await this.getPlaylistSounds(this.data.currentPlaylist) || [],
            track: this.data.currentTrack
        }
        return data;
    }

    /**
     * Executes on form submission.
     * Set the Hype Track flag on the specified Actor
     * @param {Object} event - the form submission event
     * @param {Object} formData - the form data
     */
    _updateObject(event, formData) {
        game.maestro.combatTrack.setCombatFlags(this.combat, formData.playlist, formData.track)  
    }

    /**
     * Activates listeners on the form html
     * @param {*} html 
     */
    activateListeners(html) {
        super.activateListeners(html);

        const playlistSelect = html.find(".playlist-select");

        if (playlistSelect.length > 0) {
            playlistSelect.on("change", event => {
                this.data.currentPlaylist = event.target.value;
                this.render();
            });
        }
    }

}