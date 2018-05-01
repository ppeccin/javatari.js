module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release/stable/5.0"],
            finish: ["temp"]
        },

        concat: {
            emuPart: {
                src: [
                    "src/main/room/screen/FullScreenSetup.js",
                    "src/main/util/Util.js",
                    "src/main/util/MD5.js",
                    "src/main/util/ZIP.js",
                    "src/main/util/EmbeddedFiles.js",
                    "src/main/util/MultiDownloader.js",
                    "src/main/util/MultiFileReader.js",
                    "src/main/atari/video/VideoStandard.js",
                    "src/main/atari/video/VideoSignal.js",
                    "src/main/atari/audio/AudioSignal.js",
                    "src/main/atari/cpu/M6502.js",
                    "src/main/atari/pia/Ram.js",
                    "src/main/atari/pia/Pia.js",
                    "src/main/atari/tia/TiaPalettes.js",
                    "src/main/atari/tia/TiaAudio.js",
                    "src/main/atari/tia/TiaAudioChannel.js",
                    "src/main/atari/tia/Tia.js",
                    "src/main/atari/console/Bus.js",
                    "src/main/atari/console/AtariConsole.js",
                    "src/main/atari/controls/JoystickButtons.js",
                    "src/main/atari/controls/ConsoleControls.js",
                    "src/main/atari/cartridge/ROM.js",
                    "src/main/atari/cartridge/CartridgeDatabase.js",
                    "src/main/atari/cartridge/Cartridge.js",
                    "src/main/atari/cartridge/formats/Cartridge4K.js",
                    "src/main/atari/cartridge/formats/Cartridge2K_CV.js",
                    "src/main/atari/cartridge/formats/CartridgeBankedByMaskedRange.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_E0.js",
                    "src/main/atari/cartridge/formats/Cartridge64K_F0.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_FE.js",
                    "src/main/atari/cartridge/formats/Cartridge16K_E7.js",
                    "src/main/atari/cartridge/formats/Cartridge10K_DPCa.js",
                    "src/main/atari/cartridge/formats/Cartridge24K_28K_32K_FA2.js",
                    "src/main/atari/cartridge/formats/CartridgeBankedByBusMonitoring.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_512K_3F.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_512K_3E.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_256K_SB.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_64K_AR.js",
                    "src/main/atari/cartridge/formats/Cartridge64K_X07.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_0840.js",
                    "src/main/atari/cartridge/formats/Cartridge8K_UA.js",
                    "src/main/atari/cartridge/CartridgeFormats.js",
                    "src/main/atari/cartridge/CartridgeCreator.js",
                    "src/main/images/Images.js",
                    "src/main/room/clock/Clock.js",
                    "src/main/room/files/RecentStoredROMs.js",
                    "src/main/room/files/FileLoader.js",
                    "src/main/room/files/FileDownloader.js",
                    "src/main/room/controls/DOMKeys.js",
                    "src/main/room/controls/GamepadButtons.js",
                    "src/main/room/controls/TouchControls.js",
                    "src/main/room/controls/GamepadConsoleControls.js",
                    "src/main/room/controls/DOMTouchControls.js",
                    "src/main/room/controls/DOMConsoleControls.js",
                    "src/main/room/screen/ScreenGUI.es5.js",
                    "src/main/room/screen/Monitor.js",
                    "src/main/room/screen/ConsolePanel.js",
                    "src/main/room/screen/CanvasDisplay.js",
                    "src/main/room/screen/dialogs/RecentROMsDialog.js",
                    "src/main/room/screen/dialogs/SaveStateDialog.js",
                    "src/main/room/screen/dialogs/QuickOptionsDialog.js",
                    "src/main/room/screen/dialogs/NetPlayDialog.js",
                    "src/main/room/screen/dialogs/CartridgeFormatDialog.js",
                    "src/main/room/screen/settings/SettingsGUI.es5.js",
                    "src/main/room/screen/settings/Settings.js",
                    "src/main/room/speaker/WebAudioSpeaker.js",
                    "src/main/room/savestate/LocalStorageSaveStateMedia.js",
                    "src/main/room/controls/PeripheralControls.js",
                    "src/main/room/controls/DOMPeripheralControls.js",
                    "src/main/room/netplay/NetServer.js",
                    "src/main/room/netplay/NetClient.js",
                    "src/main/room/Room.js",
                    "src/main/userprefs/UserPreferences.js",
                    "src/main/userprefs/UserROMFormats.js",
                    "src/runtime/images/EmbeddedImages.js",
                    "src/main/Configurator.js",
                    "src/main/Launcher.js"
                ],
                dest: "temp/javatari.part.js"
            },
            emuFinal: {
                src: [
                    "src/main/Javatari.js",
                    "temp/javatari.part.min.js"
                ],
                dest: "temp/javatari.js"
            },
           standalone: {
                src: [
                    "src/runtime/standalone/index.part1.html",
                    "temp/javatari.js",
                    "src/runtime/standalone/index.part2.html"
                ],
                dest: "temp/index.html"
            }
        },

        uglify: {
            emuPart: {
                options: {
                    maxLineLen: 7900,
                    mangle: {
                        toplevel: true,
                        screw_ie8: true
                    },
                    compress: {
                        screw_ie8: true,
                        sequences: true,
                        dead_code: true,
                        drop_debugger: true,
                        comparisons: true,
                        conditionals: true,
                        evaluate: true,
                        booleans: true,
                        loops: true,
                        unused: true,
                        if_return: true,
                        hoist_funs: true,
                        join_vars: true,
                        cascade: true,
                        unsafe: false
                    }
                },
                files: {
                    "temp/javatari.part.min.js": ["temp/javatari.part.js"]
                }
            }
        },

        copy: {
            standalone: {
                files: [
                    {src: "temp/index.html", dest: "release/stable/5.0/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/cache.manifest", dest: "release/stable/5.0/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/manifest.webapp", dest: "release/stable/5.0/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon192.png", dest: "release/stable/5.0/standalone/images", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon512.png", dest: "release/stable/5.0/standalone/images", expand: true, flatten: true, filter: "isFile"}
                ]
            },
            embedded: {
                files: [
                    {src: "src/runtime/embedded/index.html", dest: "release/stable/5.0/embedded", expand: true, flatten: true, filter: "isFile"},
                    {src: "temp/javatari.js", dest: "release/stable/5.0/embedded", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.registerTask("default", [
        "clean:init",
        "concat:emuPart",
        "uglify:emuPart",
        "concat:emuFinal",
        "concat:standalone",
        "copy:standalone",
        "copy:embedded",
        "clean:finish"
    ]);

};