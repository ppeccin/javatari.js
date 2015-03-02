/**
 * Created by ppeccin on 16/02/2015.
 */

JavatariLoader = {

    loadProjectFiles: function (path) {
        var containerTag = document.getElementsByTagName("head")[0];
        for (var i = 0; i < this.projectFiles.length; i++) {
            var tag = document.createElement('script');
            tag.type = "text/javascript";
            tag.async = false;
            tag.src = (path || "") + this.projectFiles[i];
            containerTag.appendChild(tag);
        }
    },

    projectFiles: [
        "javatari/JavatariParameters.js",
        "javatari/util/MD5.js",
        "javatari/util/Util.js",
        "javatari/util/jszip.min.js",
        "javatari/atari/cpu/M6502.js",
        "javatari/atari/pia/Ram.js",
        "javatari/atari/pia/Pia.js",
        "javatari/atari/tia/VideoStandard.js",
        "javatari/atari/tia/TiaVideoSignal.js",
        "javatari/atari/tia/TiaAudioSignal.js",
        "javatari/atari/tia/TiaAudioChannel.js",
        "javatari/atari/tia/Tia.js",
        "javatari/atari/console/Bus.js",
        "javatari/atari/console/Clock.js",
        "javatari/atari/controls/ConsoleControls.js",
        "javatari/atari/console/AtariConsole.js",
        "javatari/atari/cartridge/ROM.js",
        "javatari/atari/cartridge/CartridgeInfoLibrary.js",
        "javatari/atari/cartridge/Cartridge.js",
        "javatari/atari/cartridge/formats/Cartridge4K.js",
        "javatari/atari/cartridge/formats/Cartridge8K_E0.js",
        "javatari/atari/cartridge/formats/Cartridge64K_F0.js",
        "javatari/atari/cartridge/formats/Cartridge8K_FE.js",
        "javatari/atari/cartridge/formats/CartridgeBankedByMaskedRange.js",
        "javatari/atari/cartridge/formats/CartridgeBankedByBusMonitoring.js",
        "javatari/atari/cartridge/formats/Cartridge8K_512K_3F.js",
        "javatari/atari/cartridge/formats/Cartridge8K_512K_3E.js",
        "javatari/atari/cartridge/CartridgeFormats.js",
        "javatari/atari/cartridge/CartridgeDatabase.js",
        "javatari/room/controls/DOMConsoleControls.js",
        "javatari/room/screen/DOMMonitorControls.js",
        "javatari/room/screen/Monitor.js",
        "javatari/room/screen/CanvasDisplay.js",
        "javatari/room/screen/ConsolePanel.js",
        "javatari/room/speaker/WebAudioSpeaker.js",
        "javatari/room/savestate/LocalStorageSaveStateMedia.js",
        "javatari/room/cartridge/ROMLoader.js",
        "javatari/room/Room.js",
        "javatari/JavatariLauncher.js"
    ]

};

JavatariLoader.loadProjectFiles(window.JavatariPath);
