import {Logger} from "telegram/extensions";
import {Api, TelegramClient} from "telegram";
import {StringSession} from "telegram/sessions";
import {NewMessage} from "telegram/events";
import {NewMessageEvent} from "telegram/events/NewMessage";
import * as readline from 'readline/promises';
import {getDisplayName} from "telegram/Utils";
import {readFileSync, writeFileSync} from "fs";
import {LogLevel} from "telegram/extensions/Logger";
import * as dotenv from "dotenv";
import SessionManager from "./sessionmanager";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class MeowTg {
    sessionManager: SessionManager;
    client: TelegramClient;

    async init(sessionManager: SessionManager) {
        console.log("Initializing MeowTG...");

        // Load .env config
        // TODO: Need to check also all if values is exist and valid
        if(dotenv.config().error || process.env.TG_APP_ID == undefined) {
            console.log("No valid .env configuration loaded."); // TODO: User need more info about it
            return;
        }

        this.sessionManager = new SessionManager();

        // Initialize telegram client
        const clientParams = {
            baseLogger: new Logger(LogLevel.ERROR),
            connectionRetries: 5,
            deviceModel: "meowtg", // TODO: We need to report something here
            deviceName: "meowtg", // TODO: Same
            systemVersion: "meowtg" // TODO: Same

        };
        this.client = new TelegramClient(
            await sessionManager.load(),
            Number(process.env.TG_APP_ID),
            process.env.TG_APP_HASH,
            clientParams
        );
        this.client.addEventHandler(this.onMessage, new NewMessage({}));
    }

    async start(): Promise<void> {
        // Start client and authorize if needed
        await this.client.start({
            phoneNumber: async () => await rl.question("number: "),
            password: async () => await rl.question("password: "),
            phoneCode: async () => await rl.question("code: "),
            onError: (err) => console. log(err),
        });

        // HAX: Tricky way to get sessionString
        // Session.save() return void by design
        // but in real it's return string with key
        const sessionString: string = `${this.client.session.save()}`;
        await this.sessionManager.save(sessionString);

        const me = await this.client.getEntity("me");
        console.log(`User loaded: ${getDisplayName(me)}`);
    }

    private async onMessage(event: NewMessageEvent): Promise<void> {
        const message = event.message as Api.Message;

        if (event.isPrivate) {
            const sender = await message.getSender();
            const name = getDisplayName(sender);
            console.log(`${name}: ${message.text}`);

            // TODO: Impl commands registering
            if (message.text == "!test") {
                const sender = await message.getSender();
                await this.client.sendMessage(sender, {
                    message: `hi your id is ${message.senderId}`,
                });
            }
        }
    }
}

// Main
(async () => {
    const meowtg = new MeowTg();
    const sessionManager = new SessionManager();
    await meowtg.init(sessionManager);
    await meowtg.start();
})();
