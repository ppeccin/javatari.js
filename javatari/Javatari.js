// Copyright 2015 by Paulo Augusto Peccin. See licence.txt distributed with this file.

// Main Emulator parameters. You may change any of these after loading this script
Javatari = {

    ROM_AUTO_LOAD_URL:              "",                         // Full or relative URL of ROM
    AUTO_LAUNCH:                    true,                       // false = launch emulator manually with Javatari.launch()
    SCREEN_ELEMENT_ID:              "javatari-screen",
    CONSOLE_PANEL_ELEMENT_ID:       "javatari-console-panel",
    CARTRIDGE_CHANGE_DISABLED:      false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    PADDLES_MODE:                   -1,                         // -1 = auto, 0 = off, 1 = 0n
    SCREEN_CRT_MODE:                -1,                         // -1 = auto, 0 .. 4 = mode
    SCREEN_OPENING_SIZE:            2,                          // 1 .. 4
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover, 2 = Legacy
    SCREEN_NATURAL_FPS:             60,                         // 60, 50 fps
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192
    IMAGES_PATH:                    "javatari/room/screen/images/"

};

// Emulator will load and start asynchronously
Javatari.loader = {
    load: function (path) {
        var containerTag = document.getElementsByTagName("head")[0];
        for (var i = 0, len = this.files.length; i < len; i++) {
            var tag = document.createElement('script');
            tag.type = "text/javascript"; tag.async = false;
            tag.src = path + this.files[i];
            containerTag.appendChild(tag);
        }
    },
    files: [
        "/util/MD5.js",
        "/util/Util.js",
        "/util/jszip.min.js",
        "/atari/cpu/M6502.js",
        "/atari/pia/Ram.js",
        "/atari/pia/Pia.js",
        "/atari/tia/VideoStandard.js",
        "/atari/tia/TiaVideoSignal.js",
        "/atari/tia/TiaAudioSignal.js",
        "/atari/tia/TiaAudioChannel.js",
        "/atari/tia/Tia.js",
        "/atari/console/Bus.js",
        "/atari/console/Clock.js",
        "/atari/controls/ConsoleControls.js",
        "/atari/console/AtariConsole.js",
        "/atari/cartridge/ROM.js",
        "/atari/cartridge/CartridgeInfoLibrary.js",
        "/atari/cartridge/Cartridge.js",
        "/atari/cartridge/formats/Cartridge4K.js",
        "/atari/cartridge/formats/Cartridge2K_CV.js",
        "/atari/cartridge/formats/CartridgeBankedByMaskedRange.js",
        "/atari/cartridge/formats/Cartridge8K_E0.js",
        "/atari/cartridge/formats/Cartridge64K_F0.js",
        "/atari/cartridge/formats/Cartridge8K_FE.js",
        "/atari/cartridge/formats/Cartridge16K_E7.js",
        "/atari/cartridge/formats/Cartridge10K_DPCa.js",
        "/atari/cartridge/formats/Cartridge24K_28K_32K_FA2.js",
        "/atari/cartridge/formats/CartridgeBankedByBusMonitoring.js",
        "/atari/cartridge/formats/Cartridge8K_512K_3F.js",
        "/atari/cartridge/formats/Cartridge8K_512K_3E.js",
        "/atari/cartridge/formats/Cartridge8K_256K_SB.js",
        "/atari/cartridge/formats/Cartridge8K_64K_AR.js",
        "/atari/cartridge/formats/Cartridge64K_X07.js",
        "/atari/cartridge/formats/Cartridge8K_0840.js",
        "/atari/cartridge/formats/Cartridge8K_UA.js",
        "/atari/cartridge/CartridgeFormats.js",
        "/atari/cartridge/CartridgeDatabase.js",
        "/room/controls/DOMConsoleControls.js",
        "/room/screen/DOMMonitorControls.js",
        "/room/screen/Monitor.js",
        "/room/screen/CanvasDisplay.js",
        "/room/screen/ConsolePanel.js",
        "/room/speaker/WebAudioSpeaker.js",
        "/room/savestate/LocalStorageSaveStateMedia.js",
        "/room/cartridge/ROMLoader.js",
        "/room/Room.js",
        "/room/Launcher.js"
    ]
};
Javatari.loader.load(window.JavatariPath || "javatari");
delete Javatari.loader;
