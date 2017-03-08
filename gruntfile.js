module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            init: ["temp", "release/alpha/4.0"],
            finish: ["temp"]
        },

        concat: {
            emuPart: {
                src: [
                    "src/main/room/screen/FullScreenSetup.js"
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
                    {src: "temp/index.html", dest: "release/alpha/4.0/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/cache.manifest", dest: "release/alpha/4.0/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/standalone/manifest.webapp", dest: "release/alpha/4.0/standalone", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon192.png", dest: "release/alpha/4.0/standalone/images", expand: true, flatten: true, filter: "isFile"},
                    {src: "src/runtime/images/files/logo-icon512.png", dest: "release/alpha/4.0/standalone/images", expand: true, flatten: true, filter: "isFile"}
                ]
            },
            embedded: {
                files: [
                    {src: "src/runtime/embedded/index.html", dest: "release/alpha/4.0/embedded", expand: true, flatten: true, filter: "isFile"},
                    {src: "temp/javatari.js", dest: "release/alpha/4.0/embedded", expand: true, flatten: true, filter: "isFile"}
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