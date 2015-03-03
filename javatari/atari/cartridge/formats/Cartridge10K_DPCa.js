/**
 * Created by ppeccin on 20/11/2014.
 */

// Implements the 8K + 2K "DPCa" (Pitfall2) format, enhanced version with TIA audio updates every DPC audio clock!

function Cartridge10K_DPCa(rom, format) {

    function init(self) {
        self.rom = rom;
        self.format = format;
        bytes = rom.content;        // uses the content of the ROM directly
    }

    this.powerOn = function() {
        audioClockDivider = AUDIO_CLOCK_DEFAULT_DIVIDER;
    };

    this.connectBus = function(aBus) {
        bus = aBus;
    };

    this.needsClock = function() {
        return true;
    };

    this.read = function(address) {
        var maskedAddress = maskAddress(address);
        // Check for DPC register read
        if (maskedAddress <= 0x03f || (maskedAddress >= 0x800 && maskedAddress <= 0x83f))
            return readDPCRegister(maskedAddress & 0x00ff);
        // Always add the correct bank offset
        return bytes[bankAddressOffset + maskedAddress];	// ROM
    };

    this.write = function(address, val) {
        var maskedAddress = maskAddress(address);
        // Check for DPC register write
        if ((maskedAddress >= 0x040 && maskedAddress <= 0x07f) ||
            (maskedAddress >= 0x840 && maskedAddress <= 0x87f))
            writeDPCRegister(maskedAddress & 0x00ff, val);
    };

    this.clockPulse = function() {
        //if (audioClockCounter-- > 0) return;
        //audioClockCounter = audioClockDivider;
        //for (var f = 5; f <= 7; f++) {
        //    if (!audioMode[f]) continue;
        //    fetcherPointer[f]--;
        //    if ((fetcherPointer[f] & 0x00ff) == 0xff)
        //        setFetcherPointer(f, fetcherPointer[f] & 0xff00 | fetcherStart[f]);
        //    updateFetcherMask(f);
        //    if (!audioChanged) audioChanged = true;
        //}
        //if (!audioChanged) return;
        //// Send a volume update do TIA Audio Channel 0
        //updateAudioOutput();
        //bus.getTia().write(0x19, audioOutput);
    };

    var maskAddress = function(address) {
        var maskedAddress = address & ADDRESS_MASK;
        // Check and perform bank-switch as necessary
        if (maskedAddress === 0xff8) bankAddressOffset = 0;
        else if (maskedAddress === 0xff9) bankAddressOffset = 4096;
        return maskedAddress;
    };

    // TODO Fix bug when reading register as normal fetcher while in audio mode
    var readDPCRegister = function(reg) {
        //// Random number
        //if (reg >= 0x00 && reg <= 0x03) {
        //    clockRandomNumber();
        //    return randomNumber;
        //}
        //// Audio value (MOVAMT not supported)
        //if (reg >= 0x04 && reg <= 0x07) {
        //    if (audioChanged) updateAudioOutput();
        //    return audioOutput;
        //}
        //// Fetcher unmasked value
        //if (reg >= 0x08 && reg <= 0x0f) {
        //    byte res = bytes[DPC_ROM_END - fetcherPointer[reg - 0x08]];
        //    clockFetcher(reg - 0x08);
        //    return res;
        //}
        //// Fetcher masked value
        //if (reg >= 0x10 && reg <= 0x17) {
        //    byte res = (byte) (bytes[DPC_ROM_END - fetcherPointer[reg - 0x10]] & fetcherMask[reg - 0x10]);
        //    clockFetcher(reg - 0x10);
        //    return res;
        //}
        //// Fetcher masked value, nibbles swapped
        //if (reg >= 0x18 && reg <= 0x1f) {
        //    byte res = (byte) (bytes[DPC_ROM_END - fetcherPointer[reg - 0x18]] & fetcherMask[reg - 0x18]);
        //    clockFetcher(reg - 0x18);
        //    res = (byte) ((res & 0x0f << 4) | (res & 0xf0 >> 4));
        //    return res;
        //}
        //// Fetcher masked value, byte reversed
        //if (reg >= 0x20 && reg <= 0x27) {
        //    byte res = (byte) (bytes[DPC_ROM_END - fetcherPointer[reg - 0x20]] & fetcherMask[reg - 0x20]);
        //    clockFetcher(reg - 0x20);
        //    res = (byte) (Integer.reverse(res) >>> (Integer.SIZE - Byte.SIZE));
        //    return res;
        //}
        //// Fetcher masked value, byte rotated right
        //if (reg >= 0x28 && reg <= 0x2f) {
        //    byte res = (byte) (bytes[DPC_ROM_END - fetcherPointer[reg - 0x28]] & fetcherMask[reg - 0x28]);
        //    clockFetcher(reg - 0x28);
        //    res = (byte) (((res >>> 1) | (res << 7)) & 0xff);
        //    return res;
        //}
        //// Fetcher masked value, byte rotated left
        //if (reg >= 0x30 && reg <= 0x37) {
        //    byte res = (byte) (bytes[DPC_ROM_END - fetcherPointer[reg - 0x30]] & fetcherMask[reg - 0x30]);
        //    clockFetcher(reg - 0x30);
        //    res = (byte) (((res << 1) | ((res >> 7) & 0x01)) & 0xff);
        //    return res;
        //}
        //// Fetcher mask
        //if (reg >= 0x38 && reg <= 0x3f) {
        //    return fetcherMask[reg - 0x38];
        //}
        return 0;
    };

    var writeDPCRegister = function(reg, b) {
        //// Fetchers Start
        //if (reg >= 0x40 && reg <= 0x47) {
        //    int f = reg - 0x40;
        //    fetcherStart[f] = b;
        //    if ((byte)(fetcherPointer[f] & 0xff) == fetcherStart[f]) fetcherMask[f] = (byte)0xff;
        //    return;
        //}
        //// Fetchers End
        //if (reg >= 0x48 && reg <= 0x4f) {
        //    fetcherEnd[reg - 0x48] = b; fetcherMask[reg - 0x48] = (byte)0x00; return;
        //}
        //// Fetchers Pointers LSB
        //if (reg >= 0x50 && reg <= 0x57) {
        //    setFetcherPointer(reg - 0x50, (fetcherPointer[reg - 0x50] & 0xff00) | (b & 0xff)); return;			// LSB
        //}
        //// Fetchers 0-3 Pointers MSB
        //if (reg >= 0x58 && reg <= 0x5b) {
        //    setFetcherPointer(reg - 0x58, (fetcherPointer[reg - 0x58] & 0x00ff) | ((b & (0x07)) << 8)); return;	// MSB bits 0-2
        //}
        //// Fetchers 4 Pointers MSB (Draw Line enable not supported)
        //if (reg == 0x5c) {
        //    setFetcherPointer(4, (fetcherPointer[4] & 0x00ff) | ((b & (0x07)) << 8));							// MSB bits 0-2
        //    return;
        //}
        //// Fetchers 5-7 Pointers MSB and Audio Mode enable
        //if (reg >= 0x5d && reg <= 0x5f) {
        //    setFetcherPointer(reg - 0x58, (fetcherPointer[reg - 0x58] & 0x00ff) + ((b & (0x07)) << 8));			// MSB bits 0-2
        //    audioMode[reg - 0x58] = (b & 0x10) != 0;
        //    return;
        //}
        //// Draw Line MOVAMT value (not supported)
        //if (reg >= 0x60 && reg <= 0x67) {
        //    return;
        //}
        //// 0x68 - 0x6f Not used
        //// Random Number reset
        //if (reg >= 0x70 && reg <= 0x77) {
        //    randomNumber = (byte) 0x00; return;
        //}
        //// 0x78 - 0x7f Not used
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


    var AUDIO_MIXED_OUTPUT = [0x0, 0x5, 0x5, 0xa, 0x5, 0xa, 0xa, 0xf];
    // var AUDIO_MIXED_OUTPUT = [0x0, 0x4, 0x5, 0x9, 0x6, 0xa, 0xb, 0xf];   // Per specification

    var bytes;
    var bankAddressOffset = 0;
    var randomNumber = 0;
    var fetcherPointer = new Array(8);
    var fetcherStart = new Array(8);
    var fetcherEnd = new Array(8);
    var fetcherMask = new Array(8);
    var audioMode = new Array(8);
    var audioClockDivider = AUDIO_CLOCK_DEFAULT_DIVIDER;
    var audioClockCounter = 0;
    var audioChanged = true;
    var audioOutput = 0;

    var ADDRESS_MASK = 0x0fff;
    var AUDIO_CLOCK_DEFAULT_DIVIDER = 60;


    if (rom) init(this);

}

Cartridge10K_DPCa.prototype = Cartridge.base;

Cartridge10K_DPCa.createFromSaveState = function(state) {
    var cart = new Cartridge10K_DPCa();
    cart.loadState(state);
    return cart;
};
