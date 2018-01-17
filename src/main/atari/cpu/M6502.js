// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.M6502 = function() {
"use strict";

    var self = this;

    this.powerOn = function() {
        this.reset();
    };

    this.powerOff = function() {
    };

    this.clockPulse = function() {
        if (!RDY) return;      // TODO Should be ignored in the last cycle of the instruction
        T++;
        instruction[T]();
    };

    this.connectBus = function(aBus) {
        bus = aBus;
    };

    this.setRDY = function(boo) {
        RDY = boo;
    };

    this.reset = function() {
        I = 1;
        T = -1;
        opcode = -1;
        instruction = boostrapInstruction;
        PC = bus.read(RESET_VECTOR) | (bus.read(RESET_VECTOR + 1) << 8);
        this.setRDY(true);
    };


    // Interfaces
    var bus;
    var RDY = false;

    // Registers
    var PC = 0;
    var SP = 0;
    var A = 0;
    var X = 0;
    var Y = 0;

    // Status Bits
    var N = 0;
    var V = 0;
    var D = 0;
    var I = 0;
    var Z = 0;
    var C = 0;

    // Internal decoding registers
    var T = -1;
    var opcode = -1;
    var instruction;
    var data = 0;
    var AD = 0;
    var BA = 0;
    var BALCrossed = false;
    var IA = 0;
    var branchOffset = 0;
    var branchOffsetCrossAdjust = 0;

    // Vectors
    //var NMI_VECTOR = 0xfffa;
    var RESET_VECTOR = 0xfffc;
    var IRQ_VECTOR = 0xfffe;

    // Index registers names
    var rX = 0;
    var rY = 1;

    // Status bits names
    var bN = 7;
    var bV = 6;
    // var bE = 5;	// Not used
    // var bB = 4;	// Not used
    // var bD = 3;  // Not used
    // var bI = 2;  // Not used
    var bZ = 1;
    var bC = 0;

    // Auxiliary variables
    //noinspection JSUnusedGlobalSymbols
    this.debug = false;
    //noinspection JSUnusedGlobalSymbols
    this.trace = false;


    // Internal operations

    var fetchOpcodeAndDecodeInstruction = function() {
        opcode = bus.read(PC);
        instruction = instructions[opcode];
        T = 0;

        // if (self.trace) self.breakpoint("TRACE");
        // console.log("PC: " + PC + ", op: " + opcode + ": " + opcodes[opcode]);

        PC++;
    };

    var fetchNextOpcode = fetchOpcodeAndDecodeInstruction;
    var boostrapInstruction = [ fetchOpcodeAndDecodeInstruction ];

    var fetchOpcodeAndDiscard = function() {
        bus.read(PC);
    };

    var fetchBranchOffset = function() {
        branchOffset = bus.read(PC);
        PC++;
    };

    var fetchADL = function() {
        AD = bus.read(PC);
        PC++;
    };

    var fetchADH = function() {
        AD |= bus.read(PC) << 8;
        PC++;
    };

    var fetchADLFromBA = function() {
        AD = bus.read(BA);
    };

    var fetchADHFromBA = function() {
        AD |= bus.read(BA) << 8;
    };

    var fetchBAL = function() {
        BA = bus.read(PC);
        PC++;
    };

    var fetchBAH = function() {
        BA |= bus.read(PC) << 8;
        PC++;
    };

    var fetchBALFromIA = function() {
        BA = bus.read(IA);
    };

    var fetchBAHFromIA = function() {
        BA |= bus.read(IA) << 8;
    };

    var addXtoBAL = function() {
        var low = (BA & 255) + X;
        BALCrossed = low > 255;
        BA = (BA & 0xff00) | (low & 255);
    };

    var addYtoBAL = function() {
        var low = (BA & 255) + Y;
        BALCrossed = low > 255;
        BA = (BA & 0xff00) | (low & 255);
    };

    var add1toBAL = function() {
        var low = (BA & 255) + 1;
        BALCrossed = low > 255;
        BA = (BA & 0xff00) | (low & 255);
    };

    var add1toBAHifBALCrossed = function() {
        if (BALCrossed)
            BA = (BA + 0x0100) & 0xffff;
    };

    var fetchIAL = function() {
        IA = bus.read(PC);
        PC++;
    };

    var fetchIAH = function() {
        IA |= bus.read(PC) << 8;
        PC++;
    };

    var add1toIAL = function() {
        var low = (IA & 255) + 1;
        IA = (IA & 0xff00) | (low & 255);
    };

    var fetchDataFromImmediate = function() {
        data = bus.read(PC);
        PC++;
    };

    var fetchDataFromAD = function() {
        data = bus.read(AD);
    };

    var fetchDataFromBA = function() {
        data = bus.read(BA);
    };

    var writeDataToAD = function() {
        bus.write(AD, data);
    };

    var writeDataToBA = function() {
        bus.write(BA, data);
    };

    var addBranchOffsetToPCL = function() {
        var oldLow = (PC & 0x00ff);
        var newLow = (oldLow + branchOffset) & 255;
        // Negative offset?
        if (branchOffset > 127)
            branchOffsetCrossAdjust = (newLow > oldLow) ? -0x0100 : 0;
        else
            branchOffsetCrossAdjust = (newLow < oldLow) ? 0x0100 : 0;
        PC = (PC & 0xff00) | newLow;
    };

    var adjustPCHForBranchOffsetCross = function() {
        PC = (PC + branchOffsetCrossAdjust) & 0xffff;
    };

    var setZ = function(val) {
        Z = (val === 0) ? 1 : 0;
    };

    var setN = function(val) {
        N = (val & 0x080) ? 1 : 0;
    };

    var setV = function(boo) {
        V = boo ? 1 : 0;
    };

    var setC = function(boo) {
        C = boo ? 1 : 0;
    };

    var popFromStack = function() {
        SP = (SP + 1) & 255;
        return bus.read(0x0100 + SP);
    };

    var peekFromStack = function() {
        return bus.read(0x0100 + SP);
    };

    var pushToStack = function(val) {
        bus.write(0x0100 + SP, val);
        SP = (SP - 1) & 255;
    };

    var getStatusBits = function() {
        return N << 7 | V << 6 | 0x30                 // Always push with E (bit 5) and B (bit 4) ON
            |  D << 3 | I << 2 | Z << 1 | C;
    };

    var setStatusBits = function(val) {
        N = val >>> 7; V = val >>> 6 & 1;             // E and B flags actually do not exist as real flags, so ignore
        D = val >>> 3 & 1; I = val >>> 2 & 1; Z = val >>> 1 & 1; C = val & 1;
    };

    var illegalOpcode = function(op) {
        if (self.debug) self.breakpoint("Illegal Opcode: " + op);
    };


    // Addressing routines

    var implied = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            function implied() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var immediateRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchDataFromImmediate,
            function immediateRead() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var zeroPageRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,                        // ADH will be zero
            fetchDataFromAD,
            function zeroPageRead() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var absoluteRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            fetchDataFromAD,
            function absoluteRead() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var indirectXRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,                        // BAH will be zero
            fetchDataFromBA,
            function indirectXRead1() {
                addXtoBAL();
                fetchADLFromBA();
            },
            function indirectXRead2() {
                add1toBAL();
                fetchADHFromBA();
            },
            fetchDataFromAD,
            function indirectXRead3() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var absoluteIndexedRead = function(index) {
        var addIndex = index === rX ? addXtoBAL : addYtoBAL;
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,
                fetchBAH,
                function absoluteIndexedRead1() {
                    addIndex();
                    fetchDataFromBA();
                    add1toBAHifBALCrossed();
                },
                function absoluteIndexedRead2() {
                    if (BALCrossed) {
                        fetchDataFromBA();
                    } else {
                        operation();
                        fetchNextOpcode();
                    }
                },
                function absoluteIndexedRead3() {
                    operation();
                    fetchNextOpcode();
                }
            ];
        };
    };

    var zeroPageIndexedRead = function(index) {
        var addIndex = index === rX ? addXtoBAL : addYtoBAL;
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,                        // BAH will be zero
                fetchDataFromBA,
                function zeroPageIndexedRead1() {
                    addIndex();
                    fetchDataFromBA();
                },
                function zeroPageIndexedRead2() {
                    operation();
                    fetchNextOpcode();
                }
            ];
        };
    };

    var indirectYRead = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,                           // IAH will be zero
            fetchBALFromIA,
            function indirectYRead1() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function indirectYRead2() {
                addYtoBAL();
                fetchDataFromBA();
                add1toBAHifBALCrossed();
            },
            function indirectYRead3() {
                if(BALCrossed) {
                    fetchDataFromBA();
                } else {
                    operation();
                    fetchNextOpcode();
                }
            },
            function indirectYRead4() {
                operation();
                fetchNextOpcode();
            }
        ];
    };

    var zeroPageWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,                        // ADH will be zero
            function zeroPageWrite() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var absoluteWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            function absoluteWrite() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var indirectXWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,                        // BAH will be zero
            fetchDataFromBA,
            function indirectXWrite1() {
                addXtoBAL();
                fetchADLFromBA();
            },
            function indirectXWrite2() {
                add1toBAL();
                fetchADHFromBA();
            },
            function indirectXWrite3() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var absoluteIndexedWrite = function(index) {
        var addIndex = index === rX ? addXtoBAL : addYtoBAL;
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,
                fetchBAH,
                function absoluteIndexedWrite1() {
                    addIndex();
                    fetchDataFromBA();
                    add1toBAHifBALCrossed();
                },
                function absoluteIndexedWrite2() {
                    operation();
                    writeDataToBA();
                },
                fetchNextOpcode
            ];
        };
    };

    var zeroPageIndexedWrite = function(index) {
        var addIndex = index === rX ? addXtoBAL : addYtoBAL;
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,                        // BAH will be zero
                fetchDataFromBA,
                function zeroPageIndexedWrite() {
                    addIndex();
                    operation();
                    writeDataToBA();
                },
                fetchNextOpcode
            ];
        };
    };

    var indirectYWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,                           // IAH will be zero
            fetchBALFromIA,
            function indirectYWrite1() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function indirectYWrite2() {
                addYtoBAL();
                fetchDataFromBA();
                add1toBAHifBALCrossed();
            },
            function indirectYWrite3() {
                operation();
                writeDataToBA();
            },
            fetchNextOpcode
        ];
    };


    var zeroPageReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,                        // ADH will be zero
            fetchDataFromAD,
            writeDataToAD,
            function zeroPageReadModifyWrite() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var absoluteReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            fetchDataFromAD,
            writeDataToAD,
            function absoluteReadModifyWrite() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var zeroPageIndexedReadModifyWrite = function(index) {
        var addIndex = index === rX ? addXtoBAL : addYtoBAL;
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,                        // BAH will be zero
                fetchDataFromBA,
                function zeroPageIndexedReadModifyWrite1() {
                    addIndex();
                    fetchDataFromBA();
                },
                writeDataToBA,
                function zeroPageIndexedReadModifyWrite2() {
                    operation();
                    writeDataToBA();
                },
                fetchNextOpcode
            ];
        };
    };

    var absoluteIndexedReadModifyWrite = function(index) {
        var addIndex = index === rX ? addXtoBAL : addYtoBAL;
        return function(operation) {
            return [
                fetchOpcodeAndDecodeInstruction,
                fetchBAL,
                fetchBAH,
                function absoluteIndexedReadModifyWrite1() {
                    addIndex();
                    fetchDataFromBA();
                    add1toBAHifBALCrossed();
                },
                fetchDataFromBA,
                writeDataToBA,
                function absoluteIndexedReadModifyWrite2() {
                    operation();
                    writeDataToBA();
                },
                fetchNextOpcode
            ];
        };
    };

    var indirectXReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBAL,                        // BAH will be zero
            fetchDataFromBA,
            function indirectXReadModifyWrite1() {
                addXtoBAL();
                fetchADLFromBA();
            },
            function indirectXReadModifyWrite2() {
                add1toBAL();
                fetchADHFromBA();
            },
            fetchDataFromAD,
            writeDataToAD,
            function indirectXReadModifyWrite3() {
                operation();
                writeDataToAD();
            },
            fetchNextOpcode
        ];
    };

    var indirectYReadModifyWrite = function(operation) {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,                           // IAH will be zero
            fetchBALFromIA,
            function indirectYReadModifyWrite1() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function indirectYReadModifyWrite2() {
                addYtoBAL();
                fetchDataFromBA();
                add1toBAHifBALCrossed();
            },
            fetchDataFromBA,
            writeDataToBA,
            function indirectYReadModifyWrite3() {
                operation();
                writeDataToBA();
            },
            fetchNextOpcode
        ];
    };


    // Instructions  ========================================================================================

    // Complete instruction set
    var opcodes =      new Array(256);
    var instructions = new Array(256);

    opcodes[0x00] = "BRK";  instructions[0x00] = newBRK();
    opcodes[0x01] = "ORA";  instructions[0x01] = newORA(indirectXRead);
    opcodes[0x02] = "uKIL"; instructions[0x02] = newuKIL();
    opcodes[0x03] = "uSLO"; instructions[0x03] = newuSLO(indirectXReadModifyWrite);
    opcodes[0x04] = "uNOP"; instructions[0x04] = newuNOP(zeroPageRead);
    opcodes[0x05] = "ORA";  instructions[0x05] = newORA(zeroPageRead);
    opcodes[0x06] = "ASL";  instructions[0x06] = newASL(zeroPageReadModifyWrite);
    opcodes[0x07] = "uSLO"; instructions[0x07] = newuSLO(zeroPageReadModifyWrite);
    opcodes[0x08] = "PHP";  instructions[0x08] = newPHP();
    opcodes[0x09] = "ORA";  instructions[0x09] = newORA(immediateRead);
    opcodes[0x0a] = "ASL";  instructions[0x0a] = newASL_ACC();
    opcodes[0x0b] = "uANC"; instructions[0x0b] = newuANC(immediateRead);
    opcodes[0x0c] = "uNOP"; instructions[0x0c] = newuNOP(absoluteRead);
    opcodes[0x0d] = "ORA";  instructions[0x0d] = newORA(absoluteRead);
    opcodes[0x0e] = "ASL";  instructions[0x0e] = newASL(absoluteReadModifyWrite);
    opcodes[0x0f] = "uSLO"; instructions[0x0f] = newuSLO(absoluteReadModifyWrite);
    opcodes[0x10] = "BPL";  instructions[0x10] = newBxx(bN, 0);                 // BPL
    opcodes[0x11] = "ORA";  instructions[0x11] = newORA(indirectYRead);
    opcodes[0x12] = "uKIL"; instructions[0x12] = newuKIL();
    opcodes[0x13] = "uSLO"; instructions[0x13] = newuSLO(indirectYReadModifyWrite);
    opcodes[0x14] = "uNOP"; instructions[0x14] = newuNOP(zeroPageIndexedRead(rX));
    opcodes[0x15] = "ORA";  instructions[0x15] = newORA(zeroPageIndexedRead(rX));
    opcodes[0x16] = "ASL";  instructions[0x16] = newASL(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x17] = "uSLO"; instructions[0x17] = newuSLO(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x18] = "CLC";  instructions[0x18] = newCLC();
    opcodes[0x19] = "ORA";  instructions[0x19] = newORA(absoluteIndexedRead(rY));
    opcodes[0x1a] = "uNOP"; instructions[0x1a] = newuNOP(implied);
    opcodes[0x1b] = "uSLO"; instructions[0x1b] = newuSLO(absoluteIndexedReadModifyWrite(rY));
    opcodes[0x1c] = "uNOP"; instructions[0x1c] = newuNOP(absoluteIndexedRead(rX));
    opcodes[0x1d] = "ORA";  instructions[0x1d] = newORA(absoluteIndexedRead(rX));
    opcodes[0x1e] = "ASL";  instructions[0x1e] = newASL(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x1f] = "uSLO"; instructions[0x1f] = newuSLO(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x20] = "JSR";  instructions[0x20] = newJSR();
    opcodes[0x21] = "AND";  instructions[0x21] = newAND(indirectXRead);
    opcodes[0x22] = "uKIL"; instructions[0x22] = newuKIL();
    opcodes[0x23] = "uRLA"; instructions[0x23] = newuRLA(indirectXReadModifyWrite);
    opcodes[0x24] = "BIT";  instructions[0x24] = newBIT(zeroPageRead);
    opcodes[0x25] = "AND";  instructions[0x25] = newAND(zeroPageRead);
    opcodes[0x26] = "ROL";  instructions[0x26] = newROL(zeroPageReadModifyWrite);
    opcodes[0x27] = "uRLA"; instructions[0x27] = newuRLA(zeroPageReadModifyWrite);
    opcodes[0x28] = "PLP";  instructions[0x28] = newPLP();
    opcodes[0x29] = "AND";  instructions[0x29] = newAND(immediateRead);
    opcodes[0x2a] = "ROL";  instructions[0x2a] = newROL_ACC();
    opcodes[0x2b] = "uANC"; instructions[0x2b] = newuANC(immediateRead);
    opcodes[0x2c] = "BIT";  instructions[0x2c] = newBIT(absoluteRead);
    opcodes[0x2d] = "AND";  instructions[0x2d] = newAND(absoluteRead);
    opcodes[0x2e] = "ROL";  instructions[0x2e] = newROL(absoluteReadModifyWrite);
    opcodes[0x2f] = "uRLA"; instructions[0x2f] = newuRLA(absoluteReadModifyWrite);
    opcodes[0x30] = "BMI";  instructions[0x30] = newBxx(bN, 1);                 // BMI
    opcodes[0x31] = "AND";  instructions[0x31] = newAND(indirectYRead);
    opcodes[0x32] = "uKIL"; instructions[0x32] = newuKIL();
    opcodes[0x33] = "uRLA"; instructions[0x33] = newuRLA(indirectYReadModifyWrite);
    opcodes[0x34] = "uNOP"; instructions[0x34] = newuNOP(zeroPageIndexedRead(rX));
    opcodes[0x35] = "AND";  instructions[0x35] = newAND(zeroPageIndexedRead(rX));
    opcodes[0x36] = "ROL";  instructions[0x36] = newROL(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x37] = "uRLA"; instructions[0x37] = newuRLA(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x38] = "SEC";  instructions[0x38] = newSEC();
    opcodes[0x39] = "AND";  instructions[0x39] = newAND(absoluteIndexedRead(rY));
    opcodes[0x3a] = "uNOP"; instructions[0x3a] = newuNOP(implied);
    opcodes[0x3b] = "uRLA"; instructions[0x3b] = newuRLA(absoluteIndexedReadModifyWrite(rY));
    opcodes[0x3c] = "uNOP"; instructions[0x3c] = newuNOP(absoluteIndexedRead(rX));
    opcodes[0x3d] = "AND";  instructions[0x3d] = newAND(absoluteIndexedRead(rX));
    opcodes[0x3e] = "ROL";  instructions[0x3e] = newROL(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x3f] = "uRLA"; instructions[0x3f] = newuRLA(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x40] = "RTI";  instructions[0x40] = newRTI();
    opcodes[0x41] = "EOR";  instructions[0x41] = newEOR(indirectXRead);
    opcodes[0x42] = "uKIL"; instructions[0x42] = newuKIL();
    opcodes[0x43] = "uSRE"; instructions[0x43] = newuSRE(indirectXReadModifyWrite);
    opcodes[0x44] = "uNOP"; instructions[0x44] = newuNOP(zeroPageRead);
    opcodes[0x45] = "EOR";  instructions[0x45] = newEOR(zeroPageRead);
    opcodes[0x46] = "LSR";  instructions[0x46] = newLSR(zeroPageReadModifyWrite);
    opcodes[0x47] = "uSRE"; instructions[0x47] = newuSRE(zeroPageReadModifyWrite);
    opcodes[0x48] = "PHA";  instructions[0x48] = mewPHA();
    opcodes[0x49] = "EOR";  instructions[0x49] = newEOR(immediateRead);
    opcodes[0x4a] = "LSR";  instructions[0x4a] = newLSR_ACC();
    opcodes[0x4b] = "uASR"; instructions[0x4b] = newuASR(immediateRead);
    opcodes[0x4c] = "JMP";  instructions[0x4c] = newJMP_ABS();
    opcodes[0x4d] = "EOR";  instructions[0x4d] = newEOR(absoluteRead);
    opcodes[0x4e] = "LSR";  instructions[0x4e] = newLSR(absoluteReadModifyWrite);
    opcodes[0x4f] = "uSRE"; instructions[0x4f] = newuSRE(absoluteReadModifyWrite);
    opcodes[0x50] = "BVC";  instructions[0x50] = newBxx(bV, 0);                 // BVC
    opcodes[0x51] = "EOR";  instructions[0x51] = newEOR(indirectYRead);
    opcodes[0x52] = "uKIL"; instructions[0x52] = newuKIL();
    opcodes[0x53] = "uSRE"; instructions[0x53] = newuSRE(indirectYReadModifyWrite);
    opcodes[0x54] = "uNOP"; instructions[0x54] = newuNOP(zeroPageIndexedRead(rX));
    opcodes[0x55] = "EOR";  instructions[0x55] = newEOR(zeroPageIndexedRead(rX));
    opcodes[0x56] = "LSR";  instructions[0x56] = newLSR(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x57] = "uSRE"; instructions[0x57] = newuSRE(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x58] = "CLI";  instructions[0x58] = newCLI();
    opcodes[0x59] = "EOR";  instructions[0x59] = newEOR(absoluteIndexedRead(rY));
    opcodes[0x5a] = "uNOP"; instructions[0x5a] = newuNOP(implied);
    opcodes[0x5b] = "uSRE"; instructions[0x5b] = newuSRE(absoluteIndexedReadModifyWrite(rY));
    opcodes[0x5c] = "uNOP"; instructions[0x5c] = newuNOP(absoluteIndexedRead(rX));
    opcodes[0x5d] = "EOR";  instructions[0x5d] = newEOR(absoluteIndexedRead(rX));
    opcodes[0x5e] = "LSR";  instructions[0x5e] = newLSR(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x5f] = "uSRE"; instructions[0x5f] = newuSRE(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x60] = "RTS";  instructions[0x60] = newRTS();
    opcodes[0x61] = "ADC";  instructions[0x61] = newADC(indirectXRead);
    opcodes[0x62] = "uKIL"; instructions[0x62] = newuKIL();
    opcodes[0x63] = "uRRA"; instructions[0x63] = newuRRA(indirectXReadModifyWrite);
    opcodes[0x64] = "uNOP"; instructions[0x64] = newuNOP(zeroPageRead);
    opcodes[0x65] = "ADC";  instructions[0x65] = newADC(zeroPageRead);
    opcodes[0x66] = "ROR";  instructions[0x66] = newROR(zeroPageReadModifyWrite);
    opcodes[0x67] = "uRRA"; instructions[0x67] = newuRRA(zeroPageReadModifyWrite);
    opcodes[0x68] = "PLA";  instructions[0x68] = newPLA();
    opcodes[0x69] = "ADC";  instructions[0x69] = newADC(immediateRead);
    opcodes[0x6a] = "ROR";  instructions[0x6a] = newROR_ACC();
    opcodes[0x6b] = "uARR"; instructions[0x6b] = newuARR(immediateRead);
    opcodes[0x6c] = "JMP";  instructions[0x6c] = newJMP_IND();
    opcodes[0x6d] = "ADC";  instructions[0x6d] = newADC(absoluteRead);
    opcodes[0x6e] = "ROR";  instructions[0x6e] = newROR(absoluteReadModifyWrite);
    opcodes[0x6f] = "uRRA"; instructions[0x6f] = newuRRA(absoluteReadModifyWrite);
    opcodes[0x70] = "BVS";  instructions[0x70] = newBxx(bV, 1);                 // BVS
    opcodes[0x71] = "ADC";  instructions[0x71] = newADC(indirectYRead);
    opcodes[0x72] = "uKIL"; instructions[0x72] = newuKIL();
    opcodes[0x73] = "uRRA"; instructions[0x73] = newuRRA(indirectYReadModifyWrite);
    opcodes[0x74] = "uNOP"; instructions[0x74] = newuNOP(zeroPageIndexedRead(rX));
    opcodes[0x75] = "ADC";  instructions[0x75] = newADC(zeroPageIndexedRead(rX));
    opcodes[0x76] = "ROR";  instructions[0x76] = newROR(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x77] = "uRRA"; instructions[0x77] = newuRRA(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0x78] = "SEI";  instructions[0x78] = newSEI();
    opcodes[0x79] = "ADC";  instructions[0x79] = newADC(absoluteIndexedRead(rY));
    opcodes[0x7a] = "uNOP"; instructions[0x7a] = newuNOP(implied);
    opcodes[0x7b] = "uRRA"; instructions[0x7b] = newuRRA(absoluteIndexedReadModifyWrite(rY));
    opcodes[0x7c] = "uNOP"; instructions[0x7c] = newuNOP(absoluteIndexedRead(rX));
    opcodes[0x7d] = "ADC";  instructions[0x7d] = newADC(absoluteIndexedRead(rX));
    opcodes[0x7e] = "ROR";  instructions[0x7e] = newROR(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x7f] = "uRRA"; instructions[0x7f] = newuRRA(absoluteIndexedReadModifyWrite(rX));
    opcodes[0x80] = "uNOP"; instructions[0x80] = newuNOP(immediateRead);
    opcodes[0x81] = "STA";  instructions[0x81] = newSTA(indirectXWrite);
    opcodes[0x82] = "uNOP"; instructions[0x82] = newuNOP(immediateRead);
    opcodes[0x83] = "uSAX"; instructions[0x83] = newuSAX(indirectXWrite);
    opcodes[0x84] = "STY";  instructions[0x84] = newSTY(zeroPageWrite);
    opcodes[0x85] = "STA";  instructions[0x85] = newSTA(zeroPageWrite);
    opcodes[0x86] = "STX";  instructions[0x86] = newSTX(zeroPageWrite);
    opcodes[0x87] = "uSAX"; instructions[0x87] = newuSAX(zeroPageWrite);
    opcodes[0x88] = "DEY";  instructions[0x88] = newDEY();
    opcodes[0x89] = "uNOP"; instructions[0x89] = newuNOP(immediateRead);
    opcodes[0x8a] = "TXA";  instructions[0x8a] = newTXA();
    opcodes[0x8b] = "uANE"; instructions[0x8b] = newuANE(immediateRead);
    opcodes[0x8c] = "STY";  instructions[0x8c] = newSTY(absoluteWrite);
    opcodes[0x8d] = "STA";  instructions[0x8d] = newSTA(absoluteWrite);
    opcodes[0x8e] = "STX";  instructions[0x8e] = newSTX(absoluteWrite);
    opcodes[0x8f] = "uSAX"; instructions[0x8f] = newuSAX(absoluteWrite);
    opcodes[0x90] = "BCC";  instructions[0x90] = newBxx(bC, 0);                 // BCC
    opcodes[0x91] = "STA";  instructions[0x91] = newSTA(indirectYWrite);
    opcodes[0x92] = "uKIL"; instructions[0x92] = newuKIL();
    opcodes[0x93] = "uSHA"; instructions[0x93] = newuSHA(indirectYWrite);
    opcodes[0x94] = "STY";  instructions[0x94] = newSTY(zeroPageIndexedWrite(rX));
    opcodes[0x95] = "STA";  instructions[0x95] = newSTA(zeroPageIndexedWrite(rX));
    opcodes[0x96] = "STX";  instructions[0x96] = newSTX(zeroPageIndexedWrite(rY));
    opcodes[0x97] = "uSAX"; instructions[0x97] = newuSAX(zeroPageIndexedWrite(rY));
    opcodes[0x98] = "TYA";  instructions[0x98] = newTYA();
    opcodes[0x99] = "STA";  instructions[0x99] = newSTA(absoluteIndexedWrite(rY));
    opcodes[0x9a] = "TXS";  instructions[0x9a] = newTXS();
    opcodes[0x9b] = "uSHS"; instructions[0x9b] = newuSHS(absoluteIndexedWrite(rY));
    opcodes[0x9c] = "uSHY"; instructions[0x9c] = newuSHY(absoluteIndexedWrite(rX));
    opcodes[0x9d] = "STA";  instructions[0x9d] = newSTA(absoluteIndexedWrite(rX));
    opcodes[0x9e] = "uSHX"; instructions[0x9e] = newuSHX(absoluteIndexedWrite(rY));
    opcodes[0x9f] = "uSHA"; instructions[0x9f] = newuSHA(absoluteIndexedWrite(rY));
    opcodes[0xa0] = "LDY";  instructions[0xa0] = newLDY(immediateRead);
    opcodes[0xa1] = "LDA";  instructions[0xa1] = newLDA(indirectXRead);
    opcodes[0xa2] = "LDX";  instructions[0xa2] = newLDX(immediateRead);
    opcodes[0xa3] = "uLAX"; instructions[0xa3] = newuLAX(indirectXRead);
    opcodes[0xa4] = "LDY";  instructions[0xa4] = newLDY(zeroPageRead);
    opcodes[0xa5] = "LDA";  instructions[0xa5] = newLDA(zeroPageRead);
    opcodes[0xa6] = "LDX";  instructions[0xa6] = newLDX(zeroPageRead);
    opcodes[0xa7] = "uLAX"; instructions[0xa7] = newuLAX(zeroPageRead);
    opcodes[0xa8] = "TAY";  instructions[0xa8] = newTAY();
    opcodes[0xa9] = "LDA";  instructions[0xa9] = newLDA(immediateRead);
    opcodes[0xaa] = "TAX";  instructions[0xaa] = newTAX();
    opcodes[0xab] = "uLXA"; instructions[0xab] = newuLXA(immediateRead);
    opcodes[0xac] = "LDY";  instructions[0xac] = newLDY(absoluteRead);
    opcodes[0xad] = "LDA";  instructions[0xad] = newLDA(absoluteRead);
    opcodes[0xae] = "LDX";  instructions[0xae] = newLDX(absoluteRead);
    opcodes[0xaf] = "uLAX"; instructions[0xaf] = newuLAX(absoluteRead);
    opcodes[0xb0] = "BCS";  instructions[0xb0] = newBxx(bC, 1);                 // BCS
    opcodes[0xb1] = "LDA";  instructions[0xb1] = newLDA(indirectYRead);
    opcodes[0xb2] = "uKIL"; instructions[0xb2] = newuKIL();
    opcodes[0xb3] = "uLAX"; instructions[0xb3] = newuLAX(indirectYRead);
    opcodes[0xb4] = "LDY";  instructions[0xb4] = newLDY(zeroPageIndexedRead(rX));
    opcodes[0xb5] = "LDA";  instructions[0xb5] = newLDA(zeroPageIndexedRead(rX));
    opcodes[0xb6] = "LDX";  instructions[0xb6] = newLDX(zeroPageIndexedRead(rY));
    opcodes[0xb7] = "uLAX"; instructions[0xb7] = newuLAX(zeroPageIndexedRead(rY));
    opcodes[0xb8] = "CLV";  instructions[0xb8] = newCLV();
    opcodes[0xb9] = "LDA";  instructions[0xb9] = newLDA(absoluteIndexedRead(rY));
    opcodes[0xba] = "TSX";  instructions[0xba] = newTSX();
    opcodes[0xbb] = "uLAS"; instructions[0xbb] = newuLAS(absoluteIndexedRead(rY));
    opcodes[0xbc] = "LDY";  instructions[0xbc] = newLDY(absoluteIndexedRead(rX));
    opcodes[0xbd] = "LDA";  instructions[0xbd] = newLDA(absoluteIndexedRead(rX));
    opcodes[0xbe] = "LDX";  instructions[0xbe] = newLDX(absoluteIndexedRead(rY));
    opcodes[0xbf] = "uLAX"; instructions[0xbf] = newuLAX(absoluteIndexedRead(rY));
    opcodes[0xc0] = "CPY";  instructions[0xc0] = newCPY(immediateRead);
    opcodes[0xc1] = "CMP";  instructions[0xc1] = newCMP(indirectXRead);
    opcodes[0xc2] = "uNOP"; instructions[0xc2] = newuNOP(immediateRead);
    opcodes[0xc3] = "uDCP"; instructions[0xc3] = newuDCP(indirectXReadModifyWrite);
    opcodes[0xc4] = "CPY";  instructions[0xc4] = newCPY(zeroPageRead);
    opcodes[0xc5] = "CMP";  instructions[0xc5] = newCMP(zeroPageRead);
    opcodes[0xc6] = "DEC";  instructions[0xc6] = newDEC(zeroPageReadModifyWrite);
    opcodes[0xc7] = "uDCP"; instructions[0xc7] = newuDCP(zeroPageReadModifyWrite);
    opcodes[0xc8] = "INY";  instructions[0xc8] = newINY();
    opcodes[0xc9] = "CMP";  instructions[0xc9] = newCMP(immediateRead);
    opcodes[0xca] = "DEX";  instructions[0xca] = newDEX();
    opcodes[0xcb] = "uSBX"; instructions[0xcb] = newuSBX(immediateRead);
    opcodes[0xcc] = "CPY";  instructions[0xcc] = newCPY(absoluteRead);
    opcodes[0xcd] = "CMP";  instructions[0xcd] = newCMP(absoluteRead);
    opcodes[0xce] = "DEC";  instructions[0xce] = newDEC(absoluteReadModifyWrite);
    opcodes[0xcf] = "uDCP"; instructions[0xcf] = newuDCP(absoluteReadModifyWrite);
    opcodes[0xd0] = "BNE";  instructions[0xd0] = newBxx(bZ, 0);                 // BNE
    opcodes[0xd1] = "CMP";  instructions[0xd1] = newCMP(indirectYRead);
    opcodes[0xd2] = "uKIL"; instructions[0xd2] = newuKIL();
    opcodes[0xd3] = "uDCP"; instructions[0xd3] = newuDCP(indirectYReadModifyWrite);
    opcodes[0xd4] = "uNOP"; instructions[0xd4] = newuNOP(zeroPageIndexedRead(rX));
    opcodes[0xd5] = "CMP";  instructions[0xd5] = newCMP(zeroPageIndexedRead(rX));
    opcodes[0xd6] = "DEC";  instructions[0xd6] = newDEC(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0xd7] = "uDCP"; instructions[0xd7] = newuDCP(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0xd8] = "CLD";  instructions[0xd8] = newCLD();
    opcodes[0xd9] = "CMP";  instructions[0xd9] = newCMP(absoluteIndexedRead(rY));
    opcodes[0xda] = "uNOP"; instructions[0xda] = newuNOP(implied);
    opcodes[0xdb] = "uDCP"; instructions[0xdb] = newuDCP(absoluteIndexedReadModifyWrite(rY));
    opcodes[0xdc] = "uNOP"; instructions[0xdc] = newuNOP(absoluteIndexedRead(rX));
    opcodes[0xdd] = "CMP";  instructions[0xdd] = newCMP(absoluteIndexedRead(rX));
    opcodes[0xde] = "DEC";  instructions[0xde] = newDEC(absoluteIndexedReadModifyWrite(rX));
    opcodes[0xdf] = "uDCP"; instructions[0xdf] = newuDCP(absoluteIndexedReadModifyWrite(rX));
    opcodes[0xe0] = "CPX";  instructions[0xe0] = newCPX(immediateRead);
    opcodes[0xe1] = "SBC";  instructions[0xe1] = newSBC(indirectXRead);
    opcodes[0xe2] = "uNOP"; instructions[0xe2] = newuNOP(immediateRead);
    opcodes[0xe3] = "uISB"; instructions[0xe3] = newuISB(indirectXReadModifyWrite);
    opcodes[0xe4] = "CPX";  instructions[0xe4] = newCPX(zeroPageRead);
    opcodes[0xe5] = "SBC";  instructions[0xe5] = newSBC(zeroPageRead);
    opcodes[0xe6] = "INC";  instructions[0xe6] = newINC(zeroPageReadModifyWrite);
    opcodes[0xe7] = "uISB"; instructions[0xe7] = newuISB(zeroPageReadModifyWrite);
    opcodes[0xe8] = "newINX";  instructions[0xe8] = newINX();
    opcodes[0xe9] = "SBC";  instructions[0xe9] = newSBC(immediateRead);
    opcodes[0xea] = "NOP";  instructions[0xea] = newNOP();
    opcodes[0xeb] = "SBC";  instructions[0xeb] = newSBC(immediateRead);
    opcodes[0xec] = "CPX";  instructions[0xec] = newCPX(absoluteRead);
    opcodes[0xed] = "SBC";  instructions[0xed] = newSBC(absoluteRead);
    opcodes[0xee] = "INC";  instructions[0xee] = newINC(absoluteReadModifyWrite);
    opcodes[0xef] = "uISB"; instructions[0xef] = newuISB(absoluteReadModifyWrite);
    opcodes[0xf0] = "BEQ";  instructions[0xf0] = newBxx(bZ, 1);                 // BEQ
    opcodes[0xf1] = "SBC";  instructions[0xf1] = newSBC(indirectYRead);
    opcodes[0xf2] = "uKIL"; instructions[0xf2] = newuKIL();
    opcodes[0xf3] = "uISB"; instructions[0xf3] = newuISB(indirectYReadModifyWrite);
    opcodes[0xf4] = "uNOP"; instructions[0xf4] = newuNOP(zeroPageIndexedRead(rX));
    opcodes[0xf5] = "SBC";  instructions[0xf5] = newSBC(zeroPageIndexedRead(rX));
    opcodes[0xf6] = "INC";  instructions[0xf6] = newINC(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0xf7] = "uISB"; instructions[0xf7] = newuISB(zeroPageIndexedReadModifyWrite(rX));
    opcodes[0xf8] = "SED";  instructions[0xf8] = newSED();
    opcodes[0xf9] = "SBC";  instructions[0xf9] = newSBC(absoluteIndexedRead(rY));
    opcodes[0xfa] = "uNOP"; instructions[0xfa] = newuNOP(implied);
    opcodes[0xfb] = "uISB"; instructions[0xfb] = newuISB(absoluteIndexedReadModifyWrite(rY));
    opcodes[0xfc] = "uNOP"; instructions[0xfc] = newuNOP(absoluteIndexedRead(rX));
    opcodes[0xfd] = "SBC";  instructions[0xfd] = newSBC(absoluteIndexedRead(rX));
    opcodes[0xfe] = "INC";  instructions[0xfe] = newINC(absoluteIndexedReadModifyWrite(rX));
    opcodes[0xff] = "uISB"; instructions[0xff] = newuISB(absoluteIndexedReadModifyWrite(rX));


    // Single Byte instructions

    function newASL_ACC() {
        return implied(function ASL_ACC() {
            setC(A > 127);
            A = (A << 1) & 255;
            setZ(A);
            setN(A);
        });
    }

    function newCLC() {
        return implied(function CLC() {
            C = 0;
        });
    }

    function newCLD() {
        return implied(function CLD() {
            D = 0;
        });
    }

    function newCLI() {
        return implied(function CLI() {
            I = 0;
        });
    }

    function newCLV() {
        return implied(function CLV() {
            V = 0;
        });
    }

    function newDEX() {
        return implied(function DEX() {
            X = (X - 1) & 255;
            setZ(X);
            setN(X);
        });
    }

    function newDEY() {
        return implied(function DEY() {
            Y = (Y - 1) & 255;
            setZ(Y);
            setN(Y);
        });
    }

    function newINX() {
        return implied(function INX() {
            X = (X + 1) & 255;
            setZ(X);
            setN(X);
        });
    }

    function newINY() {
        return implied(function INY() {
            Y = (Y + 1) & 255;
            setZ(Y);
            setN(Y);
        });
    }

    function newLSR_ACC() {
        return implied(function LSR_ACC() {
            C = A & 0x01;
            A >>>= 1;
            setZ(A);
            N = 0;
        });
    }

    function newNOP() {
        return implied(function NOP() {
            // nothing
        });
    }

    function newROL_ACC() {
        return implied(function ROL_ACC() {
            var newC = A > 127;
            A = ((A << 1) | C) & 255;
            setC(newC);
            setZ(A);
            setN(A);
        });
    }

    function newROR_ACC() {
        return implied(function ROR_ACC() {
            var newC = A & 0x01;
            A = (A >>> 1) | (C << 7);
            setC(newC);
            setZ(A);
            setN(A);
        });
    }

    function newSEC() {
        return implied(function SEC() {
            C = 1;
        });
    }

    function newSED() {
        return implied(function SED() {
            D = 1;
        });
    }

    function newSEI() {
        return implied(function SEI() {
            I = 1;
        });
    }

    function newTAX() {
        return implied(function TAX() {
            X = A;
            setZ(X);
            setN(X);
        });
    }

    function newTAY() {
        return implied(function TAY() {
            Y = A;
            setZ(Y);
            setN(Y);
        });
    }

    function newTSX() {
        return implied(function TSX() {
            X = SP;
            setZ(X);
            setN(X);
        });
    }

    function newTXA() {
        return implied(function TXA() {
            A = X;
            setZ(A);
            setN(A);
        });
    }

    function newTXS() {
        return implied(function TXS() {
            SP = X;
        });
    }

    function newTYA() {
        return implied(function TYA() {
            A = Y;
            setZ(A);
            setN(A);
        });
    }

    function newuKIL() {
        return [
            fetchOpcodeAndDecodeInstruction,
            function() {
                illegalOpcode("KIL/HLT/JAM");
            },
            function() {
                T--;        // Causes the processor to be stuck in this instruction forever
            }
        ];
    }

    function newuNOP(addressing) {
        return addressing(function uNOP() {
            illegalOpcode("NOP/DOP");
            // nothing
        });
    }


    // Internal Execution on Memory Data

    function newADC(addressing) {
        return addressing(function ADC() {
            if (D) {
                var operand = data;
                var AL = (A & 15) + (operand & 15) + C;
                if (AL > 9) { AL += 6; }
                var AH = ((A >> 4) + (operand >> 4) + (AL > 15)) << 4;
                setZ((A + operand + C) & 255);
                setN(AH);
                setV(((A ^AH) & ~(A ^ operand)) & 128);
                if (AH > 0x9f) { AH += 0x60; }
                setC(AH > 255);
                A = (AH | (AL & 15)) & 255;
            } else {
                var add = A + data + C;
                setC(add > 255);
                setV(((A ^ add) & (data ^ add)) & 0x80);
                A = add & 255;
                setZ(A);
                setN(A);
            }
        });
    }

    function newAND(addressing) {
        return addressing(function AND() {
            A &= data;
            setZ(A);
            setN(A);
        });
    }

    function newBIT(addressing) {
        return addressing(function BIT() {
            var par = data;
            setZ(A & par);
            setV(par & 0x40);
            setN(par);
        });
    }

    function newCMP(addressing) {
        return addressing(function CMP() {
            var val = (A - data) & 255;
            setC(A >= data);
            setZ(val);
            setN(val);
        });
    }

    function newCPX(addressing) {
        return addressing(function CPX() {
            var val = (X - data) & 255;
            setC(X >= data);
            setZ(val);
            setN(val);
        });
    }

    function newCPY(addressing) {
        return addressing(function CPY() {
            var val = (Y - data) & 255;
            setC(Y >= data);
            setZ(val);
            setN(val);
        });
    }

    function newEOR(addressing) {
        return addressing(function EOR() {
            A ^= data;
            setZ(A);
            setN(A);
        });
    }

    function newLDA(addressing) {
        return addressing(function LDA() {
            A = data;
            setZ(A);
            setN(A);
        });
    }

    function newLDX(addressing) {
        return addressing(function LDX() {
            X = data;
            setZ(X);
            setN(X);
        });
    }

    function newLDY(addressing) {
        return addressing(function LDY() {
            Y = data;
            setZ(Y);
            setN(Y);
        });
    }

    function newORA(addressing) {
        return addressing(function ORA() {
            A |= data;
            setZ(A);
            setN(A);
        });
    }

    function newSBC(addressing) {
        return addressing(function SBC() {
            if (D) {
                var operand = data;
                var AL = (A & 15) - (operand & 15) - (1-C);
                var AH = (A >> 4) - (operand >> 4) - (AL < 0);
                if (AL < 0) { AL -= 6; }
                if (AH < 0) { AH -= 6; }
                var sub = A - operand - (1-C);
                setC(~sub & 256);
                setV(((A ^ operand) & (A ^ sub)) & 128);
                setZ(sub & 255);
                setN(sub);
                A = ((AH << 4) | (AL & 15)) & 255;
            } else {
                operand = (~data) & 255;
                sub = A + operand + C;
                setC(sub > 255);
                setV(((A ^ sub) & (operand ^ sub) & 0x80));
                A = sub & 255;
                setZ(A);
                setN(A);
            }
        });
    }

    function newuANC(addressing) {
        return addressing(function uANC() {
            illegalOpcode("ANC");
            A &= data;
            setZ(A);
            N = C = (A & 0x080) ? 1 : 0;
        });
    }

    function newuANE(addressing) {
        return addressing(function uANE() {
            illegalOpcode("ANE");
            // Exact operation unknown. Do nothing
        });
    }

    function newuARR(addressing) {
        // Some sources say flags are affected per ROR, others say its more complex. The complex one is chosen
        return addressing(function uARR() {
            illegalOpcode("ARR");
            var val = A & data;
            var oldC = C ? 0x80 : 0;
            val = (val >>> 1) | oldC;
            A = val;
            setZ(val);
            setN(val);
            var comp = A & 0x60;
            if (comp == 0x60) 		{ C = 1; V = 0; }
            else if (comp == 0x00) 	{ C = 0; V = 0; }
            else if (comp == 0x20) 	{ C = 0; V = 1; }
            else if (comp == 0x40) 	{ C = 1; V = 1; }
        });
    }

    function newuASR(addressing) {
        return addressing(function uASR() {
            illegalOpcode("ASR");
            var val = A & data;
            C = (val & 0x01);		// bit 0
            val = val >>> 1;
            A = val;
            setZ(val);
            N = 0;
        });
    }

    function newuLAS(addressing) {
        return addressing(function uLAS() {
            illegalOpcode("LAS");
            var val = SP & data;
            A = val;
            X = val;
            SP = val;
            setZ(val);
            setN(val);
        });
    }

    function newuLAX(addressing) {
        return addressing(function uLAX() {
            illegalOpcode("LAX");
            var val = data;
            A = val;
            X = val;
            setZ(val);
            setN(val);
        });
    }

    function newuLXA(addressing) {
        return addressing(function uLXA() {
            // Some sources say its an OR with $EE then AND with IMM, others exclude the OR,
            // others exclude both the OR and the AND. Excluding just the OR...
            illegalOpcode("LXA");
            var val = A /* | 0xEE) */ & data;
            A = val;
            X = val;
            setZ(val);
            setN(val);
        });
    }

    function newuSBX(addressing) {
        return addressing(function uSBX() {
            illegalOpcode("SBX");
            var par = A & X;
            var val = data;
            var newX = (par - val) & 255;
            X = newX;
            setC(par >= val);
            setZ(newX);
            setN(newX);
        });
    }


    // Store operations

    function newSTA(addressing) {
        return addressing(function STA() {
            data = A;
        });
    }

    function newSTX(addressing) {
        return addressing(function STX() {
            data = X;
        });
    }

    function newSTY(addressing) {
        return addressing(function STY() {
            data = Y;
        });
    }

    function newuSAX(addressing) {
        return addressing(function uSAX() {
            // Some sources say it would affect N and Z flags, some say it wouldn't. Chose not to affect
            illegalOpcode("SAX");
            data = A & X;
        });
    }

    function newuSHA(addressing) {
        return addressing(function uSHA() {
            illegalOpcode("SHA");
            data = A & X & ((BA >>> 8) + 1) & 255; // A & X & (High byte of effective address + 1) !!!
            // data would also be stored BAH if page boundary is crossed. Unobservable, not needed here
        });
    }

    function newuSHS(addressing) {
        return addressing(function uSHS() {
            illegalOpcode("SHS");
            var val = A & X;
            SP = val;
            data = val & ((BA >>> 8) + 1) & 255; // A & X & (High byte of effective address + 1) !!!
            // data would also be stored BAH if page boundary is crossed. Unobservable, not needed here
        });
    }

    function newuSHX(addressing) {
        return addressing(function uSHX() {
            illegalOpcode("SHX");
            data = X & ((BA >>> 8) + 1) & 255; // X & (High byte of effective address + 1) !!!
            // data would also be stored BAH if page boundary is crossed. Unobservable, not needed here
        });
    }

    function newuSHY(addressing) {
        return addressing(function uSHY() {
            illegalOpcode("SHY");
            data = Y & ((BA >>> 8) + 1) & 255; // Y & (High byte of effective address + 1) !!!
            // data would also be stored BAH if page boundary is crossed. Unobservable, not needed here
        });
    }


    // Read-Modify-Write operations

    function newASL(addressing) {
        return addressing(function ASL() {
            setC(data > 127);
            var par = (data << 1) & 255;
            data = par;
            setZ(par);
            setN(par);
        });
    }

    function newDEC(addressing) {
        return addressing(function DEC() {
            var par = (data - 1) & 255;
            data = par;
            setZ(par);
            setN(par);
        });
    }

    function newINC(addressing) {
        return addressing(function INC() {
            var par = (data + 1) & 255;
            data = par;
            setZ(par);
            setN(par);
        });
    }

    function newLSR(addressing) {
        return addressing(function LSR() {
            C = data & 0x01;
            data >>>= 1;
            setZ(data);
            N = 0;
        });
    }

    function newROL(addressing) {
        return addressing(function ROL() {
            var newC = data > 127;
            var par = ((data << 1) | C) & 255;
            data = par;
            setC(newC);
            setZ(par);
            setN(par);
        });
    }

    function newROR(addressing) {
        return addressing(function ROR() {
            var newC = data & 0x01;
            var par = (data >>> 1) | (C << 7);
            data = par;
            setC(newC);
            setZ(par);
            setN(par);
        });
    }

    function newuDCP(addressing) {
        return addressing(function uDCP() {
            illegalOpcode("DCP");
            var par = (data - 1) & 255;
            data = par;
            par = A - par;
            setC(par >= 0);
            setZ(par);
            setN(par);
        });
    }

    function newuISB(addressing) {
        return addressing(function uISB() {
            illegalOpcode("ISB");
            data = (data + 1) & 255;    // ISB is the same as SBC but incs the operand first
            if (D) {
                var operand = data;
                var AL = (A & 15) - (operand & 15) - (1-C);
                var AH = (A >> 4) - (operand >> 4) - (AL < 0);
                if (AL < 0) { AL -= 6; }
                if (AH < 0) { AH -= 6; }
                var sub = A - operand - (1-C);
                setC(~sub & 256);
                setV(((A ^ operand) & (A ^ sub)) & 128);
                setZ(sub & 255);
                setN(sub);
                A = ((AH << 4) | (AL & 15)) & 255;
            } else {
                operand = (~data) & 255;
                sub = A + operand + C;
                setC(sub > 255);
                setV(((A ^ sub) & (operand ^ sub) & 0x80));
                A = sub & 255;
                setZ(A);
                setN(A);
            }
        });
    }

    function newuRLA(addressing) {
        return addressing(function uRLA() {
            illegalOpcode("RLA");
            var val = data;
            var oldC = C;
            setC(val & 0x80);		// bit 7 was set
            val = ((val << 1) | oldC) & 255;
            data = val;
            A &= val;
            setZ(val);              // TODO Verify. May be A instead of val in the flags setting
            setN(val);
        });
    }

    function newuRRA(addressing) {
        return addressing(function uRRA() {
            illegalOpcode("RRA");
            var val = data;
            var oldC = C ? 0x80 : 0;
            setC(val & 0x01);		// bit 0 was set
            val = (val >>> 1) | oldC;
            data = val;
            // RRA is the same as ADC from here
            if (D) {
                var operand = data;
                var AL = (A & 15) + (operand & 15) + C;
                if (AL > 9) { AL += 6; }
                var AH = ((A >> 4) + (operand >> 4) + (AL > 15)) << 4;
                setZ((A + operand + C) & 255);
                setN(AH);
                setV(((A ^AH) & ~(A ^ operand)) & 128);
                if (AH > 0x9f) { AH += 0x60; }
                setC(AH > 255);
                A = (AH | (AL & 15)) & 255;
            } else {
                var add = A + data + C;
                setC(add > 255);
                setV(((A ^ add) & (data ^ add)) & 0x80);
                A = add & 255;
                setZ(A);
                setN(A);
            }
        });
    }

    function newuSLO(addressing) {
        return addressing(function uSLO() {
            illegalOpcode("SLO");
            var val = data;
            setC(val & 0x80);		// bit 7 was set
            val = (val << 1) & 255;
            data = val;
            val = A | val;
            A = val;
            setZ(val);
            setN(val);
        });
    }

    function newuSRE(addressing) {
        return addressing(function uSRE() {
            illegalOpcode("SRE");
            var val = data;
            setC(val & 0x01);		// bit 0 was set
            val = val >>> 1;
            data = val;
            val = (A ^ val) & 255;
            A = val;
            setZ(val);
            setN(val);
        });
    }


    // Miscellaneous operations

    function mewPHA() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            function PHA() { pushToStack(A); },
            fetchNextOpcode
        ];
    }

    function newPHP() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            function PHP() { pushToStack(getStatusBits()); },
            fetchNextOpcode
        ];
    }

    function newPLA() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function PLA() {
                A = popFromStack();
                setZ(A);
                setN(A);
            },
            fetchNextOpcode
        ];
    }

    function newPLP() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function PLP() { setStatusBits(popFromStack()); },
            fetchNextOpcode
        ];
    }

    function newJSR() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            peekFromStack,
            function JSR1() { pushToStack((PC >>> 8)  & 0xff); },
            function JSR2() { pushToStack(PC & 0xff); },
            fetchADH,
            function JSR3() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function newBRK() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchDataFromImmediate,                 // For debugging purposes, use operand as an arg for BRK!
            function BRK1() {
                if (self.debug) self.breakpoint("BRK " + data);
                pushToStack((PC >>> 8) & 0xff);
            },
            function BRK2() { pushToStack(PC & 0xff); },
            function BRK3() { pushToStack(getStatusBits()); },
            function BRK4() { AD = bus.read(IRQ_VECTOR); },
            function BRK5() { AD |= bus.read(IRQ_VECTOR + 1) << 8; },
            function BRK6() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function newRTI() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function RTI1() { setStatusBits(popFromStack()); },
            function RTI2() { AD = popFromStack(); },
            function RTI3() { AD |= popFromStack() << 8; },
            function RTI4() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function newRTS() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchOpcodeAndDiscard,
            peekFromStack,
            function RTS1() { AD = popFromStack(); },
            function RTS2() { AD |= popFromStack() << 8; },
            function RTS3() { PC = AD; fetchDataFromImmediate(); },
            fetchNextOpcode
        ];
    }

    function newJMP_ABS() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchADL,
            fetchADH,
            function JMP_ABS() { PC = AD; fetchNextOpcode(); }
        ];
    }

    function newJMP_IND() {
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchIAL,                           // IAH will be zero
            fetchIAH,
            fetchBALFromIA,
            function JMP_IND1() {
                add1toIAL();
                fetchBAHFromIA();
            },
            function JMP_IND2() { PC = BA; fetchNextOpcode(); }
        ];
    }

    function newBxx(reg, cond) {
        var branchTaken;
        if      (reg === bZ) branchTaken = function BxxZ() { return Z === cond; };
        else if (reg === bN) branchTaken = function BxxN() { return N === cond; };
        else if (reg === bC) branchTaken = function BxxC() { return C === cond; };
        else                 branchTaken = function BxxV() { return V === cond; };
        return [
            fetchOpcodeAndDecodeInstruction,
            fetchBranchOffset,
            function Bxx1() {
                if (branchTaken()) {
                    fetchOpcodeAndDiscard();
                    addBranchOffsetToPCL();
                } else {
                    fetchNextOpcode();
                }
            },
            function Bxx2() {
                if(branchOffsetCrossAdjust) {
                    fetchOpcodeAndDiscard();
                    adjustPCHForBranchOffsetCross();
                } else {
                    fetchNextOpcode();
                }
            },
            fetchNextOpcode
        ];
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            PC: PC, A: A, X: X, Y: Y, SP: SP,
            N: N, V: V, D: D, I: I, Z: Z, C: C,
            T: T, o: opcode, R: RDY | 0,
            d: data, AD: AD, BA: BA, BC: BALCrossed | 0, IA: IA,
            bo: branchOffset, boa: branchOffsetCrossAdjust
        };
    };

    this.loadState = function(state) {
        PC = state.PC; A = state.A; X = state.X; Y = state.Y; SP = state.SP;
        N = state.N; V = state.V; D = state.D; I = state.I; Z = state.Z; C = state.C;
        T = state.T; opcode = state.o; RDY = !!state.R;
        data = state.d; AD = state.AD; BA = state.BA; BALCrossed = !!state.BC; IA = state.IA;
        branchOffset = state.bo; branchOffsetCrossAdjust = state.boa;

        instruction = opcode === -1 ? boostrapInstruction : instructions[opcode];      // for states saved right after a reset or before first reset
    };


    // Accessory methods

    this.toString = function() {
        return "CPU " +
            " PC: " + PC.toString(16) + "  op: " + opcode.toString() + "  T: " + T + "  data: " + data + "\n" +
            " A: " + A.toString(16) + "  X: " + X.toString(16) + "  Y: " + Y.toString(16) + "  SP: " + SP.toString(16) + "     " +
            "N" + N + "  " + "V" + V + "  " + "D" + D + "  " + "I" + I + "  " + "Z" + Z + "  " + "C" + C + "  ";
    };

    this.breakpoint = function(mes) {
        jt.Util.log(mes);
        if (this.trace) {
            var text = "CPU Breakpoint!  " + (mes ? "(" + mes + ")" : "") + "\n\n" + this.toString();
            jt.Util.message(text);
        }
    };

    //noinspection JSUnusedGlobalSymbols
    this.runCycles = function(cycles) {
        //noinspection JSUnresolvedVariable
        var start = performance.now();
        for (var i = 0; i < cycles; i++) {
            this.clockPulse();
        }
        //noinspection JSUnresolvedVariable
        var end = performance.now();
        jt.Util.message("Done running " + cycles + " cycles in " + (end - start) + " ms.");
    };

};
