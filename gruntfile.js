module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release"],
            finish: ["temp"]
        },

        copy: {
            main: {
                files: [
                    {src: ["src/release/*"], dest: "release/", expand: true, flatten: true, filter: "isFile"},
                    {src: ["src/main/images/*"], dest: "release/javatari/", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        },

        concat: {
            part: {
                src: [
                    "src/main/util/MD5.js",
                    "src/main/util/Util.js",
                    "src/main/util/ZIP.js",
                    "src/main/atari/cpu/M6502.js",
                    "src/main/atari/pia/Ram.js",
                    "src/main/atari/pia/Pia.js",
                    "src/main/atari/tia/VideoStandard.js",
                    "src/main/atari/tia/TiaVideoSignal.js",
                    "src/main/atari/tia/TiaAudioSignal.js",
                    "src/main/atari/tia/TiaAudioChannel.js",
                    "src/main/atari/tia/Tia.js",
                    "src/main/atari/console/Bus.js",
                    "src/main/atari/console/Clock.js",
                    "src/main/atari/controls/ConsoleControls.js",
                    "src/main/atari/console/AtariConsole.js",
                    "src/main/atari/cartridge/ROM.js",
                    "src/main/atari/cartridge/CartridgeInfoLibrary.js",
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
                    "src/main/atari/cartridge/CartridgeDatabase.js",
                    "src/main/room/controls/Keys.js",
                    "src/main/room/Preferences.js",
                    "src/main/room/controls/GamepadConsoleControls.js",
                    "src/main/room/controls/DOMConsoleControls.js",
                    "src/main/room/screen/DOMMonitorControls.js",
                    "src/main/room/screen/Monitor.js",
                    "src/main/room/screen/CanvasDisplay.js",
                    "src/main/room/screen/ConsolePanel.js",
                    "src/main/room/speaker/WebAudioSpeaker.js",
                    "src/main/room/savestate/LocalStorageSaveStateMedia.js",
                    "src/main/room/cartridge/ROMLoader.js",
                    "src/main/room/settings/Settings.js",
                    "src/main/room/settings/SettingsGUI.js",
                    "src/main/room/Room.js",
                    "src/main/room/Launcher.js"
                ],
                dest: "temp/javatari.part.concat.js"
            },
            final: {
                src: [
                    "src/main/Javatari.js",
                    "temp/javatari.part.min.js"
                ],
                dest: "release/javatari/javatari.js"
            }
        },

        uglify: {
            part: {
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
                    "temp/javatari.part.min.js": ["temp/javatari.part.concat.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.registerTask("default", ["clean:init", "copy:main", "concat:part", "uglify:part", "concat:final", "clean:finish"]);
};