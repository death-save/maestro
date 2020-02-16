import * as MAESTRO from "./config.js";


/**
* Get all the sounds in a specific playlist
*/
export function getPlaylistSounds(playlistId) {
    if (!playlistId) {
        return;
    }
    const playlist = game.playlists.get(playlistId);

    if (!playlist) {
        return;
    }

    return game.playlists.get(playlistId).sounds;
}

/**
 * For a given trackId get the corresponding playlist sound
 * @param {String} trackId 
 */
export function getPlaylistSound(trackId) {
    if (!this.playlist) {
        return;
    }
    return this.playlist.sounds.find(s => s.id == trackId);
}

/**
 * Play a playlist sound based on the given trackId
 * @param {String} playlistId - the playlist id
 * @param {String} trackId - the track Id or playback mode
 */
export async function playTrack(trackId, playlistId) {
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
 * Play a playlist using its default playback method
 * @param {String} playlistId
 */
export async function playPlaylist(playlistId) {
    if (!playlistId) {
        return;
    }

    const playlist = game.playlists.get(playlistId);

    if (!playlist) {
        return;
    }

    await playlist.playAll();
}