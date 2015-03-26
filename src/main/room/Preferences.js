// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.preferences = {};

Javatari.preferencesDefaults = {
    KP0LEFT  :  37,     // VK_LEFT
    KP0UP    :  38,     // VK_UP
    KP0RIGHT :  39,     // VK_RIGHT
    KP0DOWN  :  40,     // VK_DOWN
    KP0BUT   :  32,     // VK_SPACE
    KP0BUT2  :  46,     // VK_DELETE
    KP1LEFT  :  70,     // VK_F
    KP1UP    :  84,     // VK_T
    KP1RIGHT :  72,     // VK_H
    KP1DOWN  :  71,     // VK_G
    KP1BUT   :  65,     // VK_A
    KP1BUT2  :  190     // VK_PERIOD
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

