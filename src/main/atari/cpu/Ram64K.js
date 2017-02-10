// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.Ram64K = function(data) {
"use strict";

    this.write = function(address, value) {
        data[address] = value;
    };

    this.read = function(address) {
        return data[address];
    };

    this.dump = function(from, to) {
        var res = "";
        var i;
        for(i = from; i <= to; i++) {
            res = res + i.toString(16, 2) + " ";
        }
        res += "\n";
        for(i = from; i <= to; i++) {
            res = res + this.read(i).toString(16, 2) + " ";
        }
        return res;
    }

};