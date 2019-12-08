// @ts-check

/**
 * Create a global const to namespace classes
 * @todo find a better way to differentiate from the other maestro const
 */
const Maestro = this.Maestro || {};

/**
 * Create a global const to store class instances
 * @todo find a better way to differentiate from the other maestro const
 */
const maestro = this.maestro || {};

/**
 * Holds constants
 */
Maestro.Stage = class {
    static get MODULE_NAME() {
        return "maestro";
    }

    static get MODULE_LABEL() {
        return "Maestro";
    }

    static get DEFAULT_CONFIG() {
        return {
            SceneMusic: {
                name: "scene-music",
                flagNames: {
                    playlist: "playlistId"
                },
                templatePath: "./modules/maestro/templates/playlist-select.html"
            },
            HypeTrack: {
                name: "hype-track",
                playlistName: "Hype Tracks",
                buttonIcon: "fas fa-music",
                buttonText: " Hype",
                aTitle: "Change Actor Hype Track",
                flagNames: {
                    track: "track"
                },
                templatePath: "./modules/maestro/templates/hype-track-form.html"
            },
            ItemTrack: {
                name: "item-track",
                playlistName: "Item Tracks",
                buttonIcon: "fas fa-music",
                buttonText: " Item Track",
                aTitle: "Change Item Track",
                flagNames: {
                    track: "track",
                    played: "item-track-played"
                },
                templatePath: "./modules/maestro/templates/item-track-form.html"
            }
        }
    }

    static get SETTINGS_DESCRIPTORS() {
        return {
            SceneMusic: {
                EnableN: "Enable Scene Playlist",
                EnableH: "Enable the ability to link a playlist to a Scene",
                StopOnSceneChangeN: "Stop on Scene Change",
                StopOnSceneChangeH: "Stop currently playing Scene Playlist on Scene Change"
            },
            HypeTrack: {
                EnableN: "Enable Hype Track",
                EnableH: "Enable the ability to set a Track for an Actor",
                PlayOnTurnN: "Play on Turn",
                PlayOnTurnH: "Play Hype Track on Actor's turn in Combat",
                //future features
                PlayOnCritN: "Play on Critical Roll",
                PlayOnCritH: "Play Hype Track when Actor rolls a critical",
                PlayOnKillN: "Play on Kill",
                PlayOnKillH: "Play when Actor kills an enemy"
            },
            ItemTrack: {
                EnableN: "Enable Item Track",
                EnableH: "Assign a track to be played when item is rolled"
            }
        }
    }
}

/**
 * Orchestrates (get it?) module functionality
 */
Maestro.Conductor = class {
    static begin() {
        Maestro.Conductor._hookOnReady();
    }

    /**
     * Ready Hook
     */
    static async _hookOnReady() {
        Hooks.on("ready", async () => {
            maestro.sceneMusic = new Maestro.SceneMusic();
            maestro.hypeTrack = new Maestro.HypeTrack();
            maestro.itemTrack = new Maestro.ItemTrack();

            if (maestro.hypeTrack) {
                maestro.hypeTrack._checkForHypeTracksPlaylist();
            }

            if (maestro.itemTrack) {
                maestro.itemTrack._checkForItemTracksPlaylist();
            }
            
            Maestro.Conductor._readyHookRegistrations();
        });
    }

    /**
     * Ready Hook Registrations
     */
    static _readyHookRegistrations() {
        Maestro.Conductor._hookOnRenderActorSheets();
        Maestro.Conductor._hookOnRenderSceneSheet();
        Maestro.Conductor._hookOnPreUpdateScene();
        Maestro.Conductor._hookOnUpdateCombat();
        Maestro.Conductor._hookOnRenderChatMessage();
        Maestro.Conductor._hookOnRenderItemSheets();
    }

    /**
     * Update Combat Hook
     */
    static _hookOnUpdateCombat() {
        Hooks.on("updateCombat", (combat, update) => {
            maestro.hypeTrack._checkHype(combat, update);
        });
    }
    
    /**
     * Render Actor Sheets Hook
     * Walks the registered Sheet classes for Actor and registers a Hook on render of each
     */
    static _hookOnRenderActorSheets() {
        if(!game.user.isGM) {
            return;
        }

        const sheetClasses = Object.values(CONFIG.Actor.sheetClasses);

        for (let sheetClass of sheetClasses) {
            if (sheetClass instanceof Object) {
                const sheetSubClasses = Object.values(sheetClass);

                for (let sheetSubClass of sheetSubClasses) {
                    const sheetSubClassName = sheetSubClass.id.split(".")[1];

                    Hooks.on(`render${sheetSubClassName}`, (app, html, data) => {
                        maestro.hypeTrack._addHypeButton(app, html, data);
                    });
                }
            }           
        }
    }

    /**
     * Render Scene Sheet Hook
     */
    static async _hookOnRenderSceneSheet() {
        Hooks.on("renderSceneSheet", async (app, html, data) => {
            await maestro.sceneMusic._injectPlaylistSelector(app, html, data);
        });
    }

    /**
     * Pre-Update Scene Hook
     * @todo remove 0.3.9 check after 0.4.0 release
     */
    static _hookOnPreUpdateScene() {
        Hooks.on("preUpdateScene", (scene, updateData, options) => {
            maestro.sceneMusic._checkForScenePlaylist(scene, updateData);
        });        
    }

    /**
     * RenderChatMessage Hook
     */
    static _hookOnRenderChatMessage() {
        Hooks.on("renderChatMessage", (message, html, data) => {
            maestro.itemTrack._checkItemTrack(message, html, data);
        })
    }

    /**
     * Render Item Sheets Hook
     * Walks the registered Sheet classes for Item and registers a Hook on render of each
     */
    static _hookOnRenderItemSheets() {
        if(!game.user.isGM) {
            return;
        }

        const sheetClasses = Object.values(CONFIG.Item.sheetClasses);

        for (let sheetClass of sheetClasses) {
            if (sheetClass instanceof Object) {
                const sheetSubClasses = Object.values(sheetClass);

                for (let sheetSubClass of sheetSubClasses) {
                    const sheetSubClassName = sheetSubClass.id.split(".")[1];

                    Hooks.on(`render${sheetSubClassName}`, (app, html, data) => {
                        maestro.itemTrack._addItemTrackButton(app, html, data);
                    });
                }
            }           
        }
    }
}

/**
 * A static helper class
 */
Maestro.StageHand = class {

    /**
     * Builds a setting metadata object from provided params
     * @param {String} name -- the name of the setting
     * @param {String} hint -- additional description of the setting
     * @param {*} type -- the type of the setting
     * @param {String} scope -- client/world
     * @param {*} defaultValue -- what the setting should default to
     * @param {Boolean} config -- should the setting be shown in Foundry Module Settings tab
     * @param {Function} onChange -- a function to execute when the setting changes
     */
    static buildSetting(name, hint, type, scope, defaultValue, config, onChange) {
        return {
            "name": name,
            "hint": hint,
            "type": type,
            "scope": scope,
            "defaultValue": defaultValue,
            "config": config,
            "onChange": onChange
        }
    }

    /**
     * Registers game settings for the specified  /  function
     * @param {String} key -- the key to refer to the setting 
     * @param {Object} setting -- a setting object
     */
    static registerSetting(key, setting) {
        game.settings.register(Maestro.Stage.MODULE_NAME, key, setting);
    }

    /**
     * Retrieves a game setting for the specified  /  function
     * @param {String} key -- the key to lookup 
     */
    static getSetting(key) {
        return game.settings.get(Maestro.Stage.MODULE_NAME, key);
    }

    /**
     * Retrieves a game setting for the specified  if it exists 
     * or registers the setting if it does not 
     * @param {String} key 
     * @param {Object} setting 
     */
    static initSetting(key, setting) {
        //console.log("inc  name:",);
        //console.log("inc  metadata:",settings);
        let config;

        try {
            config = this.getSetting(key);
            //console.log("config found:", config);
        } catch (e) {
            if (e.message == "This is not a registered game setting") {
                this.registerSetting(key, setting);
                config = this.getSetting(key);
            } else {
                throw e;
            }
        } finally {
            return config;
        }
    }

    /**
     * Change a setting for a 
     * if the setting is an object, then dot notation must be used for properties
     * Examples:
     * setSetting("hide-npc-names", true);
     * setSetting("enhanced-conditions(Condition Map).dnd5e",["Blinded","path-to-icon/icon.svg"])
     * @param {String} key -- the setting key
     * @param {*} value -- the new value
     */
    static async setSetting(key, value) {
        let oldSettingValue;
        let keyParts = [];
        let settingKey;
        let settingSubkeys;
        let joinedSubkeys;

        if (key.includes(".")) {
            keyParts = key.split(".");
            settingKey = keyParts[0];
            settingSubkeys = keyParts.slice(1, keyParts.length);
            joinedSubkeys = settingSubkeys.join(".");
            oldSettingValue = this.getSetting(settingKey);
        } else {
            oldSettingValue = this.getSetting(key);
        }
        Object.freeze(oldSettingValue);

        let newSettingValue;

        if (typeof oldSettingValue === "object" && (key.includes("."))) {


            //call the duplicate helper function from foundry.js
            let tempSettingObject = duplicate(oldSettingValue);

            let updated = setProperty(tempSettingObject, joinedSubkeys, value);

            if (updated) {
                //console.log(CUBButler.MODULE_NAME, settingKey, tempSettingObject);
                newSettingValue = await game.settings.set(Maestro.Stage.MODULE_NAME, settingKey, tempSettingObject);
            } else {
                throw ("Failed to update nested property of " + key + " check syntax");
            }

        } else if (typeof oldSettingValue === typeof value) {
            //console.log(CUBButler.MODULE_NAME, key, value);
            newSettingValue = await game.settings.set(Maestro.Stage.MODULE_NAME, key, value);
        }
        return newSettingValue;
    }
}

/**
 * Adds the ability to set a playlist for a scene which will be played on activation
 * @todo create a handler method for each hook
 */
Maestro.SceneMusic = class {
    constructor() {
        this.settings = {
            enable:  Maestro.StageHand.initSetting(Maestro.Stage.DEFAULT_CONFIG.SceneMusic.name + '_' + Maestro.Stage.SETTINGS_DESCRIPTORS.SceneMusic.EnableN, Maestro.SceneMusic.SETTINGS_META.enable),
            stopOnSceneChange:  Maestro.StageHand.initSetting(Maestro.Stage.DEFAULT_CONFIG.SceneMusic.name + '_' + Maestro.Stage.SETTINGS_DESCRIPTORS.SceneMusic.StopOnSceneChangeN, Maestro.SceneMusic.SETTINGS_META.stopOnSceneChange)
        }
        this.currentScene = game.scenes.active;
    }

    static get SETTINGS_ONCHANGE() {
        return {
            enable: s => {
                if (maestro.sceneMusic) {
                    maestro.sceneMusic.settings.enable = s
                }
            },
            stopOnSceneChange: s => {
                if (maestro.sceneMusic) {
                    maestro.sceneMusic.settings.stopOnSceneChange = s
                }
            }
        }
    }

    static get SETTINGS_META() {
        return {
            enable: Maestro.StageHand.buildSetting(Maestro.Stage.SETTINGS_DESCRIPTORS.SceneMusic.EnableN, Maestro.Stage.SETTINGS_DESCRIPTORS.SceneMusic.EnableH, Boolean, "World", false, true, Maestro.SceneMusic.SETTINGS_ONCHANGE.enable ),
            stopOnSceneChange: Maestro.StageHand.buildSetting(Maestro.Stage.SETTINGS_DESCRIPTORS.SceneMusic.StopOnSceneChangeN, Maestro.Stage.SETTINGS_DESCRIPTORS.SceneMusic.StopOnSceneChangeH, Boolean, "World", false, true, Maestro.SceneMusic.SETTINGS_ONCHANGE.stopOnSceneChange )

        }
    }

    /**
     * Retrieves additional data about a scene for later user
     * @param {Object} scene - the scene to retrieve additional data about 
     */
    _getAdditionalData(scene) {
        return {
            moduleName: Maestro.Stage.MODULE_NAME,
            flagName: Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist,
            scenePlaylistFlag: game.scenes.get(scene.id).getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist) || " ",
            playlists: game.playlists.entities || []
        }
    }

    /**
     * Injects a new formgroup into the Scene Sheet
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} sceneData 
     */
    async _injectPlaylistSelector(app, html, sceneData) {
        const data = this._getAdditionalData(app.object);
        const submitButton = html.find('button[name="submit"]');
        const playlistSelector = await renderTemplate(Maestro.Stage.DEFAULT_CONFIG.SceneMusic.templatePath, data);

        submitButton.before(playlistSelector);
    }

    /**
     * Checks for the existence of a playlist flag on the specified scene
     * Currently works within a pre-update Scene hook
     * @todo build a handler to call this instead and pass the relevant data
     * @param {Object} scene
     * @param {Object} update 
     */
    _checkForScenePlaylist(scene, update) {
        if (!getProperty(maestro, "sceneMusic.settings.enable") && update.active !== true) {
            return;
        }

        const currentScene = this.currentScene;
        const newScene = scene;
        
        const currentScenePlaylistFlag = currentScene.getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist);
        const newScenePlaylistFlag = newScene.getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist);

        if ( getProperty(maestro, "sceneMusic.settings.stopOnSceneChange")) {
            const playlist = game.playlists.get(currentScenePlaylistFlag);
            if (playlist) {
                playlist.stopAll();
            }
            
        } 
        
        if (newScenePlaylistFlag ) {
            maestro.sceneMusic._playScenePlaylist(newScenePlaylistFlag);
        }

        this.currentScene = scene;
    }

    /**
     * Begins playback of the specified playlist
     * @param {String} playlistId 
     */
    _playScenePlaylist(playlistId) {
        const playlist = game.playlists.get(playlistId);

        if (playlist && playlist.sounds.length > 0) {
            playlist.playAll();
            console.log(Maestro.Stage.MODULE_LABEL + ` | Playing Scene Playlist "` + playlist.name + `"`);
        }
    }
}

/**
 * Allows a track to be set that will be played on an Actor's turn in combat
 */
Maestro.HypeTrack = class {
    constructor() {
        this.playlist = null;

        this.settings = {
            enable: Maestro.StageHand.initSetting(Maestro.Stage.DEFAULT_CONFIG.HypeTrack.name + "_" + Maestro.Stage.SETTINGS_DESCRIPTORS.HypeTrack.EnableN, Maestro.HypeTrack.SETTINGS_META.enable)
        };
    }

    static get SETTINGS_ONCHANGE() {
        return {
            enable: s => {
                if (maestro.hypeTrack) {
                    maestro.hypeTrack.settings.enable = s
                }
            }
        }
    }

    /**
     * Gets setting metadata for each setting
     */
    static get SETTINGS_META() {
        return {
            enable: Maestro.StageHand.buildSetting(Maestro.Stage.SETTINGS_DESCRIPTORS.HypeTrack.EnableN, Maestro.Stage.SETTINGS_DESCRIPTORS.HypeTrack.EnableH, Boolean, "World", false, true, Maestro.HypeTrack.SETTINGS_ONCHANGE.enable )
        }
    }

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    _checkForHypeTracksPlaylist() {
        if(!game.user.isGM) return;

        const hypePlaylist = game.playlists.entities.find(p => p.name == Maestro.Stage.DEFAULT_CONFIG.HypeTrack.playlistName);
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
            return await Playlist.create({"name": Maestro.Stage.DEFAULT_CONFIG.HypeTrack.playlistName});
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
        if(update.turn || update.round) {
            //const actorTrack = combat.combatant.actor.getFlag(Maestro.Stage.MODULE_NAME, Maestro.DEFAULT_CONFIG.HypeTrack.flagNames.track);
            const actorTrack = await this._getActorHypeTrack(combat.combatant.actor);

            this.playlist.stopAll();
    
            if(actorTrack) {
                this._playTrack(actorTrack);
            }
        }
    }
    

    /**
     * Get the Hype Track flag if it exists on an actor
     * @param {*} actor
     * 
     */
    async _getActorHypeTrack(actor) {
        let actorTrack;

        try {
            actorTrack = await actor.getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.HypeTrack.flagNames.track);
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
            await actor.setFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.HypeTrack.flagNames.track, trackId);
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
        /**
         * Hype Button html literal
         * @todo replace with a template instead
         */
        const hypeButton = $(
            `<a class="${Maestro.Stage.DEFAULT_CONFIG.HypeTrack.name}" title="${Maestro.Stage.DEFAULT_CONFIG.HypeTrack.aTitle}">
                <i class="${Maestro.Stage.DEFAULT_CONFIG.HypeTrack.buttonIcon}"></i>
                <span> ${Maestro.Stage.DEFAULT_CONFIG.HypeTrack.buttonText}</span>
            </a>`
        );
        
        if (html.find(`.${Maestro.Stage.DEFAULT_CONFIG.HypeTrack.name}`).length > 0) {
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
        new Maestro.HypeTrackActorForm(actor, data, options).render(true);
    }

    /**
     * Returns a sound object for a given id
     * @param {String} trackId 
     */
    _getPlaylistSound(trackId) {
        return this.playlist.sounds.find(s => s.id == trackId);
    }

    /**
     * Plays a sound based on the id
     * @param {String} trackId 
     */
    _playTrack(trackId) {
        //const sound = this._getPlaylistSound(trackId);
        if(!(trackId instanceof Number)) {
            trackId = Number(trackId);
        }

        this.playlist.updateSound({id: trackId, playing: true});
    }
}

/**
 * A FormApplication for setting the Actor's Hype Track
 */
Maestro.HypeTrackActorForm = class extends FormApplication {
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
            title: Maestro.Stage.DEFAULT_CONFIG.HypeTrack.aTitle,
            template: Maestro.Stage.DEFAULT_CONFIG.HypeTrack.templatePath,
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data to the handlebars template
     */
    async getData() {
        const data = {
            playlistTracks: this.data.playlist.sounds,
            track: this.data.track
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
        await maestro.hypeTrack._setActorHypeTrack(this.actor, formData.track);  
    }

}

/**
 * Attach a track to an item that plays when the item is rolled
 */
Maestro.ItemTrack = class {
    constructor() {
        this.playlist = null;

        this.settings = {
            enable: Maestro.StageHand.initSetting(Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name + "_" + Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.EnableN, Maestro.ItemTrack.SETTINGS_META.enable)
        };
    }

    static get SETTINGS_ONCHANGE() {
        return {
            enable: s => {
                if (maestro.itemTrack) {
                    maestro.itemTrack.settings.enable = s
                }
            }
        }
    }

    /**
     * Gets setting metadata for each setting
     */
    static get SETTINGS_META() {
        return {
            enable: Maestro.StageHand.buildSetting(Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.EnableN, Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.EnableH, Boolean, "World", false, true, Maestro.ItemTrack.SETTINGS_ONCHANGE.enable )
        }
    }

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    _checkForItemTracksPlaylist() {
        if(!game.user.isGM) return;

        const itemPlaylist = game.playlists.entities.find(p => p.name == Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playlistName);
        if(!itemPlaylist) {
            this.playlist = this._createItemTracksPlaylist(true);
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

        return await Playlist.create({"name": Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playlistName});
    }

    /**
     * Checks for the existence of the Item Track flag, then plays the track
     * @param {Object} message  the chat message object
     * @param {Object} html  the jQuery html object for the message
     * @param {Object} data  the data payload
     */
    async _checkItemTrack(message, html, data) {
        const itemCard = html.find(".dnd5e.chat-card.item-card");
        const trackPlayed = message.getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.played);
        
        if(!itemCard || itemCard.length === 0 || trackPlayed) {
            return;
        }
        
        let item;
        const itemId = itemCard.attr("data-item-id");
        const hasActor = itemCard.find("data-actor-id");

        if (hasActor) {
            let actorId = itemCard.attr("data-actor-id");
            item = await game.actors.get(actorId).getOwnedItem(itemId);
        } else {
            item = await game.items.get(itemId);
        }

        const itemTrack = await this._getItemTrack(item);
    
        if(!itemTrack) {
            return;
        }

        await this._playTrack(itemTrack);
        return this._setChatMessageFlag(message);
    }
    

    /**
     * Get the Item Track flag if it exists on an item
     * @param {*} item
     */
    async _getItemTrack(item) {
        let itemTrack;

        try {
            itemTrack = await item.getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.track);
            return itemTrack;
        } catch (e) {
            console.log(e);
            return;
        }

    }
    
    /**
     * Sets the Item Track
     * @param {Number} trackId - Id of the track in the playlist 
     */
    async _setItemTrack(item, trackId) {
        try {
            await item.setFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.track, trackId);
        } catch (e) {
            //we should do something with this in the future, eg. if the flag can't be found
            throw e
        }
    }
    
    /**
     * Adds a button to the Item sheet to open the Item Track form
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} data 
     */
    async _addItemTrackButton (app, html, data) {
        /**
         * Hype Button html literal
         * @todo replace with a template instead
         */
        const itemTrackButton = $(
            `<a class="${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name}" title="${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.aTitle}">
                <i class="${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.buttonIcon}"></i>
                <span> ${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.buttonText}</span>
            </a>`
        );
        
        if (html.find(`.${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name}`).length > 0) {
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
            const actorTrack = await this._getItemTrack(app.entity);
            this._openTrackForm(app.entity, actorTrack, {closeOnSubmit: true});
        });
    }
    
    /**
     * Opens the Item Track form
     * @param {Object} item  the reference item
     * @param {*} track  any existing track
     * @param {*} options  form options
     */
    _openTrackForm(item, track, options){
        const data = {
            "track": track,
            "playlist": this.playlist
        }
        new Maestro.ItemTrackForm(item, data, options).render(true);
    }

    /**
     * For a given trackId get the corresponding playlist sound
     * @param {String} trackId 
     */
    _getPlaylistSound(trackId) {
        return this.playlist.sounds.find(s => s.id == trackId);
    }

    /**
     * Play a playlist sound based on the given trackId
     * @param {String} trackId 
     */
    _playTrack(trackId) {
        //const sound = this._getPlaylistSound(trackId);
        if(!(trackId instanceof Number)) {
            trackId = Number(trackId);
        }

        this.playlist.updateSound({id: trackId, playing: true});
    }

    /**
     * Sets a flag on a chat 
     */
    _setChatMessageFlag(message) {
        if (!message) {
            return;
        }

        message.setFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.played, true);
    }
    
}

/**
 * A FormApplication for managing the item's track
 */
Maestro.ItemTrackForm = class extends FormApplication {
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
            title: Maestro.Stage.DEFAULT_CONFIG.ItemTrack.aTitle,
            template: Maestro.Stage.DEFAULT_CONFIG.ItemTrack.templatePath,
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data to the handlebars template
     */
    async getData() {
        const data = {
            playlistTracks: this.data.playlist.sounds,
            track: this.data.track
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
        await maestro.itemTrack._setItemTrack(this.item, formData.track);  
    }

}

/**
 * Tap, tap, tap, ahem
 * Shall we begin?
 * 
 * Initiates the module
 */
Maestro.Conductor.begin();
