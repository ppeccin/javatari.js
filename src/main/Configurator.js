// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Configurator = {

    applyConfig: function() {

        var urlParams = {};

        // Override parameters with values set in URL, if allowed
        if (Javatari.ALLOW_URL_PARAMETERS) {
            urlParams = parseURLParams();
            // First override PRESETS parameters
            if (urlParams.PRESETS) { this.applyParam("PRESETS", urlParams.PRESETS); delete urlParams.PRESETS }
        }

        // Apply reset
        if (urlParams.RESET) this.applyReset();

        // Apply  presets
        this.applyPresets(Javatari.PRESETS);

        // Apply additional single parameter overrides
        for (var param in urlParams) this.applyParam(param, urlParams[param]);

        // Ensure the correct types of the parameters
        normalizeParameterTypes();

        // Apply user asked page CSS
        if (Javatari.PAGE_BACK_CSS) document.body.style.background = Javatari.PAGE_BACK_CSS;

        function parseURLParams() {
            var search = (window.location.search || "").split('+').join(' ');
            var reg = /[?&]?([^=]+)=([^&]*)/g;
            var tokens;
            var parameters = {};
            while (tokens = reg.exec(search)) {
                var parName = decodeURIComponent(tokens[1]).trim().toUpperCase();
                parName = jt.Configurator.abbreviations[parName] || parName;
                parameters[parName] = decodeURIComponent(tokens[2]).trim();
            }
            return parameters;
        }

        function normalizeParameterTypes() {
            Javatari.AUTO_POWER_ON_DELAY |= 0;
            Javatari.CARTRIDGE_CHANGE_DISABLED = Javatari.CARTRIDGE_CHANGE_DISABLED === true || Javatari.CARTRIDGE_CHANGE_DISABLED == "true";
            Javatari.SCREEN_RESIZE_DISABLED = Javatari.SCREEN_RESIZE_DISABLED === true || Javatari.SCREEN_RESIZE_DISABLED == "true";
            Javatari.SCREEN_FULLSCREEN_MODE = Javatari.SCREEN_FULLSCREEN_MODE |= 0;
            Javatari.SCREEN_FILTER_MODE |= 0;
            Javatari.SCREEN_CRT_MODE |= 0;
            Javatari.SCREEN_DEFAULT_SCALE = parseFloat(Javatari.SCREEN_DEFAULT_SCALE);
            Javatari.SCREEN_DEFAULT_ASPECT = parseFloat(Javatari.SCREEN_DEFAULT_ASPECT);
            Javatari.SCREEN_CANVAS_SIZE = Javatari.SCREEN_CANVAS_SIZE | 0;
            Javatari.SCREEN_CONTROL_BAR |= 0;
            Javatari.SCREEN_FORCE_HOST_NATIVE_FPS |= 0;
            Javatari.SCREEN_VSYNCH_MODE |= 0;
            Javatari.AUDIO_MONITOR_BUFFER_BASE |= 0;
            Javatari.AUDIO_MONITOR_BUFFER_SIZE |= 0;
            Javatari.AUDIO_SIGNAL_BUFFER_RATIO = parseFloat(Javatari.AUDIO_SIGNAL_BUFFER_RATIO);
            Javatari.AUDIO_SIGNAL_ADD_FRAMES |= 0;
        }
    },

    applyPresets: function(presetList) {
        var presetNames = (presetList || "").trim().toUpperCase().split(",");
        // Apply list in order
        for (var i = 0; i < presetNames.length; i++)
            this.applyPreset(presetNames[i].trim());
    },

    applyPreset: function(presetName) {
        if (!presetName) return;
        var presetPars = Javatari.PRESETS_CONFIG[presetName];
        if (presetPars) {
            jt.Util.log("Applying preset: " + presetName);
            for (var par in presetPars) {
                var parName = par.trim().toUpperCase();
                if (parName[0] !== "_") this.applyParam(parName, presetPars[par]);      // Normal Parameter to set
                else if (parName === "_INCLUDE") this.applyPresets(presetPars[par]);    // Preset to include
            }
        } else
            jt.Util.warning("Preset \"" + presetName + "\" not found, skipping...");
    },

    applyParam: function(name, value) {
        if (name.indexOf(".") < 0)
            Javatari[name] = value;
        else {
            var obj = Javatari;
            var parts = name.split('.');
            for (var p = 0; p < parts.length - 1; ++p) {
                obj = obj[parts[p]];
            }
            obj[parts[parts.length - 1]] = value;
        }
    },

    mediaURLSpecs: function() {
        // URLs specified by fixed media loading parameters
        var OPEN_TYPE = jt.FileLoader.OPEN_TYPE;
        return [
            Javatari.AUTODETECT_URL && {
                url: Javatari.AUTODETECT_URL,
                onSuccess: function (res) {
                    Javatari.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.AUTO, 0, true, false);
                }
            },
            Javatari.CARTRIDGE_URL && {
                url: Javatari.CARTRIDGE_URL,
                onSuccess: function (res) {
                    Javatari.room.fileLoader.loadFromContent(res.url, res.content, OPEN_TYPE.ROM, 0, true, false, Javatari.CARTRIDGE_FORMAT);
                }
            }
        ];
    },

    applyReset: function() {
        jt.Util.warning("Removing all data saved on this client");
        for(var p in localStorage)
            if (p.indexOf("javatari") === 0) delete localStorage[p];
    },

    abbreviations: {
        P: "PRESETS",
        PRESET: "PRESETS",
        ROM: "CARTRIDGE_URL",
        CART: "CARTRIDGE_URL",
        FORMAT: "CARTRIDGE_FORMAT",
        ROM_FORMAT: "CARTRIDGE_FORMAT",
        CART_FORMAT: "CARTRIDGE_FORMAT",
        ANY: "AUTODETECT_URL",
        AUTO: "AUTODETECT_URL",
        AUTODETECT: "AUTODETECT_URL",
        STATE: "STATE_URL",
        SAVESTATE: "STATE_URL",
        JOIN: "NETPLAY_JOIN",
        NICK: "NETPLAY_NICK",
        VERSION: "VERSION_CHANGE_ATTEMPTED"      // Does not allow version to be changed ;-)
    }

};
