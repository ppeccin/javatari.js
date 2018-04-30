// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Javatari.userROMFormats = {

    init: function() {
        jt.CartridgeCreator.setUserROMFormats(this);
        this.userFormats = JSON.parse(localStorage.javatariuserformats || "{}");
    },

    getForROM: function(rom) {
        return this.userFormats[rom.info.h];
    },

    setForROM: function(rom, formatName, isAuto) {
        if (!rom.info.h) return;
        if (isAuto) delete this.userFormats[rom.info.h];
        else this.userFormats[rom.info.h] = formatName;

        localStorage.javatariuserformats = JSON.stringify(this.userFormats);
    }

};

