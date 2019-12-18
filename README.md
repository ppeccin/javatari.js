# Javatari

**Javatari** is a new cross platform Atari 2600 emulator designed for the Web.

It's great for displaying games running inside webpages. You can launch the emulator and load ROMs with a single link.
And now you can play Atari 2600 games with touch controls on your Android/iOS device, even when offline!
Join friends in multiplayer games with the new NetPlay! function.

Please go to **https://javatari.org** to enjoy it online!

Refer to [**/doc**](https://github.com/ppeccin/javatari.js/tree/master/doc) for parameters reference and URL usage examples.
Refer to [**/release**](https://github.com/ppeccin/javatari.js/tree/master/release) for stable release files and deployment examples.

Atari, VCS and the Atari logo are shown here as a tribute.
All trademarks are property of their respective owners.

#### New in Version 5.0

- NetPlay! Connect several users on the same Virtual Atari Console over the internet
- Enjoy multiplayer gaming sessions with your friends online
- P2P connection with automatic network discovery, no worries with IPs and ports
- User interface for selecting Cartridge Mapper type
- Several improvements and fixes

### Features

- Cross platform HTML5/JS. Runs in any Browser, tested in Chrome/Firefox/Safari
- Support for mobile iOS and Android devices
- Finally enjoy Atari 2600 games on your iPhone/iPad
- Customizable Touch Controls for mobile devices with Haptic feedback
- Real Atari 2600 Console panel for a nostalgic feel!
- Install as a WebApp on iOS/Android/Desktop, then run offline!
- Put Atari 2600 games in webpages easily
- Show games running with a single link to the Javatari page
- Drag & Drop system for loading files
- Open files from local storage, iCloud, Google Drive, Dropbox, web links
- Savestates support. Export and share Savestate files
- Fully customizable Joysticks, Joykeys and Touch controllers
- Adjustable speed, Pause and Frame-by-frame advance
- Screen Capture and Debug modes
- Resizable Screen, Full Screen mode
- Javascript API for loading ROMs and Console control

## About the NetPlay! feature

Javatari 5.0 brings NetPlay!, in which any number of users may connect and control the same virtual Atari Console.
To access the feature, open the NetPlay! control dialog available on the System Menu (Power button).

One user must be the "Server" and start a NetPlay! Session. Just choose a name for the Session, or let the emulator generate it randomly, then hit "HOST".
Once the Session is started and active, other users may join the Session simply by entering the same Session name and hitting "JOIN".
All users connected have complete control over the machine, except that only the Server user may load/change media files (ROMs). All features of the emulator work during NetPlay!
Any Client user may leave the Session at any time, but only the Server user may end the Session completely.

Be careful not to make your Session name public! Anyone that knows your Session name will be able to join it while its active. Send the session name only to people you want to invite.
Another way of sharing your Session to users is sending them a link that will open the emulator and join the session automatically.
In the NetPlay! dialog, once you are Hosting a Session, there will be a link button on the upper right, that will generate the link and copy it to your clipboard.

**IMPORTANT:** NetPlay! performance is completely dependent on the network quality. The lower the network latency between users, the better. Higher bandwidths with higher latencies won't help much.
It uses a specialized P2P protocol, and tries to use STUN to traverse NATs/routers so users don't have to worry about IPs and opening ports. Use at your own risk! :-)

To make all this work seamlessly, Javatari uses modern Web technologies including WebRTC, which are supported by all major browsers and platforms.
Unfortunately, those technologies are still not available on Apple iOS, so NetPlay! will not work on iOS devices. Sorry but there is not much we can do about it, until Apple feels it should allow its customers to access those technologies.

## Javatari Configuration and Launch Options

Several parameters are available for customizing the emulator. They can be changed either directly in Javascript if you are hosting the emulator in your own page, or via URL Query Parameters if you are creating links or bookmarks to open the emulator, or just using it in your browser.

All parameters are in the form of properties in the global object `Javatari`. Just set these object properties in Javascript, or use URL Query parameter/value pairs. For example:

```
Javatari.CARTRIDGE_URL = "files/Game.rom";      is the same as      https://javatari.org?ROM=files/Game.rom
```

**IMPORTANT:** Any parameter setting via Javascript must be done AFTER importing the `javatari.js` file.

## Media Loading

The emulator can be set to automatically load files like ROMs images and Savestate files. Files may be compressed in ZIP or GZIP formats. Available parameters:

| Parameter | Function | Shortcut for URL form
| --- | --- | ---
| `CARTRIDGE_URL`    | URL of ROM image file to load                  | `ROM`, `CART`
| `CARTRIDGE_FORMAT` | Force a specific ROM Format                    | `FORMAT`
| `STATE_URL`        | URL of SaveState file to load                  | `STATE`, `SAVESTATE`
| `AUTODETECT_URL`   | URL of file to load with media auto-detection  | `AUTODETECT`, `AUTO`, `ANY`

### ROM Format (or Mapper Type)
The ROM Format is auto-detected. To force a format, use the `CARTRIDGE_FORMAT` parameter.
You can also put the format specification in the ROM file name, between brackets. Example: `Robotank [FE].rom`

#### Valid Formats
`4K`, `CV`, `E0`, `F0`, `FE`, `E7`, `F4`, `F6`, `F8`, `FA`, `FA2`, `FA2cu`, `EF`, `DPC`, `3F`, `3E`, `X07`, `0840`, `UA`, `SB`, `AR`

## Launch URL Examples

Javatari is great for displaying Atari 2600 games in the web. With a simple URL, you can launch the emulator and automatically load and run anything. You may combine several settings and media loading options in a single link. Here are some examples:

- To load a game in ROM format:
```
https://javatari.org?ROM=https://gamesarchive.org/Pitfall.rom
```
- To load a game in a ZIPped ROM Image and force the ROM Format to `FA2`
```
https://javatari.org?ROM=https://gamesarchive.org/StarCastle.zip&FORMAT=FA2
```

## Parameters Reference

| Parameter | Default | Description
| --- | :---: | ---
| `CARTRIDGE_URL`                 |  --                 |  URL of ROM image file to load 
| `CARTRIDGE_FORMAT`              |  --                 |  ROM Format to use. Leave unset for autodetection 
| `STATE_URL`                     |  --                 |  URL of SaveState file to load
| `AUTODETECT_URL`                |  --                 |  URL of file to load with media auto-detection
| `SCREEN_ELEMENT_ID`             |  "javatari-screen"  |  HTML Element ID to place the Emulator Screen
| `SCREEN_CONSOLE_PANEL_DISABLED` |  false              |  Hide the Console Panel controls
| `CARTRIDGE_SHOW_RECENT`         |  true               |  Show a list of recent loaded ROMs at startup
| `CARTRIDGE_LABEL_COLORS`        |  ""                 |  Space-separated colors for customised Label, Background, Border. e.g. "#f00 #000 transparent". Leave "" for defaults
| `ALLOW_URL_PARAMETERS`          |  true               |  Allows overriding any parameters via URL query parameters
| `AUTO_START`                    |  true               |  Auto-Start the emulator as soon as ready
| `AUTO_POWER_ON_DELAY`           |  1200               |  Auto-Power-ON after specified msecs. -1: no Auto-Power-ON
| `CARTRIDGE_CHANGE_DISABLED`     |  false              |  Block user from changing Cartridges
| `SCREEN_RESIZE_DISABLED`        |  false              |  Block user from changing Screen size
| `SCREEN_FULLSCREEN_MODE`        |  -1                 |  FullScreen mode. -2: disabled; -1: auto; 0: off; 1: on
| `SCREEN_FILTER_MODE`            |  -3                 |  Screen CRT Filter level. -3: user set (default auto); -2: browser default; -1: auto; 0..3: smoothing level
| `SCREEN_CRT_MODE`               |  0                  |  Screen CRT Phosphor Effect. -1: auto; 0: off; 1: on
| `SCREEN_DEFAULT_SCALE`          |  -1                 |  Screen size. -1: auto; 0.5..N in 0.1 steps
| `SCREEN_DEFAULT_ASPECT`         |  1                  |  Screen aspect ratio (width) in 0.1 steps
| `SCREEN_CANVAS_SIZE`            |  2                  |  Internal canvas size factor. Don't change! :-)
| `SCREEN_CONTROL_BAR`            |  1                  |  Screen Bottom Bar controls. 0: on hover; 1: always
| `SCREEN_FORCE_HOST_NATIVE_FPS`  |  -1                 |  Force host native video frequency. -1: auto-detect. Don't change! :-)
| `SCREEN_VSYNCH_MODE`            |  -2                 |  V-Synch mode. -2: user set (default on); -1: disabled; 0: off; 1: on
| `AUDIO_MONITOR_BUFFER_BASE`     |  -3                 |  Audio buffer base size. -3: user set (default auto); -2: disable audio; -1: auto; 0: browser default; 1..6: base value. More buffer = more delay
| `AUDIO_MONITOR_BUFFER_SIZE`     |  -1                 |  Audio buffer size. -1: auto; 256, 512, 1024, 2048, 4096, 8192, 16384: buffer size. More buffer = more delay. Don't change! :-)
| `AUDIO_SIGNAL_BUFFER_RATIO`     |  2                  |  Internal Audio Signal buffer based on Monitor buffer
| `AUDIO_SIGNAL_ADD_FRAMES`       |  3                  |  Additional frames in internal Audio Signal buffer based on Monitor buffer
| `PADDLES_MODE`                  |  -1                 |  Paddle controls. -1: auto; 0: off; 1: on
| `TOUCH_MODE`                    |  -1                 |  Touch controls. -1: auto; 0: disabled; 1: enabled; 2: enabled (swapped)
| `RESET`                         |  0                  |  If value = 1 clear all saved data on the client
| `PAGE_BACK_CSS`                 |  --                 |  CSS to modify page background color. Applied to the body element

