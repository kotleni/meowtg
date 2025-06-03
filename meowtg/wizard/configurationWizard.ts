import { existsSync } from "fs";
import {mkdir} from "node:fs";
import * as fs from "node:fs";
import {Interface} from "node:readline/promises";

/**
 * Magic installer wizard what can cast spells
 */
export default class ConfigurationWizard {
    private envFilePath: string = ".env";
    private dataFolderPath: string = "storage";

    /**
     * Check if env file is exist
     */
    isNeeded(): boolean {
        return !existsSync(this.envFilePath);
    }

    /**
     * Run configuration wizard
     * @return false if wizard canceled
     */
    async run(rl: Interface): Promise<boolean> {
        // Welcome step
        console.log("---[CONFIGURATION WIZARD]---");
        console.log("Welcome to the Configuration ConfigurationWizard!");
        await rl.question("Press enter to start: ");

        // Creating data folder
        if(!existsSync(this.dataFolderPath)) {
            console.log("Creating data folder...");
            fs.mkdirSync(this.dataFolderPath);
        }

        // Check is folder isn't created
        if(!existsSync(this.dataFolderPath)) {
            console.log("PANIC! Can't create data folder.");
            return false;
        }

        // Configuration .env file
        console.log("Preparing .env file...");
        const tgAppId = await rl.question("Telegram APP ID: ");
        const tgAppHash = await rl.question("Telegram APP HASH: ");
        const dotEnvContent = `TG_APP_ID=${tgAppId}\nTG_APP_HASH="${tgAppHash}"`;
        fs.writeFileSync(this.envFilePath, dotEnvContent);

        // End
        console.log("---[DONE]---");

        return true;
    }
}