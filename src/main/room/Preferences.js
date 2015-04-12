// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.preferences = {};

Javatari.preferencesDefaults = {
    KP0LEFT  : 37,     // VK_LEFT
    KP0UP    : 38,     // VK_UP
    KP0RIGHT : 39,     // VK_RIGHT
    KP0DOWN  : 40,     // VK_DOWN
    KP0BUT   : 32,     // VK_SPACE
    KP0BUT2  : 46,     // VK_DELETE
    KP1LEFT  : 70,     // VK_F
    KP1UP    : 84,     // VK_T
    KP1RIGHT : 72,     // VK_H
    KP1DOWN  : 71,     // VK_G
    KP1BUT   : 65,     // VK_A
    KP1BUT2  : 190,    // VK_PERIOD

    JP0DEVICE   : -1,  // -1 = auto
    JP0XAXIS    : 0,
    JP0XAXISSIG : 1,
    JP0YAXIS    : 1,
    JP0YAXISSIG : 1,
    JP0PAXIS    : 0,
    JP0PAXISSIG : 1,
    JP0BUT      : 0,
    JP0BUT2     : 1,
    JP0SELECT   : 8,
    JP0RESET    : 9,
    JP0PAUSE    : 7,
    JP0FAST     : 6,
    JP0DEADZONE : 0.3,
    JP0PCENTER  : 0.3,
    JP0PSENS    : 0.75,

    JP1DEVICE   : -1,  // -1 = auto
    JP1XAXIS    : 0,
    JP1XAXISSIG : 1,
    JP1YAXIS    : 1,
    JP1YAXISSIG : 1,
    JP1PAXIS    : 0,
    JP1PAXISSIG : 1,
    JP1BUT      : 0,
    JP1BUT2     : 1,
    JP1SELECT   : 8,
    JP1RESET    : 9,
    JP1PAUSE    : 7,
    JP1FAST     : 6,
    JP1DEADZONE : 0.3,
    JP1PCENTER  : 0.3,
    JP1PSENS    : 0.75
};

Javatari.preferencesLoad = function() {
    var loaded = {};
    try {
        loaded = JSON.parse(localStorage.javatariprefs || "{}");
    } catch(e) {
        // giveup
    }
    for (var pref in Javatari.preferencesDefaults)
        Javatari.preferences[pref] = loaded[pref] || Javatari.preferencesDefaults[pref];
};

Javatari.preferencesSave = function() {
    localStorage.javatariprefs = JSON.stringify(Javatari.preferences);
};

