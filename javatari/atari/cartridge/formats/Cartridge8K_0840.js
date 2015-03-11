// Copyright 2015 by Paulo Augusto Peccin. See licence.txt distributed with this file.

// Implements the 8K "0840" Econobanking format

function Cartridge8K_0840(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
    }

    this.read = function(address) {
        // Always add the correct offset to access bank selected
        return bytes[bankAddressOffset + (address & ADDRESS_MASK)];
    };

    this.performBankSwitchOnMonitoredAccess = function(address) {
        var addrBank = address & 0x1840;
        if (addrBank === 0x0800) {
            if (bankAddressOffset !== 0) bankAddressOffset = 0;
        } else if (addrBank === 0x0840) {
            if (bankAddressOffset !== BANK_SIZE) bankAddressOffset = BANK_SIZE;
        }
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

Cartridge8K_0840.prototype = CartridgeBankedByBusMonitoring.base;

Cartridge8K_0840.createFromSaveState = function(state) {
    var cart = new Cartridge8K_0840();
    cart.loadState(state);
    return cart;
};



