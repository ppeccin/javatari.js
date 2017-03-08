// Javatari version 4.0
// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// May be overridden dynamically by URL query parameters, if ALLOW_URL_PARAMETERS = true.

Javatari = {

    PRESETS:                        "",                         // Configuration Presets to apply. See Presets Configuration

    // Full or relative URL of Media files to load
    CARTRIDGE_URL:                  "",
    AUTODETECT_URL:                 "",
    STATE_URL:                      "",

    // Forcing ROM formats
    CARTRIDGE_FORMAT:               "",                         // TODO Define Cartridge Formats

    // General configuration
    AUTO_START:                     true,
    AUTO_POWER_ON_DELAY:            1200,                       // -1: no auto Power-ON; >= 0: wait specified milliseconds before Power-ON
    CARTRIDGE_CHANGE_DISABLED:      false,
    CARTRIDGE_LABEL_COLORS:         "",                         // Space-separated colors for Label, Background, Border. e.g. "#f00 #000 transparent". Leave "" for defaults
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_CONSOLE_PANEL_DISABLED:  false,
    SCREEN_ELEMENT_ID:              "javatari-screen",
    CONSOLE_PANEL_ELEMENT_ID:       -1,                         // -1: auto. Don't change! :-)
    SCREEN_FULLSCREEN_MODE:         -1,                         // -2: disabled; -1: auto; 0: off; 1: on
    SCREEN_CRT_MODE:                -1,                         // -1: auto; 0: off; 1: on
    SCREEN_FILTER_MODE:             -1,                         // -2: browser default; -1: auto; 0..3: smoothing level
    SCREEN_DEFAULT_SCALE:           -1,                         // -1: auto; 0.5..N in 0.1 steps: scale
    SCREEN_DEFAULT_ASPECT:          2,                          // in 0.1 steps
    SCREEN_CONTROL_BAR:             1,                          // 0: on hover; 1: always
    SCREEN_FORCE_HOST_NATIVE_FPS:   -1,                         // -1: auto. Don't change! :-)
    SCREEN_VSYNCH_MODE:             1,                          // -1: disabled; 0: off; 1: on
    AUDIO_MONITOR_BUFFER_BASE:      -3,                         // -3: user set value; -2: disable audio; -1: auto; 0: browser default; 1..6: base value. More buffer = more delay
    AUDIO_MONITOR_BUFFER_SIZE:      -1,                         // -1: auto; 256, 512, 1024, 2048, 4096, 8192, 16384: buffer size.     More buffer = more delay. Don't change! :-)
    AUDIO_SIGNAL_BUFFER_RATIO:      2,                          // Internal Audio Signal buffer based on Monitor buffer
    AUDIO_SIGNAL_ADD_FRAMES:        3,                          // Additional frames in internal Audio Signal buffer based on Monitor buffer
    PADDLES_MODE:                   -1,                         // -1: auto; 0: off; 1: on
    TOUCH_MODE:                     -1,                         // -1: auto; 0: disabled; 1: enabled; 2: enabled (swapped)
    IMAGES_PATH:                    window.JAVATARI_IMAGES_PATH || "images/",

    ALLOW_URL_PARAMETERS:           true                        // Allows user to override any of these parameters via URL query parameters

};

Javatari.PRESETS_CONFIG = {};

jt = window.jt || {};           // Namespace for all classes and objects
