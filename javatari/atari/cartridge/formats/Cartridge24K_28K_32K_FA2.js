/**
 * Created by ppeccin on 20/11/2014.
 */

// Implements the 24K/28K/32K "FA2" CBS RAM Plus format
// Also supports SC RAM Saving on Harmony Flash memory (emulated to a "savestate" file)

function Cartridge24K_28K_32K_FA2(rom, format, pRomStartAddress) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
        romStartAddress = pRomStartAddress || 0;
        bankAddressOffset = romStartAddress;
        var numBanks = (bytes.length - romStartAddress) / BANK_SIZE;
        topBankSwitchAddress = baseBankSwitchAddress + numBanks - 1;
    }

    this.connectBus = function(pBus) {
        bus = pBus;
    };

    this.connectSaveStateSocket = function(socket) {
        saveStateSocket = socket;
    };

    this.read = function(address) {
        var val;
        var maskedAddress = maskAddress(address);

        // Check for SuperChip Extra RAM reads
        if (maskedAddress >= 256 && maskedAddress < (256 * 2))
            val = extraRAM[maskedAddress - 256];
        else
            val = bytes[bankAddressOffset + maskedAddress];

        // Normal behavior if not the Flash Operation Hotspot address
        if (maskedAddress !== FLASH_OP_HOTSPOT) return val;

        // Should trigger new operation?
        if (harmonyFlashOpInProgress === 0) {
            var op = extraRAM[FLASH_OP_CONTROL];
            if (op === 1 || op === 2) {
                performFlashOperation(op);
                return val | 0x40;	    // In progress, set bit 6
            }
        }

        // Report operation completion
        if (harmonyFlashOpInProgress !== 0) detectFlashOperationCompletion();
        else return val & 0xbf;	        // Not busy, clear bit 6

        if (harmonyFlashOpInProgress !== 0) return val | 0x40;	    // Still in progress, set bit 6
        else return val & 0xbf;		        						// Finished, clear bit 6

    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for Extra RAM writes
        if (maskedAddress < 256) extraRAM[maskedAddress] = val;
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check and perform bank-switch as necessary
        if (maskedAddress >= baseBankSwitchAddress && maskedAddress <= topBankSwitchAddress)
            bankAddressOffset = romStartAddress + BANK_SIZE * (maskedAddress - baseBankSwitchAddress);
        return maskedAddress;
    };

    var performFlashOperation = function(op) {
        harmonyFlashOpInProgress = op;
        harmonyFlashOpStartTime = Date.now();
        // 1 = read, 2 = write
        if (op === 1) readMemoryFromFlash();
        else if (op === 2) saveMemoryToFlash();
    };

    var readMemoryFromFlash = function() {
        bus.getTia().getVideoOutput().showOSD("Reading from Cartridge Flash Memory...", true);
        if (saveStateSocket)
            try {
                var data = saveStateSocket.getMedia().loadResourceFromFile(flashMemoryResourceName());
                if (data && data.length === 256) harmonyFlashMemory = data;
            } catch(ex) {
                // Give up
            }
        extraRAM = harmonyFlashMemory.slice(0);
    };

    var saveMemoryToFlash = function() {
        bus.getTia().getVideoOutput().showOSD("Writing to Cartridge Flash Memory...", true);
        harmonyFlashMemory = extraRAM.slice(0);
        if (saveStateSocket)
            saveStateSocket.getMedia().saveResourceToFile(flashMemoryResourceName(), harmonyFlashMemory);
    };

    var detectFlashOperationCompletion = function() {
        if (Date.now() - harmonyFlashOpStartTime > 1100) {		// 1.1 seconds
            harmonyFlashOpStartTime = Date.now();
            harmonyFlashOpInProgress = 0;
            extraRAM[FLASH_OP_CONTROL] = 0;			// Set return code for Successful operation
            bus.getTia().getVideoOutput().showOSD("Done.", true);
            // Signal a external state modification
            // Flash memory may have been loaded from file and changed
            // Also the waiting timer is a source of indeterminism!
            if (saveStateSocket) saveStateSocket.externalStateChange();
        }
    };

    var flashMemoryResourceName = function() {
        var name = rom.info.h + ".hfm";

        console.log(name);

        return name;
    };


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            f: this.format.name,
            r: this.rom.saveState(),
            b: btoa(Util.uInt8ArrayToByteString(bytes)),
            rs: romStartAddress,
            bo: bankAddressOffset,
            tb: topBankSwitchAddress,
            e: btoa(Util.uInt8ArrayToByteString(extraRAM))
        };
    };

    this.loadState = function(state) {
        this.format = CartridgeFormats[state.f];
        this.rom = ROM.loadState(state.r);
        bytes = Util.byteStringToUInt8Array(atob(state.b));
        romStartAddress = state.rs || 0;
        bankAddressOffset = state.bo;
        topBankSwitchAddress =  state.tb;
        extraRAM = Util.byteStringToUInt8Array(atob(state.e));
    };


    var bus;
    var saveStateSocket;

    var bytes;
    var romStartAddress = 0;
    var bankAddressOffset = 0;
    var baseBankSwitchAddress = 0x0ff5;
    var topBankSwitchAddress;
    var extraRAM = Util.arrayFill(new Array(256), 0);

    var harmonyFlashOpStartTime = Date.now();
    var harmonyFlashOpInProgress = 0;					// 0 = none, 1 = read, 2 = write
    var harmonyFlashMemory = Util.arrayFill(new Array(256), 0);

    var ADDRESS_MASK = 0x0fff;
    var BANK_SIZE = 4096;
    var FLASH_OP_HOTSPOT = 0x0ff4;
    var FLASH_OP_CONTROL = 0x00ff;


    if (rom) init(this);

}

Cartridge24K_28K_32K_FA2.prototype = Cartridge.base;

Cartridge24K_28K_32K_FA2.createFromSaveState = function(state) {
    var cart = new Cartridge24K_28K_32K_FA2();
    cart.loadState(state);
    return cart;
};
