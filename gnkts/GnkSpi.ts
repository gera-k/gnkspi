"use strict";

module GnkSpi {

    export interface Dev {
        Show(show: string, device?: number, property?: number): number;
        Stop(device: number): number;
    }

    export class Addon implements Dev {
        private addon;
        private log: (msg: string) => void;

        constructor(log: (msg: string) => void) {
            this.log = log;
            this.addon = require('../GnkSpiAddon');
            console.log("addon loaded");
        }

        Show(show: string, device?: number, property?: number): number {
            return this.addon.show(show, device, property);
        }

        Stop(device: number): number {
            return this.addon.stop(device);
        }
    }

    export class Emul implements Dev {
        private addon: Object;
        private log: (msg: string) => void;

        constructor(log: (msg: string) => void) {
            this.log = log;
            this.log("addon emulator");
        }

        Show(show: string, device?: number, property?: number): number {
            this.log(`Show dev=${device}  prop=${property}`);
            this.log(show);
            return 0;
        }

        Stop(device: number): number {
            this.log(`Stop dev=${device}`);
            return 0;
        }
    }

}

export = GnkSpi;