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
import Session_manager from "./session_manager";
import BasePlugin from "./base_plugin";
import {readdirSync} from "node:fs";
import CommandsProcessor from "./commands_processor";
import PluginsProcessor from "./plugins_processor";
import PluginsAPI from "./plugins_api";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class MeowTg {
    sessionManager: Session_manager;
    client: TelegramClient;
    commandsProcessor: CommandsProcessor;
    pluginsProcessor: PluginsProcessor;
    pluginsApi: PluginsAPI;

    async init(sessionManager: Session_manager) {
        console.log("Initializing MeowTG...");

        // Load .env config
        // TODO: Need to check also all if values is exist and valid
        if(dotenv.config().error || process.env.TG_APP_ID == undefined) {
            console.log("No valid .env configuration loaded."); // TODO: User need more info about it
            return;
        }

        this.sessionManager = new Session_manager();

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
        this.client.addEventHandler((event: NewMessageEvent) => this.onMessage(event), new NewMessage({}));

        this.commandsProcessor = new CommandsProcessor();
        this.commandsProcessor.register('plug', 'Manage plugins.', (args, message) => {
            console.log("Not implemented yet.");
        });

        this.pluginsProcessor = new PluginsProcessor();
        this.pluginsApi = new PluginsAPI(this.client, this.sessionManager, this.pluginsProcessor, this.commandsProcessor);
        await this.pluginsProcessor.loadAll(this.pluginsApi); // Load all plugins
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

            // Check if command
            if (message.text.startsWith(".")) {
                const args = message.text.split(" ");
                const commandName = args[0].slice(1);
                const command = this.commandsProcessor.find_command(commandName);
                if(command) {
                    command.callback(args, message); // Execute
                } else {
                    console.log(`Command not found: ${message.text}`);
                    await this.client.sendMessage(sender, {
                        message: `Unknown command <b>${commandName}</b>`,
                        parseMode: 'html'
                    });
                }
            }
        }
    }
}

// Main
(async () => {
    const meowtg = new MeowTg();
    const sessionManager = new Session_manager();
    await meowtg.init(sessionManager);
    await meowtg.start();
})();
