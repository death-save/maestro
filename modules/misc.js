import * as MAESTRO from "./config.js";
import * as Playback from "./playback.js";

export function _onRenderPlaylistDirectory(app, html, data) {
  _addPlaylistLoopToggle(html);
  _addMaestroConfig(html);
}

function _addMaestroConfig(html) {
  const createPlaylistButton = html.find("button.create-entity");

  const footerFlexDivHtml = `<div class="flexrow"></div>`;

  const maestroConfigButtonHtml = `<button class="maestro-config">
            <i class="fas fa-cog"></i> Maestro Config
        </button>`;

  createPlaylistButton.wrap(footerFlexDivHtml);
  createPlaylistButton.after(maestroConfigButtonHtml);

  const maestroConfigButton = html.find("button.maestro-config");

  maestroConfigButton.on("click", (event) => {
    event.preventDefault();
    const data = game.settings.get(
      MAESTRO.MODULE_NAME,
      MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks
    );

    new MaestroConfigForm(data).render(true);
  });
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
      width: 500,
    });
  }

  /**
   * Provide data to the template
   */
  getData() {
    const criticalSuccessFailureTracks = game.settings.get(
      MAESTRO.MODULE_NAME,
      MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks
    );

    if (!this.data && criticalSuccessFailureTracks) {
      this.data = criticalSuccessFailureTracks;
    }

    return {
      playlists: game.playlists.entities,
      criticalSuccessPlaylist: this.data.criticalSuccessPlaylist,
      criticalSuccessPlaylistSounds: this.data.criticalSuccessPlaylist
        ? Playback.getPlaylistSounds(this.data.criticalSuccessPlaylist)
        : null,
      criticalSuccessSound: this.data.criticalSuccessSound,
      criticalFailurePlaylist: this.data.criticalFailurePlaylist,
      criticalFailurePlaylistSounds: this.data.criticalFailurePlaylist
        ? Playback.getPlaylistSounds(this.data.criticalFailurePlaylist)
        : null,
      criticalFailureSound: this.data.criticalFailureSound,
    };
  }

  /**
   * Update on form submit
   * @param {*} event
   * @param {*} formData
   */
  async _updateObject(event, formData) {
    await game.settings.set(
      MAESTRO.MODULE_NAME,
      MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks,
      {
        criticalSuccessPlaylist: formData["critical-success-playlist"],
        criticalSuccessSound: formData["critical-success-sound"],
        criticalFailurePlaylist: formData["critical-failure-playlist"],
        criticalFailureSound: formData["critical-failure-sound"],
      }
    );
  }

  activateListeners(html) {
    super.activateListeners(html);

    const criticalPlaylistSelect = html.find(
      "select[name='critical-success-playlist']"
    );
    const failurePlaylistSelect = html.find(
      "select[name='critical-failure-playlist']"
    );

    if (criticalPlaylistSelect.length > 0) {
      criticalPlaylistSelect.on("change", (event) => {
        this.data.criticalSuccessPlaylist = event.target.value;
        this.render();
      });
    }

    if (failurePlaylistSelect.length > 0) {
      failurePlaylistSelect.on("change", (event) => {
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
  const playlistModeButtons = html.find('[data-action="playlist-mode"]');
  const loopToggleHtml = `<a class="sound-control" data-action="playlist-loop" title="${game.i18n.localize(
    "PLAYLIST-LOOP.ButtonTooltipLoop"
  )}">
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

    const loop = playlist.getFlag(
      MAESTRO.MODULE_NAME,
      MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop
    );
    const mode = playlist.data.mode;
    if ([-1, 2].includes(mode)) {
      button.setAttribute("class", buttonClass.concat(" disabled"));
      button.setAttribute(
        "title",
        game.i18n.localize("PLAYLIST-LOOP.ButtonToolTipDisabled")
      );
    } else if (loop === false) {
      button.setAttribute("class", buttonClass.concat(" inactive"));
      button.setAttribute(
        "title",
        game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipNoLoop")
      );
    }
  }

  loopToggleButtons.on("click", (event) => {
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
      game.playlists
        .get(playlistId)
        .unsetFlag(
          MAESTRO.MODULE_NAME,
          MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop
        );
      button.setAttribute("class", buttonClass.replace(" inactive", ""));
      button.setAttribute(
        "title",
        game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipLoop")
      );
    } else {
      game.playlists
        .get(playlistId)
        .setFlag(
          MAESTRO.MODULE_NAME,
          MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop,
          false
        );
      button.setAttribute("class", buttonClass.concat(" inactive"));
      button.setAttribute(
        "title",
        game.i18n.localize("PLAYLIST-LOOP.ButtonTooltipNoLoop")
      );
    }
  });
}

/**
 * PreUpdate Playlist Sound handler
 * @param {*} playlist
 * @param {*} update
 * @todo maybe return early if no flag set?
 */
export function _onPreUpdatePlaylistSound(playlist, update) {
  // Return if there's no id or the playlist is not in sequential or shuffl mode
  if (
    !playlist.data.playing ||
    !update._id ||
    ![0, 1].includes(playlist.data.mode)
  ) {
    return;
  }

  // If the update is a sound playback ending, save it as the previous track and return
  if (update.playing === false) {
    return playlist.setFlag(
      MAESTRO.MODULE_NAME,
      MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound,
      update._id
    );
  }

  // Otherwise it must be a sound playback starting:
  const previousSound = playlist.getFlag(
    MAESTRO.MODULE_NAME,
    MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound
  );

  if (!previousSound) {
    return;
  }

  let order;

  // If shuffle order exists, use that, else map the sounds to an order
  if (playlist.data.mode === 1) {
    order = playlist._getPlaybackOrder();
  } else {
    order = playlist.sounds.map((s) => s._id);
  }

  const previousIdx = order.indexOf(previousSound);
  const playlistloop = playlist.getFlag(
    MAESTRO.MODULE_NAME,
    MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop
  );

  // If the previous sound was the last in the order, and playlist loop is set to false, don't play the incoming sound
  if (previousIdx === playlist.sounds.length - 1 && playlistloop === false) {
    update.playing = false;
    playlist.data.playing = false;
  }
}

/**
 * PreCreate Chat Message handler
 */
export function _onPreCreateChatMessage(message, options, userId) {
  const removeDiceSound = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.disableDiceSound
  );

  if (removeDiceSound && message.sound && message.sound === "sounds/dice.wav") {
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
  const enableCriticalSuccessFailureTracks = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks
  );

  if (enableCriticalSuccessFailureTracks) {
    playCriticalSuccessFailure(message);
  }
}

/**
 * Play a sound for critical success or failure on d20 rolls
 * Adapted from highlightCriticalSuccessFailure in the dnd5e system
 * @param {*} message
 */
function playCriticalSuccessFailure(message) {
  if (
    !game.user.isGM ||
    !message.isRoll ||
    !message.isContentVisible ||
    !message.roll.parts.length
  )
    return;

  // Highlight rolls where the first part is a d20 roll
  const roll = message.roll;
  if (!roll.dice.length) return;
  const d = roll.dice[0];

  // Ensure it is an un-modified d20 roll
  const isD20 = d.faces === 20 && d.results.length === 1;
  if (!isD20) return;
  const isModifiedRoll =
    "success" in d.rolls[0] ||
    d.options.marginSuccess ||
    d.options.marginFailure;
  if (isModifiedRoll) return;

  // Get the sounds
  const criticalSuccessFailureTracks = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks
  );
  const criticalSuccessPlaylist =
    criticalSuccessFailureTracks.criticalSuccessPlaylist;
  const criticalSuccessSound =
    criticalSuccessFailureTracks.criticalSuccessSound;
  const criticalFailurePlaylist =
    criticalSuccessFailureTracks.criticalFailurePlaylist;
  const criticalFailureSound =
    criticalSuccessFailureTracks.criticalFailureSound;

  // Play relevant sound for successes and failures
  let attacks = compareAttacks(message);
  if (attacks.length > 0) {
    attacks.forEach((result) => {
      if (result === 0) {
        Playback.playTrack(criticalFailureSound, criticalFailurePlaylist);
        return;
      } else if (result === 3) {
        Playback.playTrack(criticalSuccessSound, criticalSuccessPlaylist);
        return;
      }
    });
  } else {
    d.options.critical = 20;
    d.options.fumble = 1;
    if (
      d.options.critical &&
      d.total == d.options.critical &&
      criticalSuccessPlaylist &&
      criticalSuccessSound
    ) {
      Playback.playTrack(criticalSuccessSound, criticalSuccessPlaylist);
    } else if (
      d.options.fumble &&
      d.total <= d.options.fumble &&
      criticalFailurePlaylist &&
      criticalFailureSound
    ) {
      Playback.playTrack(criticalFailureSound, criticalFailurePlaylist);
    }
  }
}

/**
 * Checks for the presence of the Critical playlist, creates one if none exist
 */
export async function _checkForCriticalPlaylist() {
  const enabled = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks
  );
  const createPlaylist = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.createCriticalSuccessPlaylist
  );

  if (!game.user.isGM || !enabled || !createPlaylist) {
    return;
  }

  let playlist = game.playlists.entities.find(
    (p) => p.name == MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName
  );

  if (!playlist) {
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
  return await Playlist.create({
    name: MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName,
  });
}

/**
 * Checks for the presence of the Failure playlist, creates one if none exist
 */
export async function _checkForFailurePlaylist() {
  const enabled = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks
  );
  const createPlaylist = game.settings.get(
    MAESTRO.MODULE_NAME,
    MAESTRO.SETTINGS_KEYS.Misc.createCriticalFailurePlaylist
  );

  if (!game.user.isGM || !enabled || !createPlaylist) {
    return;
  }

  let playlist = game.playlists.entities.find(
    (p) => p.name == MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName
  );

  if (!playlist) {
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
  return await Playlist.create({
    name: MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName,
  });
}

function critCheck(roll, DC) {
  let step = 0;
  if (roll.total >= DC + 10) {
    step++;
  }
  if (roll.total <= DC - 10) {
    step--;
  }
  if (roll.parts[0].rolls[0].roll == 20) {
    step++;
  }
  if (roll.parts[0].rolls[0].roll == 1) {
    step--;
  }
  return step;
}

function compareAttacks(message) {
  return [...game.user.targets].map((t) => {
    //Success step meaning:
    // 3 = Critical
    // 2 = success
    // 1 = failure
    // 0 = critical failure
    let successStep = 1;

    //getting the base level of success from the roll:
    if (message.roll.total >= t.actor.data.data.attributes.ac.value) {
      successStep = 2;
    }

    //Augmenting the success by criticals and natural 20s/1s:
    successStep += critCheck(
      message.roll,
      t.actor.data.data.attributes.ac.value
    );

    //Ensuring the successStep doesn't somehow break the system catastrophically?
    successStep = Math.clamp(successStep, 0, 3);
    return successStep;
  });

  //Determining permissions, and whether to show result or not:
  if (game.user.targets.size > 0) {
    let chatData = {
      user: game.user._id,
      content: compiledMessage,
    };
    showResults(chatData);
  }
}
