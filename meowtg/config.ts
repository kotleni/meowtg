import {Interface} from "node:readline/promises";
import * as fs from "node:fs";

const CONFIG_FILE_PREFIX = "./storage/cfg_";
const CONFIG_FILE_EXT = ".json";

/**
 * Universal configs processor
 * @todo Impl detecting probles with reading/writing files
 */
export default class Config<T> {
    private filePath: string;
    model: T;

    constructor(configName: string, fallback: T) {
        this.filePath = `${CONFIG_FILE_PREFIX}${configName}${CONFIG_FILE_EXT}`;
        this.model = fallback;
    }

    async save(object: T) {
        const json = JSON.stringify(object);
        fs.writeFileSync(this.filePath, JSON.stringify(json));
    }

    async load(fallback: T): Promise<void> {
        if(!fs.existsSync(this.filePath)) return;

        const content = fs.readFileSync(this.filePath);
        this.model = JSON.parse(content.toString()) as T;
    }
}