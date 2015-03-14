// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Main Emulator parameters.
// You may change any of these after loading the project and before starting the Emulator

Javatari = {

    ROM_AUTO_LOAD_URL:              "",                         // Full or relative URL of ROM
    AUTO_START:                     true,                       // Set false to start emulator manually with Javatari.start()
    SCREEN_ELEMENT_ID:              "javatari-screen",
    CONSOLE_PANEL_ELEMENT_ID:       "javatari-console-panel",
    CARTRIDGE_CHANGE_DISABLED:      false,
    SCREEN_RESIZE_DISABLED:         false,
    SCREEN_FULLSCREEN_DISABLED:     false,
    PADDLES_MODE:                   -1,                         // -1 = auto, 0 = off, 1 = 0n
    SCREEN_CRT_MODE:                -1,                         // -1 = auto, 0 .. 4 = mode
    SCREEN_OPENING_SIZE:            2,                          // 1 .. 4
    SCREEN_CONTROL_BAR:             0,                          // 0 = Always, 1 = Hover, 2 = Old Javatari
    SCREEN_NATURAL_FPS:             60,                         // 60, 50 fps
    AUDIO_BUFFER_SIZE:              512,                        // 256, 512, 1024, 2048, 4096, 8192
    IMAGES_PATH:                    "javatari/"

};

