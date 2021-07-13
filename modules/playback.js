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

    const playlist = game.playlists.get(playlistId);

    if (!playlist) {
        return;
    }

    if (trackId === MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.random) {
        trackId = playlist.playbackOrder[0];
    }

    if(!trackId) {
        return;
    }

    return await playlist.updateEmbeddedEntity("PlaylistSound", {_id: trackId, playing: true});
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

/**
 * Finds a sound EmbeddedEntity by its name
 * @param {*} name 
 */
export function findPlaylistSound(searchString, findBy="name") {
    const playlist = game.playlists.entities.find(p => p.sounds.find(s => s[findBy] === searchString));
    return playlist ? {playlist, sound: playlist.sounds.find(s => s[findBy] === searchString)} : null;
}

/**
 * Play a sound by its name rather than id
 * @param {*} name 
 * @param {*} options 
 */
export function playSoundByName(name, {playlist=null}={}) {
    // If no playlist provided, try to find the first matching one
    if (!playlist) {
        let {playlist, sound} = findPlaylistSound(name);
        
        if (!playlist) {
            ui.warn(game.i18n.localize("MAESTRO.PLAYBACK.PlaySoundByName.NoPlaylist"));
            return;
        }
    }

    playlist.playSound(name);
}

/**
 * Pauses a playing howl
 * @param {*} sounds 
 */
export async function pauseSounds(sounds) {
    if (!sounds) {
        return;
    }

    if (!(sounds instanceof Array)) {
        sounds = [sounds];
    }

    const soundsToPause = [];
    const pausedSounds = [];

    for (let sound of sounds) {
        let playlistSound;

        // If the sound param is a string, determine if it is a name or a path
        if (typeof(sound) === "string") {
            playlistSound = findPlaylistSound(sound)?.sound || findPlaylistSound(sound, "path")?.sound || null;
        }
        // } else if (sound instanceof PlaylistSound) {
        //     // const playlist = game.playlists.entities.find(p => p.sounds.find(s => s._id === sound._id)) || null;
        //     // playlistSound = playlist ? playlist.sounds.find(s => s._id === sound._id) : null;
        //     sound.sound.pause();

        // }

        if (!sound instanceof PlaylistSound) {
            return;
        }
        //const howl = game.audio.sounds[playlistSound.path].howl;
        //howl.pause();
        //sound.sound?.pause();
        sound.update({playing: false, pausedTime: sound.sound.currentTime});
        //soundsToPause.push({_id: sound.id, playing: false, pausedTime: sound.sound.currentTime});
        pausedSounds.push(sound);
    }

    //const soundUpdate = await PlaylistSound.updateMany(soundsToPause);
    //const pausedSounds = soundUpdate.filter(s => s.pausedTime);
    return pausedSounds;
}

/**
 * Resume playback on one or many howls
 * @param {*} sounds 
 */
export function resumeSounds(sounds) {
    if (!(sounds instanceof Array)) {
        sounds = [sounds];
    }

    const resumedSounds = [];

    for (const sound of sounds) {
        //const howl = game.audio.sounds[sound.path].howl;

        //howl.play();
        sound.update({playing: true});

        resumedSounds.push(sound);
    }

    return resumedSounds;
}

/**
 * Pauses all active playlist sounds
 */
export function pauseAll() {
    // Find active playlists and sounds and pause them
    const activePlaylists = game.playlists.playing;

    if (!activePlaylists.length) return;

    const activeSounds = activePlaylists.flatMap(p => {
        return p.sounds?.contents?.filter(s => s.playing);
    });

    if (!activeSounds.length) return;

    const pausedSounds = pauseSounds(activeSounds);
    return pausedSounds;
}