import {Interface} from "node:readline/promises";
import * as fs from "node:fs";

const CONFIG_FILE_PREFIX = "./storage/cfg_";
const CONFIG_FILE_EXT = ".json";

/**
 * Universal configs processor
 * @todo Impl detecting probles with reading/writing files
 */
export default class Config<T> {
    private readonly filePath: string;
    model: T;

    constructor(configName: string, fallback: T) {
        this.filePath = `${CONFIG_FILE_PREFIX}${configName}${CONFIG_FILE_EXT}`;
        this.model = fallback;
    }

    async save() {
        const json = JSON.stringify(this.model);
        fs.writeFileSync(this.filePath, JSON.stringify(json));
    }

    async load(): Promise<void> {
        if(!fs.existsSync(this.filePath)) return;

        const content = fs.readFileSync(this.filePath);
        this.model = JSON.parse(content.toString()) as T;
    }
}