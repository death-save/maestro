import * as MAESTRO from "./config.js";
import * as Playback from "./playback.js";


export function _onRenderPlaylistDirectory(app, html, data) {
    _addPlaylistLoopToggle(html);
}

export class MaestroConfigForm extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.data = data;
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "maestro-config",
            title: MAESTRO.DEFAULT_CONFIG.Misc.maestroConfigTitle,
            template: MAESTRO.DEFAULT_CONFIG.Misc.maestroConfigTemplatePath,
            classes: ["sheet"],
            width: 500
        });
    }
    
    /**
     * Provide data to the template
     */
    getData() {
        const criticalSuccessFailureTracks = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks);

        if (!this.data && criticalSuccessFailureTracks) {
            this.data = criticalSuccessFailureTracks;
        }
        
        return {
            playlists: game.playlists.contents,
            criticalSuccessPlaylist: this.data.criticalSuccessPlaylist,
            criticalSuccessPlaylistSounds: this.data.criticalSuccessPlaylist ? Playback.getPlaylistSounds(this.data.criticalSuccessPlaylist) : null,
            criticalSuccessSound: this.data.criticalSuccessSound,
            criticalFailurePlaylist: this.data.criticalFailurePlaylist,
            criticalFailurePlaylistSounds: this.data.criticalFailurePlaylist ? Playback.getPlaylistSounds(this.data.criticalFailurePlaylist) : null,
            criticalFailureSound: this.data.criticalFailureSound
        } 
    }

    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks, {
            criticalSuccessPlaylist: formData["critical-success-playlist"],
            criticalSuccessSound: formData["critical-success-sound"],
            criticalFailurePlaylist: formData["critical-failure-playlist"],
            criticalFailureSound: formData["critical-failure-sound"]
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        const criticalPlaylistSelect = html.find("select[name='critical-success-playlist']");
        const failurePlaylistSelect = html.find("select[name='critical-failure-playlist']");

        if (criticalPlaylistSelect.length > 0) {
            criticalPlaylistSelect.on("change", event => {
                this.data.criticalSuccessPlaylist = event.target.value;
                this.render();
            });
        }

        if (failurePlaylistSelect.length > 0) {
            failurePlaylistSelect.on("change", event => {
                this.data.criticalFailurePlaylist = event.target.value;
                this.render();
            });
        } 
    }
}

/**
 * Adds a new toggle for loop to the playlist controls
 * @param {*} html 
 */
function _addPlaylistLoopToggle(html) {
    if (!game.user.isGM) return;
    
    const playlistModeButtons = html.find('[data-action="playlist-mode"]');
    const loopToggleHtml = 
        `<a class="sound-control" data-action="playlist-loop" title="${game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonTooltipLoop")}">
            <i class="fas fa-sync"></i>
        </a>`;

    playlistModeButtons.after(loopToggleHtml);

    const loopToggleButtons = html.find('[data-action="playlist-loop"]');

    if (loopToggleButtons.length === 0) {
        return;
    }

    // Widen the parent div
    const controlsDiv = loopToggleButtons.closest(".playlist-controls");
    controlsDiv.css("flex-basis", "110px");

    for (const button of loopToggleButtons) {
        const buttonClass = button.getAttribute("class");
        const buttonTitle = button.getAttribute("title");

        const playlistDiv = button.closest(".document");
        const playlistId = playlistDiv.getAttribute("data-document-id");
        const playlist = game.playlists.get(playlistId);

        const loop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);
        const mode = playlist.mode;
        if ([-1, 2].includes(mode)) {
            button.setAttribute("class", buttonClass.concat(" disabled"));
            button.setAttribute("title", game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonToolTipDisabled"));
        } else if (loop === false) {
            button.setAttribute("class", buttonClass.concat(" inactive"));
            button.setAttribute("title", game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonTooltipNoLoop"));
        }
    }

    loopToggleButtons.on("click", event => {
        const button = event.currentTarget;
        const buttonClass = button.getAttribute("class");

        if (!buttonClass) {
            return;
        }

        const playlistDiv = button.closest(".document");
        const playlistId = playlistDiv.getAttribute("data-document-id");

        if (!playlistId) {
            return;
        }

        if (buttonClass.includes("inactive")) {
            game.playlists.get(playlistId).unsetFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);
            button.setAttribute("class", buttonClass.replace(" inactive", ""));
            button.setAttribute("title", game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonTooltipLoop"));
        } else { 
            game.playlists.get(playlistId).setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop, false);
            button.setAttribute("class", buttonClass.concat(" inactive"));
            button.setAttribute("title", game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonTooltipNoLoop"));
        }
    });
}

/**
 * PreUpdate Playlist Sound handler
 * @param {*} playlist 
 * @param {*} update 
 * @todo maybe return early if no flag set?
 */
export function _onPreUpdatePlaylistSound(sound, update, options, userId) {
    // skip this method if the playlist sound has already been processed
    if (sound?._maestroSkip) return true;

    sound._maestroSkip = true;
    const playlist = sound.parent;
    // Return if there's no id or the playlist is not in sequential or shuffle mode
    if (!playlist?.playing || !update?.id || ![0, 1].includes(playlist?.mode)) {
        return true;
    }

    // If the update is a sound playback ending, save it as the previous track and return
    if (update?.playing === false) {
        playlist.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound, update.id);
        return true;
    }

    // Otherwise it must be a sound playback starting:
    const previousSound = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound);

    if (!previousSound) return true;

    let order;

    // If shuffle order exists, use that, else map the sounds to an order
    if (playlist?.mode === 1) {
        order = playlist.playbackOrder;
    } else {
        order = playlist?.sounds.map(s => s.id);
    }        
    
    const previousIdx = order.indexOf(previousSound);
    const playlistloop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);

    // If the previous sound was the last in the order, and playlist loop is set to false, don't play the incoming sound
    if (previousIdx === (playlist?.sounds?.length - 1) && playlistloop === false) {
        update.playing = false;
        playlist.playing = false;
    }        
}

/**
 * PreCreate Chat Message handler
 */
export function _onPreCreateChatMessage(message, options, userId) {
    const removeDiceSound = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.disableDiceSound);

    if (removeDiceSound && message.sound === "sounds/dice.wav") {
        message.sound = "";
    }
}

/**
 * Render Chat Message handler
 * @param {*} message 
 * @param {*} html 
 * @param {*} data 
 */
export function _onRenderChatMessage(message, html, data) {
    const enableCriticalSuccessFailureTracks = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks);

    if (enableCriticalSuccessFailureTracks) {
        playCriticalSuccessFailure(message);
    }
}

/**
 * Process Critical Success/Failure for a given message
 * @param {*} message
 */
function playCriticalSuccessFailure(message) {
    if ( !isFirstGM() || !message.isRoll || !message.isContentVisible ) return;
    
    for (const roll of message.rolls) {
        checkRollSuccessFailure(roll);
    }
    
}

/**
 * Play a sound for critical success or failure on d20 rolls
 * Adapted from highlightCriticalSuccessFailure in the dnd5e system
 * @param {*} roll 
 */
function checkRollSuccessFailure(roll) {
    // Highlight rolls where the first part is a d20 roll
    if ( !roll.dice.length ) return;
    const d = roll.dice[0];

    // Ensure it is the configured die type and unmodified
    const faceSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalDieFaces);
    const facesMatch = (d.faces === faceSetting) && ( d.results.length === 1 );
    if ( !facesMatch ) return;
    const isModifiedRoll = ("success" in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
    if ( isModifiedRoll ) return;

    // Get the sounds
    const criticalSuccessFailureTracks = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks);
    const criticalSuccessPlaylist = criticalSuccessFailureTracks.criticalSuccessPlaylist;
    const criticalSuccessSound = criticalSuccessFailureTracks.criticalSuccessSound;
    const criticalFailurePlaylist = criticalSuccessFailureTracks.criticalFailurePlaylist;
    const criticalFailureSound = criticalSuccessFailureTracks.criticalFailureSound;

    // Get the success/failure criteria
    const successSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessThreshold);
    const failureSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalFailureThreshold);
    
    const successThreshold = successSetting ?? d.options.critical;
    const failureThreshold = failureSetting ?? d.options.fumble;

    // Play relevant sound for successes and failures
    if ((successThreshold && (d.total >= successThreshold)) && (criticalSuccessPlaylist && criticalSuccessSound)) {
        Playback.playTrack(criticalSuccessSound, criticalSuccessPlaylist);
    } else if ((failureThreshold && (d.total <= failureThreshold)) && (criticalFailurePlaylist && criticalFailureSound)) {
        Playback.playTrack(criticalFailureSound, criticalFailurePlaylist)
    }
}

/**
 * Checks for the presence of the Critical playlist, creates one if none exist
 */
export async function _checkForCriticalPlaylist() {
    const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks);
    const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.createCriticalSuccessPlaylist);

    if(!isFirstGM() || !enabled || !createPlaylist) {
        return;
    }

    let playlist = game.playlists.contents.find(p => p.name == MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName);

    if(!playlist) {
        playlist = await _createCriticalPlaylist(true);
    }
}

/**
 * Create the Critical playlist if the create param is true
 * @param {Boolean} create - whether or not to create the playlist
 */
async function _createCriticalPlaylist(create) {
    if (!create) {
        return;
    }
    return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName});
}

/**
 * Checks for the presence of the Failure playlist, creates one if none exist
 */
export async function _checkForFailurePlaylist() {
    const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks);
    const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.createCriticalFailurePlaylist);

    if(!isFirstGM() || !enabled || !createPlaylist) {
        return;
    }

    let playlist = game.playlists.contents.find(p => p.name == MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName);

    if(!playlist) {
        playlist = await _createFailurePlaylist(true);
    }
}

/**
 * Create the Failure playlist if the create param is true
 * @param {Boolean} create - whether or not to create the playlist
 */
async function _createFailurePlaylist(create) {
    if (!create) {
        return;
    }
    return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName});
}

/**
 * Gets the first (sorted by userId) active GM user
 * @returns {User | undefined} the GM user document or undefined if none found
 */
export function getFirstActiveGM() {
    return game.users.filter(u => u.isGM && u.active).sort((a, b) => a.id?.localeCompare(b.id)).shift();
}

/**
 * Checks if the current user is the first active GM user
 * @returns {Boolean} Boolean indicating whether the user is the first active GM or not
 */
export function isFirstGM() {
    return game.userId === getFirstActiveGM()?.id;
}