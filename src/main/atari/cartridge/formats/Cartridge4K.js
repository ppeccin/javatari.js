// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// Implements the 4K unbanked format. Smaller ROMs will be copied multiple times to fill the entire 4K

JavatariCode.Cartridge4K = function(rom, format) {

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
        return bytes[address & ADDRESS_MASK];
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(JavatariCode.Util.uInt8ArrayToByteString(bytes))
        };
    };

    this.loadState = function(state) {
        this.format = JavatariCode.CartridgeFormats[state.f];
        this.rom = JavatariCode.ROM.loadState(state.r);
        bytes = JavatariCode.Util.byteStringToUInt8Array(atob(state.b));
    };


    var bytes;

    var ADDRESS_MASK = 0x0fff;


    if (rom) init(this);

};

JavatariCode.Cartridge4K.prototype = JavatariCode.Cartridge.base;

JavatariCode.Cartridge4K.createFromSaveState = function(state) {
    var cart = new JavatariCode.Cartridge4K();
    cart.loadState(state);
    return cart;
};
