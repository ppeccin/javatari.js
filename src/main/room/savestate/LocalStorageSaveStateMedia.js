// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.LocalStorageSaveStateMedia = function() {
"use strict";

    this.connect = function(socket) {
        socket.connectMedia(this);
    };

    this.connectPeripherals = function(pFileDownloader) {
        fileDownloader = pFileDownloader;
    };

    this.isSlotUsed = function(slot) {
        return localStorage["javatarisave" + slot] !== undefined;
    };

    this.saveState = function(slot, state) {
        var data = buildDataFromState(state);
        return data && saveToLocalStorage("save" + slot, data);
    };

    this.loadState = function(slot) {
        var data = loadFromLocalStorage("save" + slot);
        return buildStateFromData(data);
    };

    this.saveStateFile = function(fileName, state) {
        var data = buildDataFromState(state);
        if (data) fileDownloader.startDownloadBinary((fileName || "Javatari SaveState") + SAVE_STATE_FILE_EXTENSION, data, "System State file");
    };

    this.loadStateFile = function(data) {
        return buildStateFromData(data);
    };

    this.saveResource = function(entry, data) {
        try {
            var res = data && JSON.stringify(data);
            return saveToLocalStorage("res" + entry, res);
        } catch(ex) {
            // give up
        }
    };

    this.loadResource = function(entry) {
        try {
            var res = loadFromLocalStorage("res" + entry);
            return res && JSON.parse(res);
        } catch(ex) {
            // give up
        }
    };

    var saveToLocalStorage = function(entry, data) {
        try {
            localStorage["javatari" + entry] = data;
            return true;
        } catch (ex) {
            jt.Util.error(ex);
            return false;
        }
    };

    var loadFromLocalStorage = function(entry) {
        try {
            return localStorage["javatari" + entry];
        } catch (ex) {
            jt.Util.warning(ex);
            // give up
        }
    };

    var buildDataFromState = function(state) {
        try {
            return SAVE_STATE_IDENTIFIER + JSON.stringify(state);
        } catch(ex) {
            jt.Util.error(ex);
            // give up
        }
    };

    var buildStateFromData = function (data) {
        try {
            var id;
            if (typeof data == "string")
                id = data.substr(0, SAVE_STATE_IDENTIFIER.length);
            else
                id = jt.Util.int8BitArrayToByteString(data, 0, SAVE_STATE_IDENTIFIER.length);

            // Check for the identifier
            if (id !== SAVE_STATE_IDENTIFIER && id !== SAVE_STATE_IDENTIFIER_OLD) return;

            var stateData;
            if (typeof data == "string")
                stateData = data.slice(SAVE_STATE_IDENTIFIER.length);
            else
                stateData = jt.Util.int8BitArrayToByteString(data, SAVE_STATE_IDENTIFIER.length);

            return stateData && JSON.parse(stateData);
        } catch(ex) {
            jt.Util.error(ex);
        }
    };


    var fileDownloader;

    var SAVE_STATE_IDENTIFIER = String.fromCharCode(0, 0) + "javataristate!";     // char 0 so browsers like Safari think the file is binary...  :-(
    var SAVE_STATE_IDENTIFIER_OLD = "javatarijsstate!";
    var SAVE_STATE_FILE_EXTENSION = ".jst";

};
