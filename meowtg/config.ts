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

    constructor(configName: string) {
        this.filePath = `${CONFIG_FILE_PREFIX}${configName}${CONFIG_FILE_EXT}`;
    }

    async save(object: T) {
        const json = JSON.stringify(object);
        fs.writeFileSync(this.filePath, JSON.stringify(json));
    }

    async load(fallback: T): Promise<T> {
        if(!fs.existsSync(this.filePath)) {
            return fallback;
        }
        const content = fs.readFileSync(this.filePath);
        return JSON.parse(content.toString()) as T;
    }
}