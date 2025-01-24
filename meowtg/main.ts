import {Logger} from "telegram/extensions";
import {Api, TelegramClient} from "telegram";
import {NewMessage} from "telegram/events";
import {NewMessageEvent} from "telegram/events/NewMessage";
import * as readline from 'readline/promises';
import {getDisplayName} from "telegram/Utils";
import {LogLevel} from "telegram/extensions/Logger";
import * as dotenv from "dotenv";
import SessionManager from "./sessionManager";
import CommandsProcessor from "./command/commandsProcessor";
import ConfigurationWizard from "./wizard/configurationWizard";
import PluginsProcessor from "./plugin/pluginsProcessor";
import PluginsAPI from "./plugin/pluginsApi";
import {isPrivateMessageNotMine, parseArguments} from "./utils";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class MeowTg {
    configurationWizard: ConfigurationWizard;
    sessionManager: SessionManager;
    client: TelegramClient;
    commandsProcessor: CommandsProcessor;
    pluginsProcessor: PluginsProcessor;
    pluginsApi: PluginsAPI;
    mineId: string;

    async init(sessionManager: SessionManager) {
        console.log("Initializing MeowTG...");

        // Configuration wizard
        this.configurationWizard = new ConfigurationWizard();
        if(this.configurationWizard.isNeeded()) { // Check if configuration is needed
            const isDone = await this.configurationWizard.run(rl);
            if(!isDone) {
                console.log("FATAL ERROR! Configuration wizard is canceled!");
                process.exit(1); // Exit
            }
        }

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
        this.client.addEventHandler((event: NewMessageEvent) => this.onMessage(event), new NewMessage({}));

        this.commandsProcessor = new CommandsProcessor();

        this.pluginsProcessor = new PluginsProcessor();
        this.pluginsApi = new PluginsAPI(this.client, this.sessionManager, this.pluginsProcessor, this.commandsProcessor);
        await this.pluginsProcessor.loadAll(this.pluginsApi); // Load all plugin
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
        this.mineId = me.id.toString();
        console.log(`User loaded: ${getDisplayName(me)}`);
    }

    private async onMessage(event: NewMessageEvent): Promise<void> {
        const message = event.message as Api.Message;

        if (event.isPrivate) {
            const sender = await message.getSender();
            const name = getDisplayName(sender);
            console.log(`${name}: ${message.text}`);

            // Check if command
            if (message.text.startsWith(".") && message.senderId.toString() == this.mineId) {
                const args = parseArguments(message.text);
                const commandName = args[0].slice(1);
                const command = this.commandsProcessor.findCommand(commandName);
                if(command) {
                    await this.commandsProcessor.execute(commandName, args, message);
                } else {
                    console.log(`Command not found: ${message.text}`);
                    await this.client.sendMessage(sender, {
                        message: `Unknown command <b>${commandName}</b>`,
                        parseMode: 'html'
                    });
                }
            } else {
                await this.pluginsProcessor.invokeAllMessagesListeners(message);
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
