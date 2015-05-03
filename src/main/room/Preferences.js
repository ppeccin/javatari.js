// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.preferences = {};

Javatari.preferences.defaults = {
    KP0LEFT  : jt.Keys.VK_LEFT.c,
    KP0UP    : jt.Keys.VK_UP.c,
    KP0RIGHT : jt.Keys.VK_RIGHT.c,
    KP0DOWN  : jt.Keys.VK_DOWN.c,
    KP0BUT   : jt.Keys.VK_SPACE.c,
    KP0BUT2  : jt.Keys.VK_DELETE.c,
    KP1LEFT  : jt.Keys.VK_F.c,
    KP1UP    : jt.Keys.VK_T.c,
    KP1RIGHT : jt.Keys.VK_H.c,
    KP1DOWN  : jt.Keys.VK_G.c,
    KP1BUT   : jt.Keys.VK_A.c,
    KP1BUT2  : jt.Keys.VK_PERIOD.c,

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
    try {
        localStorage.javatariprefs = JSON.stringify(Javatari.preferences);
    } catch (e) {
        // giveup
    }
};


