"use strict";

module GnkSpi {

    export interface Hw {
        hwType: number;
        letType: number;
        rowCount: number;
        ledCount: Array<number>;
    }

    export interface Dev {
        Show(show: string, device?: number, property?: number): number;
        Stop(device: number): number;
        Get(device: number): Hw;
    }

    export class Addon implements Dev {
        private addon;
        private log: (msg: string) => void;

        constructor(log: (msg: string) => void) {
            this.log = log;
            this.addon = require('../GnkSpiAddon');
            this.log("addon loaded");
        }

        Show(show: string, device?: number, property?: number): number {
            this.log(`Show dev=${device}  prop=${property}`);
            this.log(show);
            return this.addon.show(show, device, property);
        }

        Stop(device: number): number {
            this.log(`Stop dev=${device}`);
            return this.addon.stop(device);
        }

        Get(device: number): Hw {
            this.log(`Get dev=${device}`);
            let hw: GnkSpi.Hw = JSON.parse(this.addon.get(device));
            return hw;
        }
    }

    export class Emul implements Dev {
        private addon: Object;
        private log: (msg: string) => void;

        private static LightStarHw = {
            hwType: 1,
            letType: 1,
            rowCount: 4,
            ledCount: [60, 60, 60, 60]
        }

        private static LedPanelHw = {
            hwType: 2,
            letType: 2,
            rowCount: 1,
            ledCount: [240]
        }

        private static Hw = Emul.LedPanelHw;

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

        Get(device: number): Hw {
            this.log(`Get dev=${device}`);
            return Emul.Hw;
        }
    }

}

export = GnkSpi;