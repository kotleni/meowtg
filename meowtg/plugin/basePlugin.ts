import SessionManager from "../sessionManager";
import {TelegramClient} from "telegram";
import CommandsProcessor from "../command/commandsProcessor";
import PluginsProcessor from "./pluginsProcessor";
import MessagesProcessor from "../messagesProcessor";

export default class BasePlugin {
    name: string;
    description: string;

    onLoad(): Promise<void> { return Promise.resolve(); }
    onUnload(): Promise<void> { return Promise.resolve(); }

    // External dependencies
    sessionManager: SessionManager;
    telegramClient: TelegramClient;
    commandsProcessor: CommandsProcessor;
    messagesProcessor: MessagesProcessor;
    pluginsProcessor: PluginsProcessor;

    /**
     * Inject all dependencies what needed
     * @param telegramClient
     * @param sessionManager
     * @param pluginsProcessor
     * @param commandsProcessor
     * @param messagesProcessor
     */
    injectDependencies(
        telegramClient: TelegramClient,
        sessionManager: SessionManager,
        pluginsProcessor: PluginsProcessor,
        commandsProcessor: CommandsProcessor,
        messagesProcessor: MessagesProcessor,
    ) {
        this.telegramClient = telegramClient;
        this.sessionManager = sessionManager;
        this.pluginsProcessor = pluginsProcessor;
        this.commandsProcessor = commandsProcessor;
        this.messagesProcessor = messagesProcessor;
    }
}