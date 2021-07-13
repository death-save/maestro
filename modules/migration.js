import * as MAESTRO from "./config.js";

// Migrate data post Foundry 0.4.4
export function migrationHandler() {
    const targetMigrationVersion = MAESTRO.DEFAULT_CONFIG.Migration.targetVersion;
    const currentMigrationVersion = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Migration.currentVersion);

    if (currentMigrationVersion >= targetMigrationVersion) {
        return;
    }
    game.maestro.migration.errors = 0;

    const migrationStartMessage = game.i18n.localize("MAESTRO.NOTIFICATIONS.MigrationStarting");

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
        migrationEndMessage = game.i18n.localize("MAESTRO.NOTIFICATIONS.MigrationFailed");
        ui.notifications.warn(migrationEndMessage);
    } else {
        migrationEndMessage = game.i18n.localize("MAESTRO.NOTIFICATIONS.MigrationSucceeded");
        ui.notifications.info(migrationEndMessage);
    }

    game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Migration.currentVersion, game.modules.get(MAESTRO.MODULE_NAME).data.version);
}

// Migrate playlists on scenes to the new core playlist
async function _migrateScenePlaylists() {
    const scenePlaylists = game.scenes.entities.filter(s => !!s.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.SceneMusic.flagNames.playlist));

    if (scenePlaylists.length === 0) {
        return;
    }

    console.log(game.i18n.localize("MAESTRO.LOGS.MigrationSceneFlagsFound"));

    for (let s of scenePlaylists) {
        const playlist = s.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.SceneMusic.flagNames.playlist);
       
        const sceneUpdate = await s.update({playlist: playlist, ["flags.-=" + MAESTRO.MODULE_NAME]: null});

        if (!sceneUpdate) {

            console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationSceneFlagsFailed"), s._id, playlist);
        } else {
            console.log(game.i18n.localize("MAESTRO.LOGS.MigrationSceneFlagsSuccessful"), s._id, playlist);
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

/**
 * 
 */
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

/**
 * 
 */
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
    
    const hypePlaylist = game.playlists.entities.find(p => p.name === MAESTRO.DEFAULT_CONFIG.HypeTrack.playlistName);

    if (!hypePlaylist) {
        console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationHypeNoPlaylist"));
    }

    if (hypePlaylist.sounds.length === 0) {
        console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationHypeNoSounds"));
    }
    console.log(game.i18n.localize("MAESTRO.LOGS.MigrationHypeFoundActors"), actorHypeMap);
    console.log(game.i18n.localize("MAESTRO.LOGS.MigrationHypeAttemptingMatch"));

    for (const a of actorHypeMap) {
        const actor = game.actors.get(a._id);
        const newTrack = hypePlaylist.sounds[Number(a.track)-1];
        if (!newTrack) {
            console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationHypeNoMatch"), actor);
            game.maestro.migration.errors += 1;
        }
        
        await actor.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.HypeTrack.flagNames.track, newTrack._id);
        return console.log(game.i18n.localize("MAESTRO.LOGS.MigrationHypeSuccessful"), actor._id, newTrack._id);
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

    console.log(game.i18n.localize("MAESTRO.LOGS.MigrationItemFound"), itemTrackMap);
    console.log(game.i18n.localize("MAESTRO.LOGS.MigrationItemAttemptingMatch"));

    for (const i of itemTrackMap) {
        const item = game.items.get(i._id);
        const playlist = i.playlist ? game.playlists.get(i.playlist) : game.playlists.entities.find(p => p.name === MAESTRO.DEFAULT_CONFIG.HypeTrack.playlistName);

        if (!playlist) {
            console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationItemNoPlaylist"), i.playlist);
            game.maestro.migration.errors += 1;
            continue;
        }

        const newTrack = playlist.sounds[Number(i.track)-1];

        if (!newTrack) {
            console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationItemNoSound"), item);
            game.maestro.migration.errors += 1;
            continue;
        }
        
        item.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist, playlist._id);
        item.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track, newTrack._id);
        return console.log(game.i18n.localize("MAESTRO.LOGS.MigrationItemSuccess"), i._id, playlist._id, newTrack._id);
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
            const playlistFlag = i.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist);
            let playlist;

            if (!playlistFlag) {
                playlist = game.playlists.entities.find(p => p.name === MAESTRO.DEFAULT_CONFIG.ItemTrack.playlistName);
            } else {
                playlist = game.playlists.get(playlistFlag);
            }

            if (!playlist) {
                return;
            }

            return {
                _id: i._id, 
                playlist: playlist._id,
                track: i.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track)
            }
        });

        if (ownedItems.length === 0) {
            continue;
        }

        const updates = ownedItems.map(i => {
            return {
                _id: i._id,
                ["flags."+[MAESTRO.MODULE_NAME]+"."+[MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track]]: game.playlists.get(i.playlist).sounds[Number(i.track)-1]._id,
                ["flags."+[MAESTRO.MODULE_NAME]+"."+[MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist]]: i.playlist
            }
        });

        console.log(game.i18n.localize("MAESTRO.LOGS.MigrationOwnedItemFound"), a._id, ownedItems);
        console.log(game.i18n.localize("MAESTRO.LOGS.MigrationOwnedItemAttemptingMatch"));

        // Migrate the flags logging success or failure
        const itemUpdates = await a.updateEmbeddedEntity("OwnedItem", updates)
        
        if (!itemUpdates) {
            console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationOwnedItemFailed"), updates);
        } else {
            console.log(game.i18n.localize("MAESTRO.LOGS.MigrationOwnedItemSuccess"), updates);
        }
    }

    
}

/**
 * 
 */
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

            console.log(game.i18n.localize("MAESTRO.LOGS.MigrationTokenOwnedItemsFound"), t.actorId, t._id, s._id, badFlagItems);
            

            const itemUpdates = await duplicate(ownedItems);
            
            itemUpdates.forEach(i => {
                const flag = i.flags[MAESTRO.MODULE_NAME] ? i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track] : null;

                if (!flag || !Number(flag)) {
                    return;
                }

                const playlistFlag = i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.playlist];
                const trackFlag = i.flags[MAESTRO.MODULE_NAME][MAESTRO.DEFAULT_CONFIG.ItemTrack.flagNames.track];
                
                let playlist;

                if (!playlistFlag) {
                    playlist = game.playlists.entities.find(i => i.name === "Item Tracks");     
                } else {
                    playlist = game.playlists.get(playlistFlag);
                }
                
                if (!playlist) {
                    console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationItemNoPlaylist"));
                    game.maestro.errors += 1;
                    return;
                }
                                
                if (playlist.sounds[Number(trackFlag)-1]) {
                    i.flags.maestro.track = playlist.sounds[Number(trackFlag)-1]._id;
                    i.flags.maestro.playlist = playlist._id;
                    console.log(game.i18n.localize("MAESTRO.LOGS.MigrationTokenOwnedItemsMatched"), i.flags.maestro.playlist, i.flags.maestro.track);
                } else {
                    i.flags.maestro.track = "";
                    console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationTokenOwnedItemsNotMatched"), trackFlag, playlistFlag);
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

        const sceneUpdate = await s.updateEmbeddedEntity("Token", updates);
        
        if (!sceneUpdate) {
            console.warn(game.i18n.localize("MAESTRO.LOGS.MigrationTokenOwnedItemFailed"), updates);
            game.maestro.migration.errors += 1;
            continue;
        }

        console.log(game.i18n.localize("MAESTRO.LOGS.MigrationTokenOwnedItemSuccess"), updates);
    }
}