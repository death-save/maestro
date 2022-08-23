import * as MAESTRO from "./config.js";
import { isFirstGM } from "./misc.js";
import * as Playback from "./playback.js";

/**
 * Attach a track to an item that plays when the item is rolled
 */
export default class ItemTrack {
    constructor() {
        this.playlist = null;
    }

    /* -------------------------------------------- */
    /*                 Hook Handlers                */
    /* -------------------------------------------- */
    static async _onReady() {
        if (game.maestro.itemTrack) {
            game.maestro.itemTrack._checkForItemTracksPlaylist();
        }
    }

    static async _onDeleteItem(item, options, userId) {
        if (game.maestro.itemTrack) {
            game.maestro.itemTrack._deleteItemHandler(item, options, userId);
        }
    }

    static async _onRenderChatMessage(message, html, data) {
        if (game.maestro.itemTrack) {
            game.maestro.itemTrack._chatMessageHandler(message, html, data);
        }
    }

    static async _onRenderItemSheet(app, html, data) {
        if (game.maestro.itemTrack) {
            game.maestro.itemTrack._addItemTrackButton(app, html, data);
        }
    }

    /* -------------------------------------------- */
    /*               Handlers/Workers               */
    /* -------------------------------------------- */

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    async _checkForItemTracksPlaylist() {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable);
        const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.createPlaylist);

        if(!isFirstGM() || !enabled || !createPlaylist) {
            return;
        }

        const itemPlaylist = game.playlists.getName(MAESTRO.DEFAULT_CONFIG.ItemTrack.playlistName);

        this.playlist = itemPlaylist ?? await this._createItemTracksPlaylist();
    }

    /**
     * Create the Hype Tracks playlist if the create param is true
     */
    async _createItemTracksPlaylist() {
        return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.ItemTrack.playlistName});
    }

    async _deleteItemHandler(item, options, userId) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable);

        if (!enabled || !isFirstGM() || !item.isOwned) return;

        // check if item has an item track
        const flags = this.getItemFlags(item);

        if (!flags) return;

        const deletedItems = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.deletedItems);

        if (deletedItems[item.id]) return;      

        deletedItems[item.id] = flags;
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.deletedItems, deletedItems);
    }

    /**
     * Handles module logic for chat message card
     * @param {Object} message - the chat message object
     * @param {Object} html - the jquery object
     * @param {Object} data - the data in the message update
     */
    async _chatMessageHandler(message, html, data) {
        const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.enable);

        if (!enabled || !isFirstGM()) return;

        const itemIdentifier = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.itemIdAttribute);
        const itemCard = html.find(`[${itemIdentifier}]`);
        const trackPlayed = message.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.played);
        
        if(!itemCard || itemCard.length === 0 || trackPlayed) {
            return;
        }
        
        const itemId = itemCard.attr(itemIdentifier);

        if (!itemId) return;
        
        const tokenId = message.speaker?.token;
        const sceneId = message.speaker?.scene;
        const actorId = message.speaker?.actor;

        const token = await fromUuid(`Scene.${sceneId}.Token.${tokenId}`);
        const actor = token?.actor ?? game.actors.get(actorId);
        let item = actor?.items?.get(itemId) ?? game.items?.get(itemId);
        let flags;

        if (item) {
            flags = this.getItemFlags(item);    
        } else {
            const deletedItems = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.ItemTrack.deletedItems);
            flags = deletedItems instanceof Object ? deletedItems[itemId] : null;    
        } 

        if (!flags) return;

        const track = flags.track || "";
        const playlist = flags.playlist || "";

        // Depending on the track flag determine how and what to play
        switch (track) {
            case MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.all:
                await Playback.playPlaylist(playlist);
                break;
            
            case MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.random:
                await Playback.playTrack(track, playlist);
                break;
        
            default:
                if (!track) return;

                await Playback.playTrack(track, playlist);
                     
        }

        return await this._setChatMessageFlag(message);
    }
    
    /**
     * Adds a button to the Item sheet to open the Item Track form
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} data 
     */
     async _addItemTrackButton(app, html, data) {
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
        itemTrackButton.on("click", (event) => {

            let item;
            
            //Scenario 1 - owned item 
            if (app.document.isOwned) {
                const itemId = app.document.id;
                const actor = app.document.actor;

                if (actor.isToken) {
                    item = canvas.tokens?.get(actor.token.id)?.actor.items?.get(itemId);
                } else {
                    item = game.actors.get(actor.id)?.items.get(itemId);
                }

            //Scenario 2 - world item
            } else {
                if (app.document.id) {
                    item = app.document;
                }
            }
            
            const flags = this.getItemFlags(item);
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
    _openTrackForm(item, track, playlist, options){
        const data = {
            "currentTrack": track,
            "currentPlaylist": playlist,
            "playlists": game.playlists.contents
        }
        new ItemTrackForm(item, data, options).render(true);
    }

    /* -------------------------------------------- */
    /*                    Helpers                   */
    /* -------------------------------------------- */

    /**
     * Gets the Item Track flags on an Item
     * @param {Object} item - the item to get flags from
     * @returns {Promise} flags - an object containing the flags
     */
    getItemFlags(item) {
        return item?.flags[MAESTRO.MODULE_NAME];
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
     * Sets a flag on a chat message
     * @param {Object} message - the message to set a flag on
     */
    async _setChatMessageFlag(message) {
        if (!message) return;

        return await message.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.played, true);
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
     * Provide data to the handlebars template
     */
    async getData() {
        const data = {
            playlist: this.data.currentPlaylist,
            playlists: this.data.playlists,
            playlistTracks: await Playback.getPlaylistSounds(this.data.currentPlaylist) || [],
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
        game.maestro.itemTrack.setItemFlags(this.item, formData.playlist, formData.track);
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