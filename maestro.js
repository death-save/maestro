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
                    played: "item-track-played",
                    playlist: "playlist"
                },
                playbackModes: {
                    single: "single",
                    random: "random-track",
                    all: "play-all"
                },
                templatePath: "./modules/maestro/templates/item-track-form.html"
            },
            "PLAYLIST.Mode.SequentialOnce": "Sequential Playback (no loop)"
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
                EnableH: "Assign a track to be played when item is rolled",
                CreatePlaylistN: "Create Item Tracks Playlist",
                CreatePlaylistH: "When enabled, playlist will be created if it is not found"
            }
        }
    }
}

/**
 * Orchestrates (get it?) module functionality
 */
Maestro.Conductor = class {
    static begin() {
        Maestro.Conductor._hookOnInit();
        Maestro.Conductor._hookOnReady();
    }

    /**
     * Init Hook
     */
    static async _hookOnInit() {
        Hooks.on("init", () =>{
            Maestro.Conductor._initHookRegistrations();
        });
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

            //Set a timeout to allow the sheets to register correctly before we try to hook on them
            window.setTimeout(Maestro.Conductor._readyHookRegistrations, 500);
            //Maestro.Conductor._readyHookRegistrations();

            Maestro.StageHand._monkeyPatchCore();
        });
    }

    /**
     * Init Hook Registrations
     */
    static _initHookRegistrations() {
        //Maestro.Conductor._hookOnRenderPlaylistDirectory();
    }

    /**
     * Ready Hook Registrations
     */
    static _readyHookRegistrations() {
        //Sheet/App Render Hooks
        Maestro.Conductor._hookOnRenderActorSheets();
        Maestro.Conductor._hookOnRenderSceneSheet();
        Maestro.Conductor._hookOnRenderItemSheets();
        Maestro.Conductor._hookOnRenderChatMessage();

        //Pre-update Hooks
        Maestro.Conductor._hookOnPreUpdateScene();

        //Update Hooks
        Maestro.Conductor._hookOnUpdateCombat();
        //Maestro.Conductor._hookOnUpdatePlaylist();
        
        
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
            // @ts-ignore
            if (sheetClass instanceof Object) {
                const sheetSubClasses = Object.values(sheetClass);

                for (let sheetSubClass of sheetSubClasses) {
                    // @ts-ignore
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
            maestro.itemTrack.chatMessageHandler(message, html, data);
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

    /**
     * Executes monkey patches from the Rigger class
     */
    static _monkeyPatchCore() {
        const addMode = Maestro.StageHand._addNewPlaylistMode();

        if (!addMode) {
            return;
        }
        PlaylistDirectory.prototype._getModeIcon = Maestro.Rigger._getModeIcon;
        PlaylistDirectory.prototype._getModeTooltip = Maestro.Rigger._getModeTooltip;

        Playlist.prototype.playAll = Maestro.Rigger.playAll;
        Playlist.prototype._onEnd = Maestro.Rigger._onEnd;

    }

    static _addNewPlaylistMode() {
        return CONST.PLAYLIST_MODES.SEQUENTIAL_ONCE = 3;
    }

    
    
}

/**
 * Holds any monkey patches for core functionality
 */
Maestro.Rigger = class {

    /**
   * Patch: add SEQUENTIAL_ONCE
   * Given a constant playback mode, provide the FontAwesome icon used to display it
   * @param {Number} mode
   * @return {String}
   * @private
   */
  static _getModeIcon(mode) {
    return {
      [CONST.PLAYLIST_MODES.DISABLED]: '<i class="fas fa-ban"></i>',
      [CONST.PLAYLIST_MODES.SEQUENTIAL]: '<i class="far fa-arrow-alt-circle-right"></i>',
      [CONST.PLAYLIST_MODES.SHUFFLE]: '<i class="fas fa-random"></i>',
      [CONST.PLAYLIST_MODES.SIMULTANEOUS]: '<i class="fas fa-compress-arrows-alt"></i>',
      [CONST.PLAYLIST_MODES.SEQUENTIAL_ONCE]: 
        `<span class="fa-stack" style="font-size: 0.55em">
            <i class="far fa-circle fa-stack-2x"></i>
            1
        </span>`
    }[mode];
  }

  /**
   * Patch: add SEQUENTIAL_ONCE
   * Given a constant playback mode, provide the string tooltip used to describe it
   * @param {Number} mode
   * @return {String}
   * @private
   */
  static _getModeTooltip(mode) {
    return {
      [CONST.PLAYLIST_MODES.DISABLED]: game.i18n.localize("PLAYLIST.ModeDisabled"),
      [CONST.PLAYLIST_MODES.SEQUENTIAL]: game.i18n.localize("PLAYLIST.ModeSequential"),
      [CONST.PLAYLIST_MODES.SHUFFLE]: game.i18n.localize("PLAYLIST.ModeShuffle"),
      [CONST.PLAYLIST_MODES.SIMULTANEOUS]: game.i18n.localize("PLAYLIST.ModeSimultaneous"),
      [CONST.PLAYLIST_MODES.SEQUENTIAL_ONCE]: game.i18n.localize(Maestro.Stage.DEFAULT_CONFIG["PLAYLIST.Mode.SequentialOnce"])
    }[mode];
  }

  /**
   * Patch: add SEQUENTIAL_ONCE
   * This callback triggers whenever a sound concludes playback
   * Mark the concluded sound as no longer playing and possibly trigger playback for a subsequent sound depending on
   * the playlist mode.
   *
   * @param {Object} soundId  The sound ID of the track which is ending playback
   * @param {Number} howlId   The howl ID which has concluded playback
   * @private
   */
  static _onEnd(soundId, howlId) {
    if ( !game.user.isGM ) return;

    // Retrieve the sound object whose reference may have changed
    let sound = this.sounds.find(s => s.id === soundId);
    if ( sound.repeat ) return;

    // Conclude playback for the current sound
    let isPlaying = this.data.playing;
    this.updateSound({id: sound.id, playing: false});

    // Sequential or shuffled playback -- begin playing the next sound
    if ( isPlaying && [CONST.PLAYLIST_MODES.SEQUENTIAL, CONST.PLAYLIST_MODES.SHUFFLE].includes(this.mode) ) {
      let next = this._getNextSound(sound.id);
      if ( next ) this.updateSound({id: next.id, playing: true});
      else this.update({playing: false});
    }

    // Sequential Once playback - check if the last sound in the list has finished
    else if ( isPlaying && this.mode === CONST.PLAYLIST_MODES.SEQUENTIAL_ONCE) {
        let next = this._getNextSound(sound.id);
        if ( next.id === 1 ) this.update({playing: false});
        else this.updateSound({id: next.id, playing: true});
    }

    // Simultaneous playback - check if all have finished
    else if ( isPlaying && this.mode === CONST.PLAYLIST_MODES.SIMULTANEOUS ) {
      let isComplete = !this.sounds.some(s => s.playing);
      if ( isComplete ) {
        this.update({playing: false});
      }
    }
  }

  /**
   * Patch: add SEQUENTIAL_ONCE
   * Begin simultaneous playback for all sounds in the Playlist
   * @return {Promise}    A Promise which resolves once the Playlist update is complete
   */
  static async playAll() {
    const updateData = {};

    // Handle different playback modes
    switch (this.mode) {

      // Soundboard Only
      case CONST.PLAYLIST_MODES.DISABLED:
        updateData.playing = false;
        break;

      // Sequential Once - play tracks in order but do not loop
      case CONST.PLAYLIST_MODES.SEQUENTIAL_ONCE:  
      // Sequential Playback
      case CONST.PLAYLIST_MODES.SEQUENTIAL:
        updateData.sounds = duplicate(this.data.sounds).map((s, i) => {
          s.playing = i === 0;
          return s;
        });
        updateData.playing = updateData.sounds.length > 0;
        break;

      // Simultaneous - play all tracks
      case CONST.PLAYLIST_MODES.SIMULTANEOUS:
        updateData.sounds = duplicate(this.data.sounds).map(s => {
          s.playing = true;
          return s;
        });
        updateData.playing = updateData.sounds.length > 0;
        break;


      // Shuffle - play random track
      case CONST.PLAYLIST_MODES.SHUFFLE:
        this.shuffleOrder = this._getShuffleOrder();
        updateData.sounds = duplicate(this.data.sounds).map(s => {
          s.playing = s.id === this.shuffleOrder[0];
          return s;
        });
        updateData.playing = updateData.sounds.length > 0;
        break;

    }

    // Update the Playlist
    return this.update(updateData);
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
        if (!maestro.scenePlaylist && !getProperty(maestro, "sceneMusic.settings.enable")) {
            return;
        }
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
        if(!game.user.isGM || !getProperty(maestro, "hypeTrack.settings.enable")) {
            return;
        } 

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
        if (!getProperty(maestro, "hypeTrack.settings.enable")) {
            return;
        }
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
     * @param {*} trackId 
     */
    _playTrack(trackId) {
        //const sound = this._getPlaylistSound(trackId);
        // @ts-ignore
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
            enable: Maestro.StageHand.initSetting(Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name + "_" + Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.EnableN, Maestro.ItemTrack.SETTINGS_META.enable),
            createPlaylist: Maestro.StageHand.initSetting(Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name + "_" + Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.CreatePlaylistN, Maestro.ItemTrack.SETTINGS_META.createPlaylist)
        };
    }

    /**
     * Handles anything that needs to occur when settings change
     */
    static get SETTINGS_ONCHANGE() {
        return {
            enable: s => {
                if (maestro.itemTrack) {
                    maestro.itemTrack.settings.enable = s;
                }
            },
            createPlaylist: s => {
                if (maestro.itemTrack) {
                    maestro.itemTrack.settings.createPlaylist = s;
                }
            }
        };
    }

    /**
     * Gets setting metadata for each setting
     */
    static get SETTINGS_META() {
        return {
            enable: Maestro.StageHand.buildSetting(Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.EnableN, Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.EnableH, Boolean, "World", false, true, Maestro.ItemTrack.SETTINGS_ONCHANGE.enable ),
            createPlaylist: Maestro.StageHand.buildSetting(Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.CreatePlaylistN, Maestro.Stage.SETTINGS_DESCRIPTORS.ItemTrack.CreatePlaylistH, Boolean, "world", true, true, Maestro.ItemTrack.SETTINGS_ONCHANGE.createPlaylist )
        };
    }

    /**
     * Checks for the presence of the Hype Tracks playlist, creates one if none exist
     */
    async _checkForItemTracksPlaylist() {
        if(!game.user.isGM || !getProperty(maestro, "itemTrack.settings.enable") || !getProperty(maestro, "itemTrack.settings.createPlaylist")) {
            return;
        }

        const itemPlaylist = game.playlists.entities.find(p => p.name == Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playlistName);
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
        return await Playlist.create({"name": Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playlistName});
    }

    /**
     * Handles module logic for chat message card
     * @param {Object} message - the chat message object
     * @param {Object} html - the jquery object
     * @param {Object} data - the data in the message update
     */
    async chatMessageHandler(message, html, data) {
        if (!getProperty(maestro, "itemTrack.settings.enable")) {
            return;
        }

        const itemCard = html.find("[data-item-id]");
        const trackPlayed = message.getFlag(Maestro.Stage.MODULE_NAME, Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.played);
        
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
            case Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playbackModes.all:
                await this._playPlaylist(playlist);
                return this._setChatMessageFlag(message);
            
            case Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playbackModes.random:
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
        return await item.data.flags[Maestro.Stage.MODULE_NAME];
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
            [`flags.${Maestro.Stage.MODULE_NAME}.${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.playlist}`]: playlistId,
            [`flags.${Maestro.Stage.MODULE_NAME}.${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.flagNames.track}`]: trackId
        });
    }
     
    /**
     * Adds a button to the Item sheet to open the Item Track form
     * @param {Object} app 
     * @param {Object} html 
     * @param {Object} data 
     */
    async _addItemTrackButton (app, html, data) {
        if (!getProperty(maestro, "itemTrack.settings.enable")) {
            return;
        }

        /**
         * Item Track Button html literal
         * @todo replace with a template instead
         */
        const itemTrackButton = $(
            `<a class="${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name}" title="${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.aTitle}">
                <i class="${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.buttonIcon}"></i>
                <span> ${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.buttonText}</span>
            </a>`
        );
        
        if (html.find(`.${Maestro.Stage.DEFAULT_CONFIG.ItemTrack.name}`).length > 0 || !app.isEditable) {
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
                const itemId = app.entity.data.id;
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
            const track = flags.track || "";
            const playlist = flags.playlist || "";
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
        new Maestro.ItemTrackForm(item, data, options).render(true);
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

        if (trackId === Maestro.Stage.DEFAULT_CONFIG.ItemTrack.playbackModes.random) {
            trackId = playlist._getShuffleOrder()[0];
        }

        if(trackId && !(trackId instanceof Number)) {
            trackId = Number(trackId);
        }

        playlist.updateSound({id: trackId, playing: true});
    }

    /**
     * Sets a flag on a chat message
     * @param {Object} message - the message to set a flag on
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
        maestro.itemTrack.setItemFlags(this.item, formData.playlist, formData.track)  
    }

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

/**
 * Tap, tap, tap, ahem
 * Shall we begin?
 * 
 * Initiates the module
 */
Maestro.Conductor.begin();
