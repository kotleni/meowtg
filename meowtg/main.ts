import {Logger} from "telegram/extensions";
import {Api, TelegramClient} from "telegram";
import {NewMessage} from "telegram/events";
import {NewMessageEvent} from "telegram/events/NewMessage";
import {getDisplayName} from "telegram/Utils";
import {LogLevel} from "telegram/extensions/Logger";

import * as dotenv from "dotenv";
import SessionManager from "@/sessionManager";
import CommandsProcessor from "@/command/commandsProcessor";
import PluginsProcessor from "@/plugin/pluginsProcessor";
import {parseArguments} from "@/utils";
import MessagesProcessor from "@/messagesProcessor";
import {Command} from '@commander-js/extra-typings';
import {StringSession} from "telegram/sessions";
import * as console from "node:console";
import prompt from "prompt";

dotenv.config();
prompt.start();

const TELEGRAM_CLIENT_PARAMS = {
    baseLogger: new Logger(LogLevel.ERROR),
    connectionRetries: 5,
    deviceModel: "meowtg", // TODO: We need to report something here
    deviceName: "meowtg", // TODO: Same
    systemVersion: "meowtg" // TODO: Same

};

class MeowTg {
    sessionManager = new SessionManager();
    commandsProcessor = new CommandsProcessor();
    messagesProcessor = new MessagesProcessor();
    pluginsProcessor = new PluginsProcessor();
    client: TelegramClient = new TelegramClient(
        new StringSession(""),
        Number(process.env.TG_APP_ID),
        process.env.TG_APP_HASH!,
        TELEGRAM_CLIENT_PARAMS
    );
    mineId?: string;

    async start(isWizard: boolean): Promise<void> {
        console.log("Initializing MeowTG...");
        if (isWizard) console.log("Starting in wizard mode...");

        // Load .env config
        if (process.env.TG_APP_ID == undefined
            || process.env.TG_APP_HASH == undefined) {
            console.log("No valid .env configuration loaded.");
            return;
        }

        if (!isWizard) { // Load exist session is not in wizard mode
            this.client.session = await this.sessionManager.load();
        }

        await this.client.connect();

        if (!isWizard && !await this.client.checkAuthorization()) {
            console.log("Authorization required... (hang)");
            // noinspection InfiniteLoopJS
            for (; ;) {
                await new Promise((resolv) => {
                    setTimeout(resolv, 1000);
                });
            }
        }

        // Start client and authorize if needed
        await this.client.start({
            phoneNumber: async () => (await prompt.get(["phone"])).phone as string,
            password: async () => (await prompt.get([{name: 'password', hidden: true}])).password as string,
            phoneCode: async () => (await prompt.get(["code"])).code as string,
            onError: (err) => console.log(err),
        });

        // HAX: Tricky way to get sessionString
        // Session.save() return void by design
        // but in real it's return string with key
        const sessionString: string = `${this.client!.session.save()}`;
        await this.sessionManager.save(sessionString);

        if (isWizard) {
            console.log("Done! Start user bot again...");
            process.exit(0);
        }

        this.client.addEventHandler((event: NewMessageEvent) => this.onMessage(event), new NewMessage({}));
        await this.pluginsProcessor.loadAll(
            this.client,
            this.sessionManager,
            this.pluginsProcessor,
            this.commandsProcessor,
            this.messagesProcessor
        );

        const me = await this.client!.getEntity("me");
        this.mineId = me.id.toString();
        console.log(`User loaded: ${getDisplayName(me)}`);
    }

    private async onMessage(event: NewMessageEvent): Promise<void> {
        const message = event.message as Api.Message;

        await this.messagesProcessor.processMessage(message);

        // Check if a message is not from a channel
        if (event.isPrivate || event.isGroup) {
            const sender = await message.getSender();
            const name = getDisplayName(sender!);
            console.log(`${name}: ${message.text}`);

            // Check if command
            if (message.text.startsWith(".") && message.senderId!.toString() == this.mineId) {
                const args = parseArguments(message.text);
                const commandName = args[0].slice(1);
                const command = this.commandsProcessor.findCommand(commandName);
                if (command) {
                    await this.commandsProcessor.execute(commandName, args, message);
                } else {
                    console.log(`Command not found: ${message.text}`);
                    await this.client.sendMessage(sender!, {
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

const program = new Command()
    .option('--wizard');
program.parse();
const options = program.opts();

const meowtg = new MeowTg();
await meowtg.start(!!options.wizard);