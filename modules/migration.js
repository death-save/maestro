import * as MAESTRO from "./config.js";

// Migrate data post Foundry 0.4.4
export function migrationHandler() {
    const targetMigrationVersion = "0.4";
    const currentMigrationVersion = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Migration.currentVersion);

    if (currentMigrationVersion >= targetMigrationVersion) {
        return;
    }
    game.maestro.migration.errors = 0;

    const migrationStartMessage = game.i18n.localize("NOTIFICATIONS.MigrationStarting");

    ui.notifications.info(migrationStartMessage);

    try {
        _migrateScenePlaylists();
        _migratePlaylistMode();
        _migrateActorFlags();
        _migrateItemFlags();
        _migrateActorOwnedItemFlags();
        _migrateTokenOwnedItemFlags();
    } catch(e) {
        console.warn(e);
    }
    

    let migrationEndMessage;

    if (game.maestro.migration.errors > 0) {
        migrationEndMessage = game.i18n.localize("NOTIFICATIONS.MigrationFailed");
        ui.notifications.warn(migrationEndMessage);
    } else {
        migrationEndMessage = game.i18n.localize("NOTIFICATIONS.MigrationSucceeded");
        ui.notifications.info(migrationEndMessage);
    }

    game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Migration.currentVersion, game.modules.find(m => m.id === MAESTRO.MODULE_NAME).data.version);
}

// Migrate playlists on scenes to the new core playlist
async function _migrateScenePlaylists() {
    const scenePlaylists = game.scenes.entities.filter(s => !!s.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.SceneMusic.flagNames.playlist));

    if (scenePlaylists.length === 0) {
        return;
    }

    console.log("Maestro | Found Scenes with Playlist flags. Attempting to migrate...")

    for (let s of scenePlaylists) {
        const playlist = s.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.SceneMusic.flagNames.playlist);
       
        const sceneUpdate = await s.update({playlist: playlist, ["flags.-=" + MAESTRO.MODULE_NAME]: null});

        if (!sceneUpdate) {
            console.warn("Maestro | Failed to migrate Scene Playlist " + playlist + " for scene " + s._id);
        } else {
            console.log("Maestro | Successfully migrated Scene Playlist " + playlist + " for scene " + s._id);
        }
    }

    /*
    // Commenting out due to bug with updateMany and Scene hooks
    const updates = scenePlaylists.map(s => {
        return {
            _id: s.id, 
            playlist: s.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.SceneMusic.flagNames.playlist), 
            ["flags.-=" + MAESTRO.MODULE_NAME]: null};
    });

    const sceneUpdates = await Scene.updateMany(updates);

    if (!sceneUpdates) {
        console.warn("Maestro | Failed to migrate Scene Playlists to new core setting", updates);
        game.maestro.migration.errors += 1;
    } else {
        console.log("Maestro | Successfully migrated Scene Playlists to new core setting.");
    }
    */
}

// Migrate Playlist Mode if Sequential Once
async function _migratePlaylistMode() {
    const playlists = game.playlists.entities.filter(p => p.mode === 3);

    if (playlists.length === 0) {
        return;
    }

    const updates = playlists.map(p => {
        return {
            _id: p._id,
            mode: 1,
            ["flags." + MAESTRO.MODULE_NAME + MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop]: false
        }
    });

    await Playlist.updateMany(updates);
}

// Migrate PlaylistSound flags on Actors and Items using a "best guess" methodology for the correct track
async function _migrateActorFlags() {
    const worldActors = game.actors.entities;
    const tokenActors = Object.values(game.actors.tokens);
    const actors = worldActors.concat(tokenActors);

    const actorHypeMap = actors.filter(a => {
        const flag = a.getFlag(MAESTRO.MODULE_NAME,MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track);
        if (flag !== undefined && !isNaN(flag)) {
            return true
        }
    }).map(a => {
        return {
            _id: a._id,
            track: a.getFlag(MAESTRO.MODULE_NAME,MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track)
        }
    });

    if (actorHypeMap.length === 0) {
        return;
    }
    
    const hypePlaylist = game.playlists.entities.find(p => p.name === "Hype Tracks");

    if (!hypePlaylist) {
        throw "Maestro | Hype Tracks playlist not found, Hype Track migration cannot continue.";
    }

    if (hypePlaylist.sounds.length === 0) {
        throw "Maestro | Hype Tracks playlist has no sounds, Hype Track migration cannot continue.";
    }
    console.log("Maestro | Found the following Actors with incompatible Hype Tracks:", actorHypeMap);
    console.log("Maestro | Attempting to match the old sound selections to the new format...");

    for (const a of actorHypeMap) {
        const actor = game.actors.get(a._id);
        const newTrack = hypePlaylist.sounds[Number(a.track)-1];
        if (!newTrack) {
            console.warn("Maestro | Cannot find a matching sound for the following Actor:", actor);
            game.maestro.migration.errors += 1;
        }
        
        await actor.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track, newTrack._id);
        return console.log("Maestro | Successfully mapped Actor: " + actor._id + " to Hype Track: " + newTrack.name);
    }

}

/**
 * 
 */
async function _migrateItemFlags() {
    const itemTrackMap = game.items.entities.filter(i => {
        const flag = i.getFlag(MAESTRO.MODULE_NAME,MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track);
        if (flag !== undefined && flag !== "" && !isNaN(flag)) {
            return true
        }
    }).map(i => {
        return {
            _id: i._id,
            playlist: i.getFlag(MAESTRO.MODULE_NAME,MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist),
            track: i.getFlag(MAESTRO.MODULE_NAME,MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track)
        }
    });

    if (itemTrackMap.length === 0) {
        return;
    }

    console.log("Maestro | Found the following Items with incompatible Item Tracks:", itemTrackMap);
    console.log("Maestro | Attempting to match the Item Track to the new format...");

    for (const i of itemTrackMap) {
        const item = game.items.get(i._id);
        const playlist = game.playlists.get(i.playlist);

        if (!playlist) {
            console.warn("Maestro | Cannot find Playlist " + i.playlist + " this Item Track will not be migrated.");
            game.maestro.migration.errors += 1;
            continue;
        }

        const newTrack = playlist.sounds[Number(i.track)-1];

        if (!newTrack) {
            console.warn("Maestro | Cannot find a matching sound for the following Item:", item);
            game.maestro.migration.errors += 1;
            continue;
        }
        
        item.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track, newTrack._id);
        return console.log("Maestro | Successfully mapped Item: " + i._id + " to Item Track: " + newTrack.name);
    }

}

/**
 * 
 */
async function _migrateActorOwnedItemFlags() {
    const worldActors = game.actors.entities.filter(a => a.items.length > 0);
    
    // Migrate OwnedItems on Actors
    for (const a of worldActors) {
        const ownedItems = a.items.filter(i => {
            const flag = i.getFlag(MAESTRO.MODULE_NAME,MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track);
            if (flag !== undefined && !isNaN(flag)) {
                return true
            }
        }).map(i => {
            return {
                _id: i._id, 
                playlist: i.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist),
                track: i.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track)
            }
        });

        if (ownedItems.length === 0) {
            continue;
        }

        const updates = ownedItems.map(i => {
            return {
                _id: i._id,
                ["flags."+[MAESTRO.MODULE_NAME]+"."+[MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track]]: game.playlists.get(i.playlist).sounds[Number(i.track)-1]._id
            }
        });

        console.log("Maestro | Found the following OwnedItems for Actor " + a._id + " with incompatible Item Tracks:", ownedItems);
        console.log("Maestro | Attempting to match the old sound selections to the new format...");

        // Migrate the flags logging success or failure
        const itemUpdates = await a.updateManyEmbeddedEntities("OwnedItem", updates)
        
        if (!itemUpdates) {
            console.warn("Maestro | Failed to map Tracks for OwnedItems:", updates);
        } else {
            console.log("Maestro | Successfully mapped Tracks for OwnedItems:", updates)
        }
    }

    
}

async function _migrateTokenOwnedItemFlags() {
    const scenes = game.scenes.entities.filter(s =>
        s.data.tokens.length > 0 && s.data.tokens.filter(t => t.isLinked === false && t.actorData.items && t.actorData.items.length > 0)
    );

    if (scenes.length === 0) {
        return;
    }

    // Migrate OwnedItems on Tokens
    for (let s of scenes) {
        const tokens = s.data.tokens.map(t => {
            return {
                _id: t._id,
                actorId: t.actorId,
                actorData: t.actorData
            }
        });

        let updates = [];

        for (let t of tokens) {

            const ownedItems = t.actorData.items; 

            if (!ownedItems) {
                continue;
            }

            const badFlagItems = ownedItems.filter(i => {
                const flag = i.flags[MAESTRO.MODULE_NAME] ? i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track] : null;

                if (flag && Number(flag)) {
                    return true;
                }
            });

            if (badFlagItems.length === 0) {
                continue;
            }

            console.log("Maestro | Found the following OwnedItems for TokenActor " + t.actorId +"." + t._id + " on Scene " + s._id + " with incompatible Item Tracks:", badFlagItems);
            

            const itemUpdates = await duplicate(ownedItems);
            
            itemUpdates.forEach(i => {
                const flag = i.flags[MAESTRO.MODULE_NAME] ? i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track] : null;

                if (!flag || !Number(flag)) {
                    return;
                }

                const playlistFlag = i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist];
                const trackFlag = i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track];
                const playlist = game.playlists.get(playlistFlag);
                
                if (playlist.sounds[Number(trackFlag)-1]) {
                    i.flags.maestro.track = playlist.sounds[Number(trackFlag)-1]._id;
                    console.log("Maestro | Matched flag " + trackFlag + " to track " + i.flags.maestro.track + " in Playlist " + playlistFlag);
                } else {
                    i.flags.maestro.track = "";
                    console.warn("Maestro | Unable to match flag " + trackFlag + " to track in Playlist " + playlistFlag);
                    game.maestro.errors += 1;
                }
            });

            
            updates.push({
                "_id": t._id,
                "actorData": {
                    "items": itemUpdates
                }
            });
                        
        }

        if (updates.length === 0) {
            continue;
        }

        const sceneUpdate = await s.updateManyEmbeddedEntities("Token", updates);
        
        if (!sceneUpdate) {
            console.warn("Maestro | Failed to map Tracks for Token OwnedItems:", updates);
            game.maestro.migration.errors += 1;
            continue;
        }

        console.log("Maestro | Successfully mapped Tracks for Token OwnedItems:", updates) 
    }
}