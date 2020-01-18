import * as MAESTRO from "./config.js";

/**
 * Attach a track to an item that plays when the item is rolled
 */
export default class ItemTrack {
    constructor() {
        this.playlist = null;
    }

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    async _checkForItemTracksPlaylist() {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable);
        const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.createPlaylist);

        if(!game.user.isGM || !enabled || !createPlaylist) {
            return;
        }

        const itemPlaylist = game.playlists.entities.find(p => p.name == MAESTRO.DEFAULT_CONFIG.ItemTrack.playlistName);
        if(!itemPlaylist) {
            this.playlist = await this._createItemTracksPlaylist(true);
        } else {
            this.playlist = itemPlaylist;
        }
    }

    /**
     * Create the Hype Tracks playlist if the create param is true
     * @param {Boolean} create - whether or not to create the playlist
     */
    async _createItemTracksPlaylist(create) {
        if (!create) {
            return;
        }
        return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.ItemTrack.playlistName});
    }

    /**
     * Handles module logic for chat message card
     * @param {Object} message - the chat message object
     * @param {Object} html - the jquery object
     * @param {Object} data - the data in the message update
     */
    async chatMessageHandler(message, html, data) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable);
        if (!enabled) {
            return;
        }

        const itemCard = html.find("[data-item-id]");
        const trackPlayed = message.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.played);
        
        if(!itemCard || itemCard.length === 0 || trackPlayed) {
            return;
        }
        
        let item;
        const itemId = itemCard.attr("data-item-id");
        const actorId = itemCard.attr("data-actor-id");
        const sceneTokenId = itemCard.attr("data-token-id");

        if (sceneTokenId) {
            const tokenId = sceneTokenId.split(".")[1];
            const token = canvas.tokens.get(tokenId);
            item = token.actor.getOwnedItem(itemId);
        } else if (!sceneTokenId && actorId) {
            item = await game.actors.get(actorId).getOwnedItem(itemId);
        } else {
            item = await game.items.get(itemId);
        }

        const flags = await this.getItemFlags(item)
        const track = flags.track || "";
        const playlist = flags.playlist || "";

        switch (track) {
            case MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.all:
                await this._playPlaylist(playlist);
                return this._setChatMessageFlag(message);
            
            case MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.random:
                await this._playTrack(track, playlist)
                return this._setChatMessageFlag(message);
        
            default:
                if (!track) {
                    break;
                }

                await this._playTrack(track, playlist);
                return this._setChatMessageFlag(message);      
        }
    }    

    /**
     * Gets the Item Track flags on an Item
     * @param {Object} item - the item to get flags from
     * @returns {Promise} flags - an object containing the flags
     */
    async getItemFlags(item) {
        return await item.data.flags[MAESTRO.MODULE_NAME];
    }

    /**
     * Sets the Item Track flags on an Item instance
     * Handled as an update so all flags can be set at once
     * @param {Object} item - the item to set flags on
     * @param {String} playlistId - the playlist id to set
     * @param {String} trackId - the trackId or playback mode to set
     */
    async setItemFlags(item, playlistId, trackId) {
        return await item.update({
            [`flags.${MAESTRO.MODULE_NAME}.${MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist}`]: playlistId,
            [`flags.${MAESTRO.MODULE_NAME}.${MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track}`]: trackId
        });
    }
     
    /**
     * Adds a button to the Item sheet to open the Item Track form
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} data 
     */
    async _addItemTrackButton (app, html, data) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable);
        if (!enabled) {
            return;
        }

        /**
         * Item Track Button html literal
         * @todo replace with a template instead
         */
        const itemTrackButton = $(
            `<a class="${MAESTRO.DEFAULT_CONFIG.ItemTrack.name}" title="${MAESTRO.DEFAULT_CONFIG.ItemTrack.aTitle}">
                <i class="${MAESTRO.DEFAULT_CONFIG.ItemTrack.buttonIcon}"></i>
                <span> ${MAESTRO.DEFAULT_CONFIG.ItemTrack.buttonText}</span>
            </a>`
        );
        
        if (html.find(`.${MAESTRO.DEFAULT_CONFIG.ItemTrack.name}`).length > 0 || !app.isEditable) {
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
        windowCloseBtn.before(itemTrackButton);
    
        /**
         * Register a click listener that opens the Hype Track form
         */
        itemTrackButton.click(async ev => {

            let item;
            
            //Scenario 1 - owned item 
            if (app.entity.isOwned) {
                const itemId = app.entity.data._id;
                const actor = app.entity.actor;

                if (actor.isToken) {
                    item = canvas.tokens.get(actor.token.id).actor.getOwnedItem(itemId);
                } else {
                    item = game.actors.get(actor.id).getOwnedItem(itemId);
                }

            //Scenario 2 - world item
            } else {
                if (app.entity.id) {
                    item = app.entity;
                }
            }
            
            const flags = await this.getItemFlags(item);
            const track = flags ? flags.track : "";
            const playlist = flags ? flags.playlist : "";
            this._openTrackForm(item, track, playlist, {closeOnSubmit: true});
        });
    }
    
    /**
     * Builds data object and opens the Item Track form
     * @param {Object} item - the reference item
     * @param {String} track - any existing track
     * @param {Object} options - form options
     */
    async _openTrackForm(item, track, playlist, options){
        const data = {
            "currentTrack": track,
            "currentPlaylist": playlist,
            "playlists": await game.playlists.entities
        }
        new ItemTrackForm(item, data, options).render(true);
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

        if (trackId === MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.random) {
            trackId = playlist._getPlaybackOrder()[0];
        }

        if(!trackId) {
            return;
        }

        await playlist.updateEmbeddedEntity("PlaylistSound", {_id: trackId, playing: true});
    }

    /**
     * Sets a flag on a chat message
     * @param {Object} message - the message to set a flag on
     */
    _setChatMessageFlag(message) {
        if (!message) {
            return;
        }

        message.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.played, true);
    }
    
}

/**
 * A FormApplication for managing the item's track
 */
class ItemTrackForm extends FormApplication {
    constructor(item, data, options){
        super(data, options);
        this.item = item;
        this.data = data;
    }
    
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "item-track-form",
            title: MAESTRO.DEFAULT_CONFIG.ItemTrack.aTitle,
            template: MAESTRO.DEFAULT_CONFIG.ItemTrack.templatePath,
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
        game.maestro.itemTrack.setItemFlags(this.item, formData.playlist, formData.track)  
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