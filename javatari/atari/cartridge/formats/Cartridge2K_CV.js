/**
 * Created by ppeccin on 20/11/2014.
 */

// Implements the 2K "CV" Commavid + 1K RAM format

function Cartridge2K_CV(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        // Always use a 4K ROM image, multiplying the ROM internally
        bytes = new Array(4096);
        var len = rom.content.length;
        for (var pos = 0; pos < bytes.length; pos += len)
            Util.arrayCopy(rom.content, 0, bytes, pos, len);
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
            b: btoa(Util.uInt8ArrayToByteString(bytes)),
            ra: btoa(Util.uInt8ArrayToByteString(extraRAM))
        };
    };

    this.loadState = function(state) {
        this.format = CartridgeFormats[state.f];
        this.rom = ROM.loadState(state.r);
        bytes = Util.byteStringToUInt8Array(atob(state.b));
        extraRAM = Util.byteStringToUInt8Array(atob(state.ra));
    };


    var bytes;
    var extraRAM = new Array(1024);

    var ADDRESS_MASK = 0x0fff;


    if (rom) init(this);

}

Cartridge2K_CV.prototype = Cartridge.base;

Cartridge2K_CV.createFromSaveState = function(state) {
    var cart = new Cartridge2K_CV();
    cart.loadState(state);
    return cart;
};
