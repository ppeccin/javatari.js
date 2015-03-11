// Copyright 2015 by Paulo Augusto Peccin. See licence.txt distributed with this file.

// Implements the 8K "FE" Robotank/Decathlon format

function Cartridge8K_FE(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
    }

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        return bytes[bankAddressOffset + maskedAddress];
    };

    this.write = function(address, val) {
        maskAddress(address);
        // Writing to ROMs is possible, but nothing is changed
    };

    var maskAddress = function(address) {
        // Bankswitching: Look at the address to determine the correct bank to be
        if ((address & 0x2000) !== 0) {		// Check bit 13. Address is like Fxxx or Dxxx?
            if (bankAddressOffset !== 0) bankAddressOffset = 0;
        } else {
            if (bankAddressOffset != BANK_SIZE) bankAddressOffset = BANK_SIZE;
        }
        return address & ADDRESS_MASK;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(Util.uInt8ArrayToByteString(bytes)),
            bo: bankAddressOffset
        };
    };

    this.loadState = function(state) {
        this.format = CartridgeFormats[state.f];
        this.rom = ROM.loadState(state.r);
        bytes = Util.byteStringToUInt8Array(atob(state.b));
        bankAddressOffset = state.bo;
    };


    var bytes;
    var bankAddressOffset = 0;

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;


    if (rom) init(this);

}

Cartridge8K_FE.prototype = Cartridge.base;

Cartridge8K_FE.createFromSaveState = function(state) {
    var cart = new Cartridge8K_FE();
    cart.loadState(state);
    return cart;
};
