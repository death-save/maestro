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
                templatePath: "public/modules/maestro/templates/playlist-select.html"
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
                templatePath: "public/modules/maestro/templates/hype-track-form.html"
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

            if(maestro.hypeTrack) {
                maestro.hypeTrack._checkForHypeTracksPlaylist();
            }
            

            Maestro.Conductor._hookOnRenderCharacterSheets();
            Maestro.Conductor._monkeyPatchStopAll();
            Maestro.Conductor._hookOnRenderSceneSheet();
            Maestro.Conductor._hookOnPreUpdateScene();
            Maestro.Conductor._hookOnUpdateCombat();
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
            // @ts-ignore
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
     * Pre-Update Scene Hook
     * @todo remove 0.3.9 check after 0.4.0 release
     */
    static _hookOnPreUpdateScene() {
        if (game.data.version == "0.3.9") {
            Hooks.on("preUpdateScene", (scenes, updateData, options) => {
                maestro.sceneMusic._checkForScenePlaylist(scenes, updateData);
            });
        } else {
            Hooks.on("preUpdateScene", (scene, updateData, options) => {
                maestro.sceneMusic._checkForScenePlaylist(scene, updateData);
            })
        }
        
    }

    /**
     * Patch bug in stopAll function in Foundry.js Playlist class
     * @author KaKaRoTo (patch contents)
     */
    static _monkeyPatchStopAll() {
        if (game.data.version == "0.3.9") {
            /**
             * Patch
             */
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
     * @param {Object} scenes
     * @param {Object} update 
     */
    _checkForScenePlaylist(scenes, update) {
        if (!getProperty(maestro, "sceneMusic.settings.enable") && update.active !== true) {
            return;
        }

        let currentScene;
        const newScene = scenes.get(update._id);

        if (game.data.version == "0.3.9") {
            currentScene = scenes.entities.find(s => s.active === true);
        } else {
            currentScene = scenes;
        }
        
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
