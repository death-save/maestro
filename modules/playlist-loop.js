import * as MAESTRO from "./config.js";

/**
 * 
 * @param {*} app 
 * @param {*} html 
 * @param {*} data 
 */
export function _addPlaylistLoopToggle(app, html, data) {
    const playlistModeButtons = html.find('[data-action="playlist-mode"]');
    const loopToggleHtml = 
        `<a class="sound-control" data-action="playlist-loop" title="${game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipLoop")}">
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

        const playlistDiv = button.closest(".entity");
        const playlistId = playlistDiv.getAttribute("data-entity-id");
        const playlist = game.playlists.get(playlistId);

        const loop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);
        const mode = playlist.data.mode;
        if ([-1, 2].includes(mode)) {
            button.setAttribute("class", buttonClass.concat(" disabled"));
            button.setAttribute("title", game.i18n.localize("PLAYLIST-LOOP.ButtonToolTipDisabled"));
        } else if (loop === false) {
            button.setAttribute("class", buttonClass.concat(" inactive"));
            button.setAttribute("title", game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipNoLoop"));
        }
    }

    loopToggleButtons.on("click", event => {
        const button = event.currentTarget;
        const buttonClass = button.getAttribute("class");

        if (!buttonClass) {
            return;
        }

        const playlistDiv = button.closest(".entity");
        const playlistId = playlistDiv.getAttribute("data-entity-id");

        if (!playlistId) {
            return;
        }

        if (buttonClass.includes("inactive")) {
            game.playlists.get(playlistId).unsetFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);
            button.setAttribute("class", buttonClass.replace(" inactive", ""));
            button.setAttribute("title", game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipLoop"));
        } else { 
            game.playlists.get(playlistId).setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop, false);
            button.setAttribute("class", buttonClass.concat(" inactive"));
            button.setAttribute("title", game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipNoLoop"));
        }
    });
}

/**
 * 
 * @param {*} playlist 
 * @param {*} update 
 * @todo maybe return early if no flag set?
 */
export function _onPreUpdatePlaylistSound(playlist, update) {
    // Return if there's no id or the playlist is not in sequential or shuffl mode
    if (!playlist.data.playing || !update._id || ![0, 1].includes(playlist.data.mode)) {
        return;
    }

    // If the update is a sound playback ending, save it as the previous track and return
    if (update.playing === false) {
        return playlist.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound, update._id);
    }

    // Otherwise it must be a sound playback starting:
    const previousSound = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound);

    if (!previousSound) {
        return;
    }

    let order;

    // If shuffle order exists, use that, else map the sounds to an order
    if (playlist.data.mode === 1) {
        order = playlist._getPlaybackOrder();
    } else {
        order = playlist.sounds.map(s => s._id);
    }        
    
    const previousIdx = order.indexOf(previousSound);
    const playlistloop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);

    // If the previous sound was the last in the order, and playlist loop is set to false, don't play the incoming sound
    if (previousIdx === (playlist.sounds.length - 1) && playlistloop === false) {
        update.playing = false;
        playlist.data.playing = false;
    }        
}