// @ts-check

/**
 * @todo monkey patch for Foundry.js stopAll bug
 */

/**
 * Create a global const to namespace classes
 */
const Maestro = this.Maestro || {};

/**
 * Create a global const to store class instances
 */
const maestro = this.maestro || {};

/**
 * Holds constants
 */
Maestro.Stage = class {
    static get DEFAULT_CONFIG() {
        return {
            Module: {
                name: "maestro",
                label: "Maestro"
            },
            SceneMusic: {
                name: "scene-music",
                flagNames: {
                    playlist: "playlistId"
                },
                templatePath: "public/modules/maestro/templates/playlist-select.html"
            },
            HypeTrack: {
                name: "hype-track",
                playlistName: "Hype Tracks",
                buttonIcon: "fas fa-music",
                buttonText: " Hype",
                aTitle: "Change Actor Theme Song",
                flagNames: {
                    track: "track"
                },
                templatePath: "public/modules/maestro/templates/hype-track-form.html"
            }
        }
    }
}

/**
 * Orchestrates (get it?) module functionality
 */
Maestro.Conductor = class {
    static begin() {
        maestro.sceneMusic = new Maestro.SceneMusic();
        maestro.hypeTrack = new Maestro.HypeTrack();

        Maestro.Conductor._hookOnReady();
        Maestro.Conductor._hookOnRenderSceneSheet();
        Maestro.Conductor._hookOnUpdateScene();
        Maestro.Conductor._hookOnUpdateCombat();
    }

    /**
     * Ready Hook
     */
    static async _hookOnReady() {
        Hooks.on("ready", async () => {
            maestro.hypeTrack._checkForHypeTracksPlaylist();

            Maestro.Conductor._hookOnRenderCharacterSheets();
            Maestro.Conductor._monkeyPatchStopAll();
        });
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
     * Actor Sheet Hook (Character type only)
     */
    static _hookOnRenderCharacterSheets() {
        if(!game.user.isGM) return;
        const sheetClasses = Object.values(CONFIG.Actor.sheetClasses.character);

        for (let s of sheetClasses) {
            const sheetClass = s.id.split(".")[1];
            Hooks.on(`render${sheetClass}`, (app, html, data) => {
                maestro.hypeTrack._addHypeButton(app, html, data);
            });
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
     * Update Scene Hook
     */
    static _hookOnUpdateScene() {
        Hooks.on("updateScene", (scene, updateData, options, userId) => {
            maestro.sceneMusic._checkForScenePlaylist(scene, updateData);
        });
    }

    static _monkeyPatchStopAll() {
        const target = Playlist.prototype.stopAll;
        const expectedFunction = function() {
            stopAll() {
            const sounds = this.data.sounds.map(s => {
                s.playing = false;
                return s;
            });
            this.update({playing: false, sounds: sounds});
        }
    }

        //if (target.toString() == expectedFunction) {
        if(target) {
            Playlist.prototype.stopAll = function() {
                const sounds = this.data.sounds.map(s => mergeObject(s, { playing: false }, { inplace: false }));
                this.update({playing: false, sounds: sounds});            
            }
        } else {
            return;
        }
        
    }
}

Maestro.StageHand = class {
    /**
     * Registers game settings for the specified  /  function
     * @param {String} key -- the key to refer to the setting 
     * @param {Object} setting -- a setting object
     */
    static registerSetting(key, setting) {
        game.settings.register(Maestro.Stage.DEFAULT_CONFIG.Module.name, key, setting);
    }

    /**
     * Retrieves a game setting for the specified  /  function
     * @param {String} key -- the key to lookup 
     */
    static getSetting(key) {
        return game.settings.get(Maestro.Stage.DEFAULT_CONFIG.Module.name, key);
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
                newSettingValue = await game.settings.set(Maestro.Stage.DEFAULT_CONFIG.Module.name, settingKey, tempSettingObject);
            } else {
                throw ("Failed to update nested property of " + key + " check syntax");
            }

        } else if (typeof oldSettingValue === typeof value) {
            //console.log(CUBButler.MODULE_NAME, key, value);
            newSettingValue = await game.settings.set(Maestro.Stage.DEFAULT_CONFIG.Module.name, key, value);
        }
        return newSettingValue;
    }
}

/**
 * Adds the ability to set a playlist for a scene which will be played on activation
 */
Maestro.SceneMusic = class {

    /**
     * Retrieves additional data about a scene for later user
     * @param {Object} scene - the scene to retrieve additional data about 
     */
    _getAdditionalData(scene) {
        return {
            moduleName: Maestro.Stage.DEFAULT_CONFIG.Module.name,
            flagName: Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist,
            scenePlaylistFlag: game.scenes.get(scene.id).getFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist) || " ",
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
     * @param {Object} scene 
     * @param {Object} update 
     */
    _checkForScenePlaylist(scene, update) {
        const scenePlaylistFlag = scene.getFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist);

        if ( scenePlaylistFlag && update.active === true ) {
            maestro.sceneMusic._playScenePlaylist(scenePlaylistFlag);
        }
    }

    /**
     * Begins playback of the specified playlist
     * @param {String} playlistId 
     */
    _playScenePlaylist(playlistId) {
        const playlist = game.playlists.get(playlistId);

        if (playlist && playlist.sounds.length > 0) {
            playlist.playAll();
        }
    }
}

/**
 * Allows a track to be set that will be played on an Actor's turn in combat
 */
Maestro.HypeTrack = class {
    constructor() {
        this.playlist = null;
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
            //const actorTrack = combat.combatant.actor.getFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.DEFAULT_CONFIG.HypeTrack.flagNames.track);
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
            actorTrack = await actor.getFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.Stage.DEFAULT_CONFIG.HypeTrack.flagNames.track);
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
            await actor.setFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.Stage.DEFAULT_CONFIG.HypeTrack.flagNames.track, trackId);
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
         * Finds the header and the close button
         */
        const windowHeader = html.parent().parent().find(".window-header");
        const windowCloseBtn = windowHeader.find(".close");
    
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
        
        /**
         * Create an instance of the hypeButton before the close button
         * Removes existing instances first to avoid duplicates
         */
        windowHeader.find('.hype-track').remove();
        windowCloseBtn.before(hypeButton);
    
        /**
         * Open the Hype Track form on button click
         */
        hypeButton.click(async ev => {
            const actorTrack = await this._getActorHypeTrack(app.entity);
            this._openTrackForm(app.entity, actorTrack, {closeOnSubmit: true});
        });
    }
    
    _openTrackForm(actor, track, options){
        const data = {
            "track": track,
            "playlist": this.playlist
        }
        new Maestro.HypeTrackActorForm(actor, data, options).render(true);
    }

    _getPlaylistSound(trackId) {
        return this.playlist.sounds.find(s => s.id == trackId);
    }

    _playTrack(trackId) {
        //const sound = this._getPlaylistSound(trackId);
        if(!(trackId instanceof Number)) {
            trackId = Number(trackId);
        }

        this.playlist.updateSound({id: trackId, playing: true});
    }
}

/**
 * A FormApplication derivative that allows the setting of a Hype Track
 */
Maestro.HypeTrackActorForm = class extends FormApplication {
    constructor(actor, data, options){
        super(data, options);
        this.actor = actor;
        this.data = data;
    }
    
    /**
     * Default Options for this FormApplication
     * @todo extract to module constants
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hype-track-form",
            title: "Character Theme Song",
            template: Maestro.Stage.DEFAULT_CONFIG.HypeTrack.templatePath,
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data (ddbURL if any) to the handlebars template
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
 * Tap, tap, tap, ahem
 * Shall we begin?
 */
Maestro.Conductor.begin();
