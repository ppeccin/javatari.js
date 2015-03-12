// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Emulator will load and start asynchronously
TestLoader = {
    load: function (path) {
        var containerTag = document.getElementsByTagName("head")[0];
        for (var i = 0, len = this.files.length; i < len; i++) {
            var tag = document.createElement('script');
            tag.type = "text/javascript"; tag.async = false;
            tag.src =   this.files[i];
            containerTag.appendChild(tag);
        }
    },
    files: [
        "../src/Javatari.js",
        "../src/util/MD5.js",
        "../src/util/Util.js",
        "../src/util/jszip.min.js",
        "../src/atari/cpu/M6502.js",
        "../src/atari/pia/Ram.js",
        "../src/atari/pia/Pia.js",
        "../src/atari/tia/VideoStandard.js",
        "../src/atari/tia/TiaVideoSignal.js",
        "../src/atari/tia/TiaAudioSignal.js",
        "../src/atari/tia/TiaAudioChannel.js",
        "../src/atari/tia/Tia.js",
        "../src/atari/console/Bus.js",
        "../src/atari/console/Clock.js",
        "../src/atari/controls/ConsoleControls.js",
        "../src/atari/console/AtariConsole.js",
        "../src/atari/cartridge/ROM.js",
        "../src/atari/cartridge/CartridgeInfoLibrary.js",
        "../src/atari/cartridge/Cartridge.js",
        "../src/atari/cartridge/formats/Cartridge4K.js",
        "../src/atari/cartridge/formats/Cartridge2K_CV.js",
        "../src/atari/cartridge/formats/CartridgeBankedByMaskedRange.js",
        "../src/atari/cartridge/formats/Cartridge8K_E0.js",
        "../src/atari/cartridge/formats/Cartridge64K_F0.js",
        "../src/atari/cartridge/formats/Cartridge8K_FE.js",
        "../src/atari/cartridge/formats/Cartridge16K_E7.js",
        "../src/atari/cartridge/formats/Cartridge10K_DPCa.js",
        "../src/atari/cartridge/formats/Cartridge24K_28K_32K_FA2.js",
        "../src/atari/cartridge/formats/CartridgeBankedByBusMonitoring.js",
        "../src/atari/cartridge/formats/Cartridge8K_512K_3F.js",
        "../src/atari/cartridge/formats/Cartridge8K_512K_3E.js",
        "../src/atari/cartridge/formats/Cartridge8K_256K_SB.js",
        "../src/atari/cartridge/formats/Cartridge8K_64K_AR.js",
        "../src/atari/cartridge/formats/Cartridge64K_X07.js",
        "../src/atari/cartridge/formats/Cartridge8K_0840.js",
        "../src/atari/cartridge/formats/Cartridge8K_UA.js",
        "../src/atari/cartridge/CartridgeFormats.js",
        "../src/atari/cartridge/CartridgeDatabase.js",
        "../src/room/controls/DOMConsoleControls.js",
        "../src/room/screen/DOMMonitorControls.js",
        "../src/room/screen/Monitor.js",
        "../src/room/screen/CanvasDisplay.js",
        "../src/room/screen/ConsolePanel.js",
        "../src/room/speaker/WebAudioSpeaker.js",
        "../src/room/savestate/LocalStorageSaveStateMedia.js",
        "../src/room/cartridge/ROMLoader.js",
        "../src/room/Room.js",
        "../src/room/Launch.js",
        "TestParameters.js"
    ]
};

TestLoader.load();

delete TestLoader;

