import SessionManager from "../sessionManager";
import {TelegramClient} from "telegram";
import CommandsProcessor from "../command/commandsProcessor";
import PluginsProcessor from "./pluginsProcessor";

export default class BasePlugin {
    name: string;
    description: string;

    onLoad(): Promise<void> { return Promise.resolve(); }
    onUnload(): Promise<void> { return Promise.resolve(); }

    // External dependencies
    sessionManager: SessionManager;
    telegramClient: TelegramClient;
    commandsProcessor: CommandsProcessor;
    pluginsProcessor: PluginsProcessor;

    /**
     * Inject all dependencies what needed
     * @param telegramClient
     * @param sessionManager
     * @param pluginsProcessor
     * @param commandsProcessor
     */
    injectDependencies(telegramClient: TelegramClient, sessionManager: SessionManager, pluginsProcessor: PluginsProcessor, commandsProcessor: CommandsProcessor) {
        this.telegramClient = telegramClient;
        this.sessionManager = sessionManager;
        this.pluginsProcessor = pluginsProcessor;
        this.commandsProcessor = commandsProcessor;
    }
}