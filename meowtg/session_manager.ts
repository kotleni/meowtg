import {readFileSync, writeFileSync} from "fs";
import {StringSession} from "telegram/sessions";
import {existsSync} from "node:fs";

const SESSION_FILE_PATH: string = "storage/session";
/**
 * Session manager for telegram session string
 */
export default class Session_manager {
    async save(sessionString: string) {
        writeFileSync(SESSION_FILE_PATH, sessionString, { flag: "w" })
    }

    async load(): Promise<StringSession> {
        if (!existsSync(SESSION_FILE_PATH)) {
            // Just reset if file not exist
            await this.reset();
            // And return empty
            return new StringSession("");
        }

        const sessionString = readFileSync(SESSION_FILE_PATH, 'utf-8');
        return new StringSession(sessionString);
    }

    async reset(): Promise<void> {
        writeFileSync(SESSION_FILE_PATH, '', { flag: "w" });
    }
}