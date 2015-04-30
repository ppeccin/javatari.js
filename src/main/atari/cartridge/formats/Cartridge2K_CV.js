// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 2K "CV" Commavid + 1K RAM format

JavatariCode.Cartridge2K_CV = function(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        // Always use a 4K ROM image, multiplying the ROM internally
        bytes = new Array(4096);
        var len = rom.content.length;
        for (var pos = 0; pos < bytes.length; pos += len)
            JavatariCode.Util.arrayCopy(rom.content, 0, bytes, pos, len);
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM reads
        if (maskedAddress < 0x0400)				// RAM
            return extraRAM[maskedAddress];
        else
            return bytes[maskedAddress];	    // ROM
    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM writes
        if (maskedAddress >= 0x0400 && maskedAddress <= 0x07ff)
            extraRAM[maskedAddress - 0x0400] = val;
    };

    var maskAddress = function(address) {
        return address & ADDRESS_MASK;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(JavatariCode.Util.uInt8ArrayToByteString(bytes)),
            ra: btoa(JavatariCode.Util.uInt8ArrayToByteString(extraRAM))
        };
    };

    this.loadState = function(state) {
        this.format = JavatariCode.CartridgeFormats[state.f];
        this.rom = JavatariCode.ROM.loadState(state.r);
        bytes = JavatariCode.Util.byteStringToUInt8Array(atob(state.b));
        extraRAM = JavatariCode.Util.byteStringToUInt8Array(atob(state.ra));
    };


    var bytes;
    var extraRAM = JavatariCode.Util.arrayFill(new Array(1024), 0);

    var ADDRESS_MASK = 0x0fff;


    if (rom) init(this);

};

JavatariCode.Cartridge2K_CV.prototype = JavatariCode.Cartridge.base;

JavatariCode.Cartridge2K_CV.createFromSaveState = function(state) {
    var cart = new JavatariCode.Cartridge2K_CV();
    cart.loadState(state);
    return cart;
};
