## Classes

<dl>
<dt><a href="#CombatTrack">CombatTrack</a></dt>
<dd><p>Attach a track or playlist to combat encounters that plays when the combat begins</p>
</dd>
<dt><a href="#CombatTrackForm">CombatTrackForm</a></dt>
<dd><p>A FormApplication for managing the combat&#39;s track</p>
</dd>
<dt><a href="#HypeTrackActorForm">HypeTrackActorForm</a></dt>
<dd><p>A FormApplication for setting the Actor&#39;s Hype Track</p>
</dd>
<dt><a href="#ItemTrack">ItemTrack</a></dt>
<dd><p>Attach a track to an item that plays when the item is rolled</p>
</dd>
<dt><a href="#ItemTrackForm">ItemTrackForm</a></dt>
<dd><p>A FormApplication for managing the item&#39;s track</p>
</dd>
<dt><a href="#Conductor">Conductor</a></dt>
<dd><p>Orchestrates (pun) module functionality</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#_checkForHypeTracksPlaylist">_checkForHypeTracksPlaylist()</a></dt>
<dd><p>Checks for the presence of the Hype Tracks playlist, creates one if none exist</p>
</dd>
<dt><a href="#_createHypeTracksPlaylist">_createHypeTracksPlaylist()</a></dt>
<dd><p>Create the Hype Tracks playlist if the create param is true</p>
</dd>
<dt><a href="#_processHype">_processHype(combat, update)</a></dt>
<dd><p>Checks for the existence of the Hype Track actor flag, then plays the track</p>
</dd>
<dt><a href="#_resumeOthers">_resumeOthers()</a></dt>
<dd><p>Resumes previously paused sounds</p>
</dd>
<dt><a href="#_getActorHypeTrack">_getActorHypeTrack(actor)</a></dt>
<dd><p>Get the Hype Track flag if it exists on an actor</p>
</dd>
<dt><a href="#_setActorHypeTrack">_setActorHypeTrack(trackId)</a></dt>
<dd><p>Sets the Hype Track</p>
</dd>
<dt><a href="#_getActorHypeFlags">_getActorHypeFlags(actor)</a> ⇒ <code>Object</code></dt>
<dd><p>Gets the Hype Flags</p>
</dd>
<dt><a href="#_setActorHypeFlags">_setActorHypeFlags(trackId)</a></dt>
<dd><p>Sets the Hype Flags</p>
</dd>
<dt><a href="#_addHypeButton">_addHypeButton(app, html, data)</a></dt>
<dd><p>Adds a button to the Actor sheet to open the Hype Track form</p>
</dd>
<dt><a href="#_openTrackForm">_openTrackForm(actor, track, options)</a></dt>
<dd><p>Opens the Hype Track form</p>
</dd>
<dt><a href="#playHype">playHype(actor)</a></dt>
<dd><p>Plays a hype track for the provided actor</p>
</dd>
<dt><a href="#_migratePlaylistMode">_migratePlaylistMode()</a></dt>
<dd></dd>
<dt><a href="#_migrateActorFlags">_migrateActorFlags()</a></dt>
<dd></dd>
<dt><a href="#_migrateItemFlags">_migrateItemFlags()</a></dt>
<dd></dd>
<dt><a href="#_migrateActorOwnedItemFlags">_migrateActorOwnedItemFlags()</a></dt>
<dd></dd>
<dt><a href="#_migrateTokenOwnedItemFlags">_migrateTokenOwnedItemFlags()</a></dt>
<dd></dd>
<dt><a href="#_addPlaylistLoopToggle">_addPlaylistLoopToggle(html)</a></dt>
<dd><p>Adds a new toggle for loop to the playlist controls</p>
</dd>
<dt><a href="#_onPreUpdatePlaylistSound">_onPreUpdatePlaylistSound(playlist, update)</a></dt>
<dd><p>PreUpdate Playlist Sound handler</p>
</dd>
<dt><a href="#_onPreCreateChatMessage">_onPreCreateChatMessage()</a></dt>
<dd><p>PreCreate Chat Message handler</p>
</dd>
<dt><a href="#_onRenderChatMessage">_onRenderChatMessage(message, html, data)</a></dt>
<dd><p>Render Chat Message handler</p>
</dd>
<dt><a href="#playCriticalSuccessFailure">playCriticalSuccessFailure(message)</a></dt>
<dd><p>Process Critical Success/Failure for a given message</p>
</dd>
<dt><a href="#checkRollSuccessFailure">checkRollSuccessFailure(roll)</a></dt>
<dd><p>Play a sound for critical success or failure on d20 rolls
Adapted from highlightCriticalSuccessFailure in the dnd5e system</p>
</dd>
<dt><a href="#_checkForCriticalPlaylist">_checkForCriticalPlaylist()</a></dt>
<dd><p>Checks for the presence of the Critical playlist, creates one if none exist</p>
</dd>
<dt><a href="#_createCriticalPlaylist">_createCriticalPlaylist(create)</a></dt>
<dd><p>Create the Critical playlist if the create param is true</p>
</dd>
<dt><a href="#_checkForFailurePlaylist">_checkForFailurePlaylist()</a></dt>
<dd><p>Checks for the presence of the Failure playlist, creates one if none exist</p>
</dd>
<dt><a href="#_createFailurePlaylist">_createFailurePlaylist(create)</a></dt>
<dd><p>Create the Failure playlist if the create param is true</p>
</dd>
<dt><a href="#getFirstActiveGM">getFirstActiveGM()</a> ⇒ <code>User</code> | <code>undefined</code></dt>
<dd><p>Gets the first (sorted by userId) active GM user</p>
</dd>
<dt><a href="#isFirstGM">isFirstGM()</a> ⇒ <code>Boolean</code></dt>
<dd><p>Checks if the current user is the first active GM user</p>
</dd>
<dt><a href="#getPlaylistSounds">getPlaylistSounds()</a></dt>
<dd><p>Get all the sounds in a specific playlist</p>
</dd>
<dt><a href="#getPlaylistSound">getPlaylistSound(trackId)</a></dt>
<dd><p>For a given trackId get the corresponding playlist sound</p>
</dd>
<dt><a href="#playTrack">playTrack(playlistId, trackId)</a></dt>
<dd><p>Play a playlist sound based on the given trackId</p>
</dd>
<dt><a href="#playPlaylist">playPlaylist(playlistId)</a></dt>
<dd><p>Play a playlist using its default playback method</p>
</dd>
<dt><a href="#findPlaylistSound">findPlaylistSound(name)</a></dt>
<dd><p>Finds a Playlist sound by its name</p>
</dd>
<dt><a href="#playSoundByName">playSoundByName(name, options)</a></dt>
<dd><p>Play a sound by its name rather than id</p>
</dd>
<dt><a href="#pauseSounds">pauseSounds(sounds)</a></dt>
<dd><p>Pauses a playing howl</p>
</dd>
<dt><a href="#resumeSounds">resumeSounds(sounds)</a></dt>
<dd><p>Resume playback on one or many howls</p>
</dd>
<dt><a href="#pauseAll">pauseAll()</a></dt>
<dd><p>Pauses all active playlist sounds</p>
</dd>
</dl>

<a name="CombatTrack"></a>

## CombatTrack
Attach a track or playlist to combat encounters that plays when the combat begins

**Kind**: global class  

* [CombatTrack](#CombatTrack)
    * _instance_
        * [._checkForCombatTracksPlaylist()](#CombatTrack+_checkForCombatTracksPlaylist)
        * [._createCombatTracksPlaylist()](#CombatTrack+_createCombatTracksPlaylist)
        * [._getCombatTrack(combat, update)](#CombatTrack+_getCombatTrack)
        * [._stopCombatTrack(combat)](#CombatTrack+_stopCombatTrack)
        * [._resumeOtherSounds()](#CombatTrack+_resumeOtherSounds)
        * [.setCombatFlags(combat, playlistId, trackId)](#CombatTrack+setCombatFlags)
        * [._setDefaultCombatTrack(defaults)](#CombatTrack+_setDefaultCombatTrack)
    * _static_
        * [._checkCombatStart(combat, update, options)](#CombatTrack._checkCombatStart)
        * [._addCombatTrackButton(app, html, data)](#CombatTrack._addCombatTrackButton)
        * [._onCombatTrackButtonClick(event)](#CombatTrack._onCombatTrackButtonClick)
        * [._openTrackForm(combat, track, options)](#CombatTrack._openTrackForm)
        * [.getCombatFlags(combat)](#CombatTrack.getCombatFlags) ⇒ <code>Object</code>

<a name="CombatTrack+_checkForCombatTracksPlaylist"></a>

### combatTrack.\_checkForCombatTracksPlaylist()
Checks for the presence of the Hype Tracks playlist, creates one if none exist

**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  
<a name="CombatTrack+_createCombatTracksPlaylist"></a>

### combatTrack.\_createCombatTracksPlaylist()
Create the Hype Tracks playlist if the create param is true

**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  
<a name="CombatTrack+_getCombatTrack"></a>

### combatTrack.\_getCombatTrack(combat, update)
Checks for the existence of a Combat Track and initiates playback

**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  

| Param |
| --- |
| combat | 
| update | 

<a name="CombatTrack+_stopCombatTrack"></a>

### combatTrack.\_stopCombatTrack(combat)
Stops any playing combat tracks

**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type |
| --- | --- |
| combat | <code>\*</code> | 

<a name="CombatTrack+_resumeOtherSounds"></a>

### combatTrack.\_resumeOtherSounds()
Resume any paused Sounds

**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  
<a name="CombatTrack+setCombatFlags"></a>

### combatTrack.setCombatFlags(combat, playlistId, trackId)
Sets the Combat Track flags on an Combat instance
Handled as an update so all flags can be set at once

**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type | Description |
| --- | --- | --- |
| combat | <code>Object</code> | the combat to set flags on |
| playlistId | <code>String</code> | the playlist id to set |
| trackId | <code>String</code> | the trackId or playback mode to set |

<a name="CombatTrack+_setDefaultCombatTrack"></a>

### combatTrack.\_setDefaultCombatTrack(defaults)
**Kind**: instance method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type |
| --- | --- |
| defaults | <code>\*</code> | 

<a name="CombatTrack._checkCombatStart"></a>

### CombatTrack.\_checkCombatStart(combat, update, options)
Checks the updating Combat instance to determine if it just starting (round 0 => round 1)

**Kind**: static method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type |
| --- | --- |
| combat | <code>\*</code> | 
| update | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="CombatTrack._addCombatTrackButton"></a>

### CombatTrack.\_addCombatTrackButton(app, html, data)
Adds a button to the Combat sheet to open the Combat Track form

**Kind**: static method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type |
| --- | --- |
| app | <code>Object</code> | 
| html | <code>Object</code> | 
| data | <code>Object</code> | 

<a name="CombatTrack._onCombatTrackButtonClick"></a>

### CombatTrack.\_onCombatTrackButtonClick(event)
Click handler for Combat Track button

**Kind**: static method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type |
| --- | --- |
| event | <code>\*</code> | 

<a name="CombatTrack._openTrackForm"></a>

### CombatTrack.\_openTrackForm(combat, track, options)
Builds data object and opens the Combat Track form

**Kind**: static method of [<code>CombatTrack</code>](#CombatTrack)  

| Param | Type | Description |
| --- | --- | --- |
| combat | <code>Object</code> | the reference combat |
| track | <code>String</code> | any existing track |
| options | <code>Object</code> | form options |

<a name="CombatTrack.getCombatFlags"></a>

### CombatTrack.getCombatFlags(combat) ⇒ <code>Object</code>
Gets the combat Track flags on an combat

**Kind**: static method of [<code>CombatTrack</code>](#CombatTrack)  
**Returns**: <code>Object</code> - flags - an object containing the flags  

| Param | Type | Description |
| --- | --- | --- |
| combat | <code>Object</code> | the combat to get flags from |

<a name="CombatTrackForm"></a>

## CombatTrackForm
A FormApplication for managing the combat's track

**Kind**: global class  

* [CombatTrackForm](#CombatTrackForm)
    * _instance_
        * [.getData()](#CombatTrackForm+getData)
        * [._updateObject(event, formData)](#CombatTrackForm+_updateObject)
        * [.activateListeners(html)](#CombatTrackForm+activateListeners)
    * _static_
        * [.defaultOptions](#CombatTrackForm.defaultOptions)

<a name="CombatTrackForm+getData"></a>

### combatTrackForm.getData()
Provide data to the handlebars template

**Kind**: instance method of [<code>CombatTrackForm</code>](#CombatTrackForm)  
<a name="CombatTrackForm+_updateObject"></a>

### combatTrackForm.\_updateObject(event, formData)
Executes on form submission.
Set the Hype Track flag on the specified Actor

**Kind**: instance method of [<code>CombatTrackForm</code>](#CombatTrackForm)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>Object</code> | the form submission event |
| formData | <code>Object</code> | the form data |

<a name="CombatTrackForm+activateListeners"></a>

### combatTrackForm.activateListeners(html)
Activates listeners on the form html

**Kind**: instance method of [<code>CombatTrackForm</code>](#CombatTrackForm)  

| Param | Type |
| --- | --- |
| html | <code>\*</code> | 

<a name="CombatTrackForm.defaultOptions"></a>

### CombatTrackForm.defaultOptions
Default Options for this FormApplication

**Kind**: static property of [<code>CombatTrackForm</code>](#CombatTrackForm)  
<a name="HypeTrackActorForm"></a>

## HypeTrackActorForm
A FormApplication for setting the Actor's Hype Track

**Kind**: global class  

* [HypeTrackActorForm](#HypeTrackActorForm)
    * _instance_
        * [.getData()](#HypeTrackActorForm+getData)
        * [._updateObject(event, formData)](#HypeTrackActorForm+_updateObject)
        * [.activateListeners(html)](#HypeTrackActorForm+activateListeners)
        * [._onPlaylistChange(event)](#HypeTrackActorForm+_onPlaylistChange)
    * _static_
        * [.defaultOptions](#HypeTrackActorForm.defaultOptions)

<a name="HypeTrackActorForm+getData"></a>

### hypeTrackActorForm.getData()
Provide data to the handlebars template

**Kind**: instance method of [<code>HypeTrackActorForm</code>](#HypeTrackActorForm)  
<a name="HypeTrackActorForm+_updateObject"></a>

### hypeTrackActorForm.\_updateObject(event, formData)
Executes on form submission.
Set the Hype Track flag on the specified Actor

**Kind**: instance method of [<code>HypeTrackActorForm</code>](#HypeTrackActorForm)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>Object</code> | the form submission event |
| formData | <code>Object</code> | the form data |

<a name="HypeTrackActorForm+activateListeners"></a>

### hypeTrackActorForm.activateListeners(html)
Activates listeners on the form html

**Kind**: instance method of [<code>HypeTrackActorForm</code>](#HypeTrackActorForm)  

| Param | Type |
| --- | --- |
| html | <code>\*</code> | 

<a name="HypeTrackActorForm+_onPlaylistChange"></a>

### hypeTrackActorForm.\_onPlaylistChange(event)
Playlist select change handler

**Kind**: instance method of [<code>HypeTrackActorForm</code>](#HypeTrackActorForm)  

| Param | Type |
| --- | --- |
| event | <code>\*</code> | 

<a name="HypeTrackActorForm.defaultOptions"></a>

### HypeTrackActorForm.defaultOptions
Default Options for this FormApplication

**Kind**: static property of [<code>HypeTrackActorForm</code>](#HypeTrackActorForm)  
<a name="ItemTrack"></a>

## ItemTrack
Attach a track to an item that plays when the item is rolled

**Kind**: global class  

* [ItemTrack](#ItemTrack)
    * [._checkForItemTracksPlaylist()](#ItemTrack+_checkForItemTracksPlaylist)
    * [._createItemTracksPlaylist()](#ItemTrack+_createItemTracksPlaylist)
    * [._chatMessageHandler(message, html, data)](#ItemTrack+_chatMessageHandler)
    * [._addItemTrackButton(app, html, data)](#ItemTrack+_addItemTrackButton)
    * [._openTrackForm(item, track, options)](#ItemTrack+_openTrackForm)
    * [.getItemFlags(item)](#ItemTrack+getItemFlags) ⇒ <code>Promise</code>
    * [.setItemFlags(item, playlistId, trackId)](#ItemTrack+setItemFlags)
    * [._setChatMessageFlag(message)](#ItemTrack+_setChatMessageFlag)

<a name="ItemTrack+_checkForItemTracksPlaylist"></a>

### itemTrack.\_checkForItemTracksPlaylist()
Checks for the presence of the Hype Tracks playlist, creates one if none exist

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  
<a name="ItemTrack+_createItemTracksPlaylist"></a>

### itemTrack.\_createItemTracksPlaylist()
Create the Hype Tracks playlist if the create param is true

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  
<a name="ItemTrack+_chatMessageHandler"></a>

### itemTrack.\_chatMessageHandler(message, html, data)
Handles module logic for chat message card

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Object</code> | the chat message object |
| html | <code>Object</code> | the jquery object |
| data | <code>Object</code> | the data in the message update |

<a name="ItemTrack+_addItemTrackButton"></a>

### itemTrack.\_addItemTrackButton(app, html, data)
Adds a button to the Item sheet to open the Item Track form

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  

| Param | Type |
| --- | --- |
| app | <code>Object</code> | 
| html | <code>Object</code> | 
| data | <code>Object</code> | 

<a name="ItemTrack+_openTrackForm"></a>

### itemTrack.\_openTrackForm(item, track, options)
Builds data object and opens the Item Track form

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  

| Param | Type | Description |
| --- | --- | --- |
| item | <code>Object</code> | the reference item |
| track | <code>String</code> | any existing track |
| options | <code>Object</code> | form options |

<a name="ItemTrack+getItemFlags"></a>

### itemTrack.getItemFlags(item) ⇒ <code>Promise</code>
Gets the Item Track flags on an Item

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  
**Returns**: <code>Promise</code> - flags - an object containing the flags  

| Param | Type | Description |
| --- | --- | --- |
| item | <code>Object</code> | the item to get flags from |

<a name="ItemTrack+setItemFlags"></a>

### itemTrack.setItemFlags(item, playlistId, trackId)
Sets the Item Track flags on an Item instance
Handled as an update so all flags can be set at once

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  

| Param | Type | Description |
| --- | --- | --- |
| item | <code>Object</code> | the item to set flags on |
| playlistId | <code>String</code> | the playlist id to set |
| trackId | <code>String</code> | the trackId or playback mode to set |

<a name="ItemTrack+_setChatMessageFlag"></a>

### itemTrack.\_setChatMessageFlag(message)
Sets a flag on a chat message

**Kind**: instance method of [<code>ItemTrack</code>](#ItemTrack)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Object</code> | the message to set a flag on |

<a name="ItemTrackForm"></a>

## ItemTrackForm
A FormApplication for managing the item's track

**Kind**: global class  

* [ItemTrackForm](#ItemTrackForm)
    * _instance_
        * [.getData()](#ItemTrackForm+getData)
        * [._updateObject(event, formData)](#ItemTrackForm+_updateObject)
        * [.activateListeners(html)](#ItemTrackForm+activateListeners)
    * _static_
        * [.defaultOptions](#ItemTrackForm.defaultOptions)

<a name="ItemTrackForm+getData"></a>

### itemTrackForm.getData()
Provide data to the handlebars template

**Kind**: instance method of [<code>ItemTrackForm</code>](#ItemTrackForm)  
<a name="ItemTrackForm+_updateObject"></a>

### itemTrackForm.\_updateObject(event, formData)
Executes on form submission.
Set the Hype Track flag on the specified Actor

**Kind**: instance method of [<code>ItemTrackForm</code>](#ItemTrackForm)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>Object</code> | the form submission event |
| formData | <code>Object</code> | the form data |

<a name="ItemTrackForm+activateListeners"></a>

### itemTrackForm.activateListeners(html)
Activates listeners on the form html

**Kind**: instance method of [<code>ItemTrackForm</code>](#ItemTrackForm)  

| Param | Type |
| --- | --- |
| html | <code>\*</code> | 

<a name="ItemTrackForm.defaultOptions"></a>

### ItemTrackForm.defaultOptions
Default Options for this FormApplication

**Kind**: static property of [<code>ItemTrackForm</code>](#ItemTrackForm)  
<a name="Conductor"></a>

## Conductor
Orchestrates (pun) module functionality

**Kind**: global class  

* [Conductor](#Conductor)
    * [._hookOnInit()](#Conductor._hookOnInit)
    * [._hookOnReady()](#Conductor._hookOnReady)
    * [._initHookRegistrations()](#Conductor._initHookRegistrations)
    * [._readyHookRegistrations()](#Conductor._readyHookRegistrations)
    * [._hookOnPreUpdatePlaylist()](#Conductor._hookOnPreUpdatePlaylist)
    * [._hookOnPreUpdatePlaylistSound()](#Conductor._hookOnPreUpdatePlaylistSound)
    * [._hookOnPreCreateChatMessage()](#Conductor._hookOnPreCreateChatMessage)
    * [._hookOnPreUpdateCombat()](#Conductor._hookOnPreUpdateCombat)
    * [._hookOnUpdateCombat()](#Conductor._hookOnUpdateCombat)
    * [._hookOnDeleteCombat()](#Conductor._hookOnDeleteCombat)
    * [._hookOnRenderActorSheet()](#Conductor._hookOnRenderActorSheet)
    * [._hookOnRenderChatMessage()](#Conductor._hookOnRenderChatMessage)
    * [._hookOnRenderPlaylistDirectory()](#Conductor._hookOnRenderPlaylistDirectory)
    * [._hookOnRenderCombatTrackerConfig()](#Conductor._hookOnRenderCombatTrackerConfig)
    * [._hookOnRenderItemSheet()](#Conductor._hookOnRenderItemSheet)

<a name="Conductor._hookOnInit"></a>

### Conductor.\_hookOnInit()
Init Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnReady"></a>

### Conductor.\_hookOnReady()
Ready Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._initHookRegistrations"></a>

### Conductor.\_initHookRegistrations()
Init Hook Registrations

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._readyHookRegistrations"></a>

### Conductor.\_readyHookRegistrations()
Ready Hook Registrations

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnPreUpdatePlaylist"></a>

### Conductor.\_hookOnPreUpdatePlaylist()
PreUpdate Playlist Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnPreUpdatePlaylistSound"></a>

### Conductor.\_hookOnPreUpdatePlaylistSound()
PreUpdate Playlist Sound Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnPreCreateChatMessage"></a>

### Conductor.\_hookOnPreCreateChatMessage()
PreCreate Chat Message Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnPreUpdateCombat"></a>

### Conductor.\_hookOnPreUpdateCombat()
PreUpdate Combat Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnUpdateCombat"></a>

### Conductor.\_hookOnUpdateCombat()
Update Combat Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnDeleteCombat"></a>

### Conductor.\_hookOnDeleteCombat()
Delete Combat Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnRenderActorSheet"></a>

### Conductor.\_hookOnRenderActorSheet()
Render Actor SheetsHook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnRenderChatMessage"></a>

### Conductor.\_hookOnRenderChatMessage()
RenderChatMessage Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnRenderPlaylistDirectory"></a>

### Conductor.\_hookOnRenderPlaylistDirectory()
RenderPlaylistDirectory Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnRenderCombatTrackerConfig"></a>

### Conductor.\_hookOnRenderCombatTrackerConfig()
Render CombatTrackerConfig Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="Conductor._hookOnRenderItemSheet"></a>

### Conductor.\_hookOnRenderItemSheet()
Render Item Sheet Hook

**Kind**: static method of [<code>Conductor</code>](#Conductor)  
<a name="_checkForHypeTracksPlaylist"></a>

## \_checkForHypeTracksPlaylist()
Checks for the presence of the Hype Tracks playlist, creates one if none exist

**Kind**: global function  
<a name="_createHypeTracksPlaylist"></a>

## \_createHypeTracksPlaylist()
Create the Hype Tracks playlist if the create param is true

**Kind**: global function  
<a name="_processHype"></a>

## \_processHype(combat, update)
Checks for the existence of the Hype Track actor flag, then plays the track

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| combat | <code>Object</code> | the combat instance |
| update | <code>\*</code> | the update data |

<a name="_resumeOthers"></a>

## \_resumeOthers()
Resumes previously paused sounds

**Kind**: global function  
<a name="_getActorHypeTrack"></a>

## \_getActorHypeTrack(actor)
Get the Hype Track flag if it exists on an actor

**Kind**: global function  

| Param | Type |
| --- | --- |
| actor | <code>\*</code> | 

<a name="_setActorHypeTrack"></a>

## \_setActorHypeTrack(trackId)
Sets the Hype Track

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| trackId | <code>Number</code> | Id of the track in the playlist |

<a name="_getActorHypeFlags"></a>

## \_getActorHypeFlags(actor) ⇒ <code>Object</code>
Gets the Hype Flags

**Kind**: global function  
**Returns**: <code>Object</code> - the Hype flags object  

| Param | Type |
| --- | --- |
| actor | <code>Actor</code> | 

<a name="_setActorHypeFlags"></a>

## \_setActorHypeFlags(trackId)
Sets the Hype Flags

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| trackId | <code>String</code> | Id of the track in the playlist |

<a name="_addHypeButton"></a>

## \_addHypeButton(app, html, data)
Adds a button to the Actor sheet to open the Hype Track form

**Kind**: global function  

| Param | Type |
| --- | --- |
| app | <code>Object</code> | 
| html | <code>Object</code> | 
| data | <code>Object</code> | 

<a name="_openTrackForm"></a>

## \_openTrackForm(actor, track, options)
Opens the Hype Track form

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| actor | <code>Object</code> | the actor object |
| track | <code>Object</code> | any existing track for this actor |
| options | <code>Object</code> | form options |

<a name="playHype"></a>

## playHype(actor)
Plays a hype track for the provided actor

**Kind**: global function  

| Param | Type |
| --- | --- |
| actor | <code>\*</code> | 

<a name="_migratePlaylistMode"></a>

## \_migratePlaylistMode()
**Kind**: global function  
<a name="_migrateActorFlags"></a>

## \_migrateActorFlags()
**Kind**: global function  
<a name="_migrateItemFlags"></a>

## \_migrateItemFlags()
**Kind**: global function  
<a name="_migrateActorOwnedItemFlags"></a>

## \_migrateActorOwnedItemFlags()
**Kind**: global function  
<a name="_migrateTokenOwnedItemFlags"></a>

## \_migrateTokenOwnedItemFlags()
**Kind**: global function  
<a name="_addPlaylistLoopToggle"></a>

## \_addPlaylistLoopToggle(html)
Adds a new toggle for loop to the playlist controls

**Kind**: global function  

| Param | Type |
| --- | --- |
| html | <code>\*</code> | 

<a name="_onPreUpdatePlaylistSound"></a>

## \_onPreUpdatePlaylistSound(playlist, update)
PreUpdate Playlist Sound handler

**Kind**: global function  
**Todo**

- [ ] maybe return early if no flag set?


| Param | Type |
| --- | --- |
| playlist | <code>\*</code> | 
| update | <code>\*</code> | 

<a name="_onPreCreateChatMessage"></a>

## \_onPreCreateChatMessage()
PreCreate Chat Message handler

**Kind**: global function  
<a name="_onRenderChatMessage"></a>

## \_onRenderChatMessage(message, html, data)
Render Chat Message handler

**Kind**: global function  

| Param | Type |
| --- | --- |
| message | <code>\*</code> | 
| html | <code>\*</code> | 
| data | <code>\*</code> | 

<a name="playCriticalSuccessFailure"></a>

## playCriticalSuccessFailure(message)
Process Critical Success/Failure for a given message

**Kind**: global function  

| Param | Type |
| --- | --- |
| message | <code>\*</code> | 

<a name="checkRollSuccessFailure"></a>

## checkRollSuccessFailure(roll)
Play a sound for critical success or failure on d20 rolls
Adapted from highlightCriticalSuccessFailure in the dnd5e system

**Kind**: global function  

| Param | Type |
| --- | --- |
| roll | <code>\*</code> | 

<a name="_checkForCriticalPlaylist"></a>

## \_checkForCriticalPlaylist()
Checks for the presence of the Critical playlist, creates one if none exist

**Kind**: global function  
<a name="_createCriticalPlaylist"></a>

## \_createCriticalPlaylist(create)
Create the Critical playlist if the create param is true

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| create | <code>Boolean</code> | whether or not to create the playlist |

<a name="_checkForFailurePlaylist"></a>

## \_checkForFailurePlaylist()
Checks for the presence of the Failure playlist, creates one if none exist

**Kind**: global function  
<a name="_createFailurePlaylist"></a>

## \_createFailurePlaylist(create)
Create the Failure playlist if the create param is true

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| create | <code>Boolean</code> | whether or not to create the playlist |

<a name="getFirstActiveGM"></a>

## getFirstActiveGM() ⇒ <code>User</code> \| <code>undefined</code>
Gets the first (sorted by userId) active GM user

**Kind**: global function  
**Returns**: <code>User</code> \| <code>undefined</code> - the GM user document or undefined if none found  
<a name="isFirstGM"></a>

## isFirstGM() ⇒ <code>Boolean</code>
Checks if the current user is the first active GM user

**Kind**: global function  
**Returns**: <code>Boolean</code> - Boolean indicating whether the user is the first active GM or not  
<a name="getPlaylistSounds"></a>

## getPlaylistSounds()
Get all the sounds in a specific playlist

**Kind**: global function  
<a name="getPlaylistSound"></a>

## getPlaylistSound(trackId)
For a given trackId get the corresponding playlist sound

**Kind**: global function  

| Param | Type |
| --- | --- |
| trackId | <code>String</code> | 

<a name="playTrack"></a>

## playTrack(playlistId, trackId)
Play a playlist sound based on the given trackId

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| playlistId | <code>String</code> | the playlist id |
| trackId | <code>String</code> | the track Id or playback mode |

<a name="playPlaylist"></a>

## playPlaylist(playlistId)
Play a playlist using its default playback method

**Kind**: global function  

| Param | Type |
| --- | --- |
| playlistId | <code>String</code> | 

<a name="findPlaylistSound"></a>

## findPlaylistSound(name)
Finds a Playlist sound by its name

**Kind**: global function  

| Param | Type |
| --- | --- |
| name | <code>\*</code> | 

<a name="playSoundByName"></a>

## playSoundByName(name, options)
Play a sound by its name rather than id

**Kind**: global function  

| Param | Type |
| --- | --- |
| name | <code>\*</code> | 
| options | <code>\*</code> | 

<a name="pauseSounds"></a>

## pauseSounds(sounds)
Pauses a playing howl

**Kind**: global function  

| Param | Type |
| --- | --- |
| sounds | <code>\*</code> | 

<a name="resumeSounds"></a>

## resumeSounds(sounds)
Resume playback on one or many howls

**Kind**: global function  

| Param | Type |
| --- | --- |
| sounds | <code>\*</code> | 

<a name="pauseAll"></a>

## pauseAll()
Pauses all active playlist sounds

**Kind**: global function  
