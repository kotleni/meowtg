import Session_manager from "../session_manager";
import {Api, TelegramClient} from "telegram";
import CommandsProcessor from "../commands_processor";
import PluginsProcessor from "./plugins_processor";
import Message = Api.Message;

export default class PluginsAPI {
    private sessionManager: Session_manager;
    private client: TelegramClient;
    private commandsProcessor: CommandsProcessor;
    private pluginsProcessor: PluginsProcessor;

    constructor(client: TelegramClient, sessionManager: Session_manager, pluginsProcessor: PluginsProcessor, commandsProcessor: CommandsProcessor) {
        this.client = client;
        this.sessionManager = sessionManager;
        this.pluginsProcessor = pluginsProcessor;
        this.commandsProcessor = commandsProcessor;
    }

    getTelegramClient(): TelegramClient {
        return this.client;
    }

    getSessionManager(): Session_manager {
        return this.sessionManager;
    }

    getPluginsProcessor(): PluginsProcessor {
        return this.pluginsProcessor;
    }

    getCommandsProcessor(): CommandsProcessor {
        return this.commandsProcessor;
    }

    async showResult(message: Message, output: String) {
        await this.getTelegramClient()
            .editMessage(message.chatId, { message: message.id, text: `${message.text}\n--------\n${output}`, parseMode: "html" })
    }
}