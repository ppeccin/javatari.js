// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

    jt.CartridgeFormats = {

    "4K": {
        name: "4K",
        desc: "4K Atari",
        priority: 101,
        tryFormat: function (rom) {
            if (rom.content.length >= 8 && rom.content.length <= 4096 && 4096 % rom.content.length === 0) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge4K(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return jt.Cartridge4K.createFromSaveState(state);
        }
    },

    "CV": {
        name: "CV",
        desc: "2K Commavid +RAM",
        priority: 102,
        tryFormat: function (rom) {
            if (rom.content.length === 2048 || rom.content.length === 4096) return this;	// Also accepts 4K ROMs
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge2K_CV(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return jt.Cartridge2K_CV.createFromSaveState(state);
        }
    },

    "E0": {
        name: "E0",
        desc: "8K Parker Bros.",
        priority: 102,
        tryFormat: function (rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge8K_E0(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return jt.Cartridge8K_E0.createFromSaveState(state);
        }
    },

    "F0": {
        name: "F0",
        desc: "64K Dynacom Megaboy",
        priority: 101,
        tryFormat: function (rom) {
            if (rom.content.length === 65536) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge64K_F0(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return jt.Cartridge64K_F0.createFromSaveState(state);
        }
    },

    "FE": {
        name: "FE",
        desc: "8K Robotank/Decathlon",
        priority: 103,
        tryFormat: function (rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge8K_FE(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return jt.Cartridge8K_FE.createFromSaveState(state);
        }
    },

    "E7": {
        name: "E7",
        desc: "16K M-Network",
        priority: 102,
        tryFormat: function (rom) {
            if (rom.content.length === 16384) return this;
        },
        createCartridgeFromRom: function (rom) {
            return new jt.Cartridge16K_E7(rom, this);
        },
        createCartridgeFromSaveState: function (state) {
            return jt.Cartridge16K_E7.createFromSaveState(state);
        }
    },

    "F8": {
        name: "F8",
        desc: "8K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff8, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "F6": {
        name: "F6",
        desc: "16K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 16384) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff6, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "F4": {
        name: "F4",
        desc: "32K Atari (+RAM)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 32768) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff4, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "FA2cu": {
        name: "FA2cu",
        desc: "32K CBS RAM Plus CU Image",
        priority: 103,
        tryFormat: function(rom) {
            if (rom.content.length === 32768) {
                // Check for the values $10adab1e, for "loadable", starting at position 32 (33rd byte)
                // This is a hint that the content is in CU format
                var foundHint = jt.Util.arraysEqual(rom.content.slice(32, 32 + 4), this.cuMagicWord);
                this.priority = 103 - (foundHint ? 30 : 0);
                return this;
            }
        },
        createCartridgeFromRom: function(rom) {
            // ROM is only 28K. The first 1024 bytes are custom ARM content. ROM begins after that
            return new jt.Cartridge24K_28K_32K_FA2(rom, this, 1024);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge24K_28K_32K_FA2.createFromSaveState(state);
        },
        cuMagicWord: [0x1e, 0xab, 0xad, 0x10]
    },

    "FA2": {
        name: "FA2",
        desc: "24K/28K/32K CBS RAM Plus",
        priority: 102,
        tryFormat: function(rom) {
            if (rom.content.length === 24576 || rom.content.length === 28672 || rom.content.length === 32768) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge24K_28K_32K_FA2(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge24K_28K_32K_FA2.createFromSaveState(state);
        }
    },

    "FA": {
        name: "FA",
        desc: "12K CBS RAM Plus",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length === 12288) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0ff8, true, 256);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "EF": {
        name: "EF",
        desc: "8K-64K H. Runner (+RAM)",
        priority: 114,
        tryFormat: function(rom) {
            if (rom.content.length % 4096 === 0 && rom.content.length >= 8192 && rom.content.length <= 65536) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.CartridgeBankedByMaskedRange(rom, this, 0x0fe0, null, 128);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.CartridgeBankedByMaskedRange.createFromSaveState(state);
        }
    },

    "DPCa": {
        name: "DPCa",
        desc: "10K DPC Pitfall 2 (Enhanced Audio)",
        priority: 101,
        tryFormat: function(rom) {
            if (rom.content.length >= (8192 + 2048) && rom.content.length <= (8192 + 2048 + 256)) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge10K_DPCa(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge10K_DPCa.createFromSaveState(state);
        }
    },

    "3F": {
        name: "3F",
        desc: "8K-512K Tigervision",
        priority: 112,
        tryFormat: function(rom) {
            if (rom.content.length % 2048 === 0 && rom.content.length <= 256 * 2048) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_512K_3F(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge8K_512K_3F.createFromSaveState(state);
        }
    },

    "3E": {
        name: "3E",
        desc: "8K-512K Tigervision (+RAM)",
        priority: 111,
        tryFormat: function(rom) {
            if (rom.content.length % 2048 === 0 && rom.content.length <= 256 * 2048) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_512K_3E(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge8K_512K_3E.createFromSaveState(state);
        }
    },

    "X07": {
        name: "X07",
        desc: "64K AtariAge",
        priority: 102,
        tryFormat: function(rom) {
            if (rom.content.length === 65536) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge64K_X07(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge64K_X07.createFromSaveState(state);
        }
    },

    "0840": {
        name: "0840",
        desc: "8K Econobanking",
        priority: 116,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_0840(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge8K_0840.createFromSaveState(state);
        }
    },

    "UA": {
        name: "UA",
        desc: "8K UA Limited",
        priority: 115,
        tryFormat: function(rom) {
            if (rom.content.length === 8192) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_UA(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge8K_UA.createFromSaveState(state);
        }
    },

    "SB": {
        name: "SB",
        desc: "8K-256K Superbanking",
        priority: 113,
        tryFormat: function(rom) {
            if (rom.content.length % 4096 === 0 && rom.content.length >= 8192 && rom.content.length <= 64 * 4096) return this;
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_256K_SB(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge8K_256K_SB.createFromSaveState(state);
        }
    },

    "AR": {
        name: "AR",
        desc: "8K-64K Arcadia/Starpath/Supercharger",
        priority: 101,
        tryFormat: function(rom) {
            // Any number of parts between 1 and 8
            if (rom.content.length % jt.Cartridge8K_64K_AR.PART_SIZE === 0 && rom.content.length / jt.Cartridge8K_64K_AR.PART_SIZE >= 1
                && rom.content.length / jt.Cartridge8K_64K_AR.PART_SIZE <= 8) {
                // Check if the content starts with Part 0
                jt.Cartridge8K_64K_AR.checkTape(rom);      // Will throw exception if not a Tape Start or Full Tape
                return this;
            }
        },
        createCartridgeFromRom: function(rom) {
            return new jt.Cartridge8K_64K_AR(rom, this);
        },
        createCartridgeFromSaveState: function(state) {
            return jt.Cartridge8K_64K_AR.createFromSaveState(state);
        }
    }

};
