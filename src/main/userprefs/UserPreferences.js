// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.userPreferences = { };

Javatari.userPreferences.currentVersion = 1;
Javatari.userPreferences.compatibleVersions = new Set([ 1 ]);

Javatari.userPreferences.defaults = function() {
"use strict";

    var k = jt.DOMKeys;

    return {

        joystickKeys: [
            {
                left:    k.VK_LEFT,
                up:      k.VK_UP,
                right:   k.VK_RIGHT,
                down:    k.VK_DOWN,
                button:  k.VK_SPACE,
                buttonT: k.VK_DELETE
            }, {
                left:    k.VK_F,
                up:      k.VK_T,
                right:   k.VK_H,
                down:    k.VK_G,
                button:  k.VK_A,
                buttonT: k.VK_PERIOD
            }
        ],

        joystickGamepads: [
            {
                button:        0,
                buttonT:       1,
                select:        8,
                reset:         9,
                pause:         4,
                fastSpeed:     7,
                slowSpeed:     6,
                device:        -1,  // -1 = auto
                xAxis:         0,
                xAxisSig:      1,
                yAxis:         1,
                yAxisSig:      1,
                paddleAxis:    0,
                paddleAxisSig: 1,
                paddleCenter:  0.3,
                paddleSens:    0.75,
                deadzone:      0.3
            }, {
                button:        0,
                buttonT:       1,
                select:        8,
                reset:         9,
                pause:         4,
                fastSpeed:     7,
                slowSpeed:     6,
                device:        -1,  // -1 = auto
                xAxis:         0,
                xAxisSig:      1,
                yAxis:         1,
                yAxisSig:      1,
                paddleAxis:    0,
                paddleAxisSig: 1,
                paddleCenter:  0.3,
                paddleSens:    0.75,
                deadzone:      0.3
            }
        ],

        touch: {
            directionalBig: false
        },

        hapticFeedback: true,
        turboFireSpeed: 6,

        vSynch: 1,                         // on
        crtFilter: -1,                     // auto

        audioBufferBase: -1,               // auto

        netPlaySessionName: "",
        netPlayNick: ""

    };
};

Javatari.userPreferences.load = function() {
    var prefs;

    // Load from Local Storage
    try {
        prefs = JSON.parse(localStorage.javatari4prefs || "{}");
        // Migrations from old to new version control fields
        if (prefs.version) delete prefs.version;
    } catch(e) {
        // Give up
    }

    // Absent or incompatible version
    if (!prefs || !Javatari.userPreferences.compatibleVersions.has(prefs.prefsVersion)) {
        // Create new empty preferences and keep settings as possible
        var oldPrefs = prefs;
        prefs = {};
        if (oldPrefs) {
            // Migrations
        }
    }

    // Fill missing properties with defaults
    var defs = Javatari.userPreferences.defaults();
    for (var pref in defs)
        if (prefs[pref] === undefined) prefs[pref] = defs[pref];

    prefs.prefsVersion = Javatari.userPreferences.currentVersion;

    // Update current preferences
    if (!Javatari.userPreferences.current) Javatari.userPreferences.current = {};
    var cur = Javatari.userPreferences.current;
    for (pref in prefs) cur[pref] = prefs[pref];

    Javatari.userPreferences.isDirty = false;
};

Javatari.userPreferences.setDefaultJoystickKeys = function() {
    Javatari.userPreferences.current.joystickKeys = Javatari.userPreferences.defaults().joystickKeys;
    Javatari.userPreferences.setDirty();
};

Javatari.userPreferences.save = function() {
    if (!Javatari.userPreferences.isDirty) return;

    try {
        Javatari.userPreferences.current.javatariVersion = Javatari.VERSION;
        localStorage.javatari4prefs = JSON.stringify(Javatari.userPreferences.current);
        Javatari.userPreferences.isDirty = false;

        jt.Util.log("Preferences saved!");
    } catch (e) {
        // give up
    }
};

Javatari.userPreferences.setDirty = function() {
    Javatari.userPreferences.isDirty = true;
};
