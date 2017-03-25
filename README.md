# Javatari

**Javatari** is a new cross platform Atari 2600 emulator designed for the Web.

It's great for displaying games running inside webpages. You can launch the emulator and load ROMs with a single link.
And now you can play Atari 2600 games with touch controls on your Android/iOS device, even when offline!

Please go to **http://javatari.org** to enjoy it online!

Refer to [**/doc**](https://github.com/ppeccin/javatari.js/tree/master/doc) for parameters reference and URL usage examples.
Refer to [**/release**](https://github.com/ppeccin/javatari.js/tree/master/release) for stable release files and deployment examples.

#### New in Version 4.0

- Support for mobile iOS and Android devices
- Finally enjoy Atari 2600 games on your iPhone/iPad!
- Customizable Touch Controls, with Haptic feedback
- Install as a WebApp on iOS/Android/Desktop, then run offline!
- Open files from local storage, iCloud, Google Drive, Dropbox, web links 
- Higher resolution GUI for high-density displays, Retina displays
- Menu navigation by keys. Easy GUI switches for most used options

### Features

- Cross platform HTML5/JS. Runs in any Browser, tested in Chrome/Firefox/Safari
- Finally enjoy Atari 2600 games on your iPhone/iPad
- Customizable Touch Controls for mobile devices (iOS, Android)
- Real Atari 2600 Console panel for a nostalgic feel!
- Install as a WebApp, then run offline
- Put Atari 2600 games in webpages easily
- Show games running with a single link to the Javatari page
- Drag & Drop system for loading files
- Savestates support. Export and share Savestate files
- Fully customizable Joysticks, Joykeys and Touch controllers
- Adjustable speed, Pause and Frame-by-frame advance
- Screen Capture and Debug modes
- Resizable Screen, Full Screen mode
- Javascript API for loading ROMs and Console control

## Javatari Configuration and Launch Options

Several parameters are available for customizing the emulator. They can be changed either directly in Javascript if you are hosting the emulator in your own page, or via URL Query Parameters if you are creating links or bookmarks to open the emulator, or just using it in your browser.

All parameters are in the form of properties in the global object `Javatari`. Just set these object properties in Javascript, or use URL Query parameter/value pairs. For example:

```
Javatari.ROM = "files/Game.rom";      is the same as      http://javatari.org?ROM=files/Game.rom
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
http://javatari.org?ROM=http://gamesarchive.org/Pitfall.rom
```
- To load a game in a ZIPped ROM Image and force the ROM Format to `FA2`
```
http://javatari.org?ROM=http://gamesarchive.org/StarCastle.zip&FORMAT=FA2
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
| `SCREEN_FILTER_MODE`            |  -1                 |  Screen CRT Filter level. -2: browser default; -1: auto; 0..3: smoothing level
| `SCREEN_CRT_MODE`               |  -1                 |  Screen CRT Phosphor Effect. -1: auto; 0: off; 1: on
| `SCREEN_DEFAULT_SCALE`          |  -1                 |  Screen size. -1: auto; 0.5..N in 0.1 steps
| `SCREEN_DEFAULT_ASPECT`         |  1                  |  Screen aspect ratio (width) in 0.1 steps
| `SCREEN_CANVAS_SIZE`            |  2                  |  Internal canvas size factor. Don't change! :-)
| `SCREEN_CONTROL_BAR`            |  1                  |  Screen Bottom Bar controls. 0: on hover; 1: always
| `SCREEN_FORCE_HOST_NATIVE_FPS`  |  -1                 |  Force host native video frequency. -1: auto-detect. Don't change! :-)
| `SCREEN_VSYNCH_MODE`            |  1                  |  V-Synch mode. -1: disabled; 0: off; 1: on
| `AUDIO_MONITOR_BUFFER_BASE`     |  -1                 |  Audio buffer base size. 2: disable audio; -1: auto; 0: platform default; 1..6: base value. More buffer = more delay
| `AUDIO_MONITOR_BUFFER_SIZE`     |  -1                 |  Audio buffer size. -1: auto; 256, 512, 1024, 2048, 4096, 8192, 16384: buffer size. More buffer = more delay. Don't change! :-)
| `AUDIO_SIGNAL_BUFFER_RATIO`     |  2                  |  Internal Audio Signal buffer based on Monitor buffer
| `AUDIO_SIGNAL_ADD_FRAMES`       |  3                  |  Additional frames in internal Audio Signal buffer based on Monitor buffer
| `TOUCH_MODE`                    |  0                  |  Touch control. -1: disabled; 0: auto; 1: enabled at port 1; 2: enabled at port 2
| `RESET`                         |  0                  |  If value = 1 clear all saved data on the client

