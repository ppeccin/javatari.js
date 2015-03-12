module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: ["temp", "release"],

        copy: {
            main: {
                files: [
                    {src: ["app/release/*"], dest: "release/", expand: true, flatten: true, filter: "isFile"},
                    {src: ["app/resources/*"], dest: "release/javatari/resources/", expand: true, flatten: true, filter: "isFile"}
                ]
            }
        },

        concat: {
            part: {
                src: ["app/src/**/*.js", "!app/src/Javatari.js"],
                dest: "temp/javatari.part.concat.js"
            },
            final: {
                src: [
                    "app/src/Javatari.js",
                    "temp/javatari.part.min.js"
                ],
                dest: "release/javatari/javatari.min.js"
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
                        hoist_funs: true,
                        if_return: true,
                        join_vars: true,
                        cascade: true
                    }
                },
                files: {
                    "temp/javatari.part.min.js": ["temp/javatari.part.concat.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['clean', 'copy:main', 'concat:part', 'uglify:part', 'concat:final']);
};