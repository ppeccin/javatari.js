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
        "../main/Javatari.js",
        "../main/util/MD5.js",
        "../main/util/Util.js",
        "../main/util/jszip.min.js",
        "../main/atari/cpu/M6502.js",
        "../main/atari/pia/Ram.js",
        "../main/atari/pia/Pia.js",
        "../main/atari/tia/VideoStandard.js",
        "../main/atari/tia/TiaVideoSignal.js",
        "../main/atari/tia/TiaAudioSignal.js",
        "../main/atari/tia/TiaAudioChannel.js",
        "../main/atari/tia/Tia.js",
        "../main/atari/console/Bus.js",
        "../main/atari/console/Clock.js",
        "../main/atari/controls/ConsoleControls.js",
        "../main/atari/console/AtariConsole.js",
        "../main/atari/cartridge/ROM.js",
        "../main/atari/cartridge/CartridgeInfoLibrary.js",
        "../main/atari/cartridge/Cartridge.js",
        "../main/atari/cartridge/formats/Cartridge4K.js",
        "../main/atari/cartridge/formats/Cartridge2K_CV.js",
        "../main/atari/cartridge/formats/CartridgeBankedByMaskedRange.js",
        "../main/atari/cartridge/formats/Cartridge8K_E0.js",
        "../main/atari/cartridge/formats/Cartridge64K_F0.js",
        "../main/atari/cartridge/formats/Cartridge8K_FE.js",
        "../main/atari/cartridge/formats/Cartridge16K_E7.js",
        "../main/atari/cartridge/formats/Cartridge10K_DPCa.js",
        "../main/atari/cartridge/formats/Cartridge24K_28K_32K_FA2.js",
        "../main/atari/cartridge/formats/CartridgeBankedByBusMonitoring.js",
        "../main/atari/cartridge/formats/Cartridge8K_512K_3F.js",
        "../main/atari/cartridge/formats/Cartridge8K_512K_3E.js",
        "../main/atari/cartridge/formats/Cartridge8K_256K_SB.js",
        "../main/atari/cartridge/formats/Cartridge8K_64K_AR.js",
        "../main/atari/cartridge/formats/Cartridge64K_X07.js",
        "../main/atari/cartridge/formats/Cartridge8K_0840.js",
        "../main/atari/cartridge/formats/Cartridge8K_UA.js",
        "../main/atari/cartridge/CartridgeFormats.js",
        "../main/atari/cartridge/CartridgeDatabase.js",
        "../main/room/controls/DOMConsoleControls.js",
        "../main/room/screen/DOMMonitorControls.js",
        "../main/room/screen/Monitor.js",
        "../main/room/screen/CanvasDisplay.js",
        "../main/room/screen/ConsolePanel.js",
        "../main/room/speaker/WebAudioSpeaker.js",
        "../main/room/savestate/LocalStorageSaveStateMedia.js",
        "../main/room/cartridge/ROMLoader.js",
        "../main/room/Room.js",
        "../main/room/Launch.js",
        "TestParameters.js"
    ]
};

TestLoader.load();

delete TestLoader;

