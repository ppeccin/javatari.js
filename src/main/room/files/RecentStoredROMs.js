// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.RecentStoredROMs = function() {

    this.getCatalog = function() {
        if (!storedList) {
            try {
                storedList = JSON.parse(localStorage.javataristoredromsicatalog);
            } catch (e) {
                // giveup
            }
            if (!storedList) initStore();
        }
        return storedList;
    };

    this.storeROM = function(rom) {
        this.getCatalog();
        var found = storedList.find(function(stored) { return stored && stored.h === rom.info.h; });

        if (!found || (found.n != rom.info.l || found.f != rom.info.f)) {
            getStoredROMs();
            if (found) {
                var oldIdx = storedList.indexOf(found);
                storedList.splice(oldIdx, 1);
                storedROMs.splice(oldIdx, 1);
            } else if (storedList.length >= MAX_ITMES) {
                storedList = storedList.slice(0, MAX_ITMES - 1);
                storedROMs = storedROMs.slice(0, MAX_ITMES - 1);
            }
            storedList.unshift({ n: rom.info.l, h: rom.info.h, f: rom.info.f });
            for (var i = 0; i < storedList.length; ++i) storedList[i].i = i;
            localStorage.javataristoredromsicatalog = JSON.stringify(storedList);
            storedROMs.unshift(rom.saveState(true));        // true: include content bytes
            localStorage.javataristoredromsdata = JSON.stringify(storedROMs);
            this.lastROMLoadedIndex = 0;
            jt.Util.log("New ROM stored: " + rom.info.n + ", " + rom.info.h);
        } else
            this.lastROMLoadedIndex = storedList.indexOf(found);

        localStorage.javataristoredromslastindex = this.lastROMLoadedIndex;
    };

    this.getROM = function(index) {
        this.lastROMLoadedIndex = index;
        localStorage.javataristoredromslastindex = index;
        var romState = getStoredROMs()[index];
        return romState ? jt.ROM.loadState(romState) : null;
    };


    function getStoredROMs() {
        if (!storedROMs) {
            try {
                storedROMs = JSON.parse(localStorage.javataristoredromsdata);
            } catch (e) {
                // giveup
            }
            if (!storedROMs) initStore();
        }
        return storedROMs;
    }

    function initStore() {
        storedList = [];
        localStorage.javataristoredromsicatalog = JSON.stringify(storedList);
        storedROMs = [];
        localStorage.javataristoredromsdata = JSON.stringify(storedROMs);
    }

    var last = localStorage.javataristoredromslastindex;
    this.lastROMLoadedIndex = last !== undefined ? Number.parseInt(last) : -1;

    var storedList, storedROMs;

    var MAX_ITMES = 10;

};