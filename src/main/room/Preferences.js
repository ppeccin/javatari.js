// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.preferences = {};

Javatari.preferences.defaults = {
    KP0LEFT  : KeyCodes.VK_LEFT,
    KP0UP    : KeyCodes.VK_UP,
    KP0RIGHT : KeyCodes.VK_RIGHT,
    KP0DOWN  : KeyCodes.VK_DOWN,
    KP0BUT   : KeyCodes.VK_SPACE,
    KP0BUT2  : KeyCodes.VK_DELETE,
    KP1LEFT  : KeyCodes.VK_F,
    KP1UP    : KeyCodes.VK_T,
    KP1RIGHT : KeyCodes.VK_H,
    KP1DOWN  : KeyCodes.VK_G,
    KP1BUT   : KeyCodes.VK_A,
    KP1BUT2  : KeyCodes.VK_PERIOD,

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

Javatari.preferences.loadDefaults = function() {
    for (var pref in Javatari.preferences.defaults)
        Javatari.preferences[pref] = Javatari.preferences.defaults[pref];
};

Javatari.preferences.load = function() {
    try {
        Javatari.preferences.loadDefaults();
        var loaded = JSON.parse(localStorage.javatariprefs || "{}");
        for (var pref in Javatari.preferences.defaults)
            if (loaded[pref]) Javatari.preferences[pref] = loaded[pref];
    } catch(e) {
        // giveup
    }
};

Javatari.preferences.save = function() {
    localStorage.javatariprefs = JSON.stringify(Javatari.preferences);
};


