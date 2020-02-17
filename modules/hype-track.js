import * as MAESTRO from "./config.js";
import * as Playback from "./playback.js";

export default class HypeTrack {
    constructor() {
        this.playlist = null;
    }

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    _checkForHypeTracksPlaylist() {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.HypeTrack.enable);
        if(!game.user.isGM || !enabled) {
            return;
        } 

        const hypePlaylist = game.playlists.entities.find(p => p.name == MAESTRO.DEFAULT_CONFIG.HypeTrack.playlistName);
        if(!hypePlaylist) {
            this.playlist = this._createHypeTracksPlaylist(true);
        } else {
            this.playlist = hypePlaylist;
        }
    }

    /**
     * Create the Hype Tracks playlist if the create param is true
     * @param {Boolean} create - whether or not to create the playlist
     */
    async _createHypeTracksPlaylist(create) {
        if(create) {
            return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.HypeTrack.playlistName});
        } else {
            return;
        }
    }

    /**
     * Checks for the existence of the Hype Track actor flag, then plays the track
     * @param {Object} combat - the combat instance
     * @param {*} update - the update data
     */
    async _checkHype(combat, update) {
        if (!game.user.isGM || !Number.isNumeric(update.turn) || !combat.combatants.length) {
            return;
        }
        const actorTrack = await this._getActorHypeTrack(combat.combatant.actor);

        if (!actorTrack) {
            return this.playlist.stopAll();
        }

        await this.playlist.stopAll();
        Playback.playTrack(actorTrack, this.playlist._id);
    }
    

    /**
     * Get the Hype Track flag if it exists on an actor
     * @param {*} actor
     * 
     */
    async _getActorHypeTrack(actor) {
        let actorTrack;

        try {
            actorTrack = await actor.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track);
            return actorTrack;
        } catch (e) {
            console.log(e);
            return;
        }

    }
    
    /**
     * Sets the Hype Track
     * @param {Number} trackId - Id of the track in the playlist 
     */
    async _setActorHypeTrack(actor, trackId) {
        try {
            await actor.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track, trackId);
        } catch (e) {
            //we should do something with this in the future, eg. if the flag can't be found
            throw e
        }
    }
    
    /**
     * Adds a button to the Actor sheet to open the Hype Track form
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} data 
     */
    async _addHypeButton (app, html, data) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.HypeTrack.enable);

        if (!enabled) {
            return;
        }
        /**
         * Hype Button html literal
         * @todo replace with a template instead
         */
        const hypeButton = $(
            `<a class="${MAESTRO.DEFAULT_CONFIG.HypeTrack.name}" title="${MAESTRO.DEFAULT_CONFIG.HypeTrack.aTitle}">
                <i class="${MAESTRO.DEFAULT_CONFIG.HypeTrack.buttonIcon}"></i>
                <span> ${MAESTRO.DEFAULT_CONFIG.HypeTrack.buttonText}</span>
            </a>`
        );
        
        if (html.find(`.${MAESTRO.DEFAULT_CONFIG.HypeTrack.name}`).length > 0) {
            return;
        }

        /**
         * Finds the header and the close button
         */
        const windowHeader = html.find(".window-header");
        const windowCloseBtn = windowHeader.find(".close");
    
        /**
         * Create an instance of the hypeButton before the close button
         */
        windowCloseBtn.before(hypeButton);
    
        /**
         * Register a click listener that opens the Hype Track form
         */
        hypeButton.click(async ev => {
            const actorTrack = await this._getActorHypeTrack(app.entity);
            this._openTrackForm(app.entity, actorTrack, {closeOnSubmit: true});
        });
    }
    
    /**
     * Opens the Hype Track form
     * @param {Object} actor  the actor object
     * @param {Object} track  any existing track for this actor
     * @param {Object} options  form options
     */
    _openTrackForm(actor, track, options){
        const data = {
            "track": track,
            "playlist": this.playlist
        }
        new HypeTrackActorForm(actor, data, options).render(true);
    }
}

/**
 * A FormApplication for setting the Actor's Hype Track
 */
class HypeTrackActorForm extends FormApplication {
    constructor(actor, data, options){
        super(data, options);
        this.actor = actor;
        this.data = data;
    }
    
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hype-track-form",
            title: MAESTRO.DEFAULT_CONFIG.HypeTrack.aTitle,
            template: MAESTRO.DEFAULT_CONFIG.HypeTrack.templatePath,
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data to the handlebars template
     */
    async getData() {
        return {
            playlistTracks: this.data.playlist.sounds,
            track: this.data.track
        }
    }

    /**
     * Executes on form submission.
     * Set the Hype Track flag on the specified Actor
     * @param {Object} event - the form submission event
     * @param {Object} formData - the form data
     */
    async _updateObject(event, formData) {
        await game.maestro.hypeTrack._setActorHypeTrack(this.actor, formData.track);  
    }
}