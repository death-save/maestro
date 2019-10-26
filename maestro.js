/**
 * @todo monkey patch for Foundry.js stopAll bug
 */

/**
 * Create a global const to namespace classes
 */
const Maestro = Maestro || {};

/**
 * Create a global const to store class instances
 */
const maestro = maestro || {};

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
                templatePath: "public/modules/scene-music/templates/playlist-select.html"
            },
            HypeTrack: {
                name: "hype-track",
                playlistName: "Hype Tracks",
                buttonIcon: "fas fa-music",
                buttonText: " Hype",
                aTitle: "Change Actor Theme Song",
                flagNames: {
                    track: "track"
                }
            }
        }
    }
}

/**
 * Orchestrates (get it?) module functionality
 */
Maestro.Conductor = class {
    begin() {
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
    async static _hookOnReady() {
        Hooks.on("ready", async () => {
            maestro.hypeTrack._checkForHypeTracks();

            this._hookOnRenderCharacterSheets();
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
    _hookOnRenderCharacterSheets() {
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
    async static _hookOnRenderSceneSheet() {
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
            scenePlaylistFlag: game.scenes.get(scene.id).getFlag(Maestro.Stage.DEFAULT_CONFIG.SceneMusic.moduleName, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagNames.playlist) || " ",
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
        const scenePlaylistFlag = scene.getFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.Stage.DEFAULT_CONFIG.SceneMusic.flagName);

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

        if (playlist && playlist.length > 0) {
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

        const hypePlaylist = game.playlists.entities.find(p => p.name == Maestro.Stage.DEFAULT_CONFIG.playlistName);
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
            return await Playlist.create({"name": HypeTrack.DEFAULT_CONFIG.playlistName});
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
    async _setActorHypeTrack(trackId) {
        try {
            await this.actor.setFlag(Maestro.Stage.DEFAULT_CONFIG.Module.name, Maestro.Stage.DEFAULT_CONFIG.HypeTrack.flagNames.track, data.track);
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
            `<a class="${HypeTrack.DEFAULT_CONFIG.moduleName}" title="${HypeTrack.DEFAULT_CONFIG.aTitle}">
                <i class="${HypeTrack.DEFAULT_CONFIG.buttonIcon}"></i>
                <span> ${HypeTrack.DEFAULT_CONFIG.buttonText}</span>
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
            const actorTrack = await this._getActorTrack(app.entity);
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
            template: "public/modules/hype-track/templates/hype-track-form.html",
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
