import SessionManager from "../session_manager";
import {Api, TelegramClient} from "telegram";
import CommandsProcessor from "../commands_processor";
import PluginsProcessor from "./plugins_processor";
import Message = Api.Message;

export default class PluginsAPI {
    readonly sessionManager: SessionManager;
    readonly telegramClient: TelegramClient;
    readonly commandsProcessor: CommandsProcessor;
    readonly pluginsProcessor: PluginsProcessor;

    constructor(telegramClient: TelegramClient, sessionManager: SessionManager, pluginsProcessor: PluginsProcessor, commandsProcessor: CommandsProcessor) {
        this.telegramClient = telegramClient;
        this.sessionManager = sessionManager;
        this.pluginsProcessor = pluginsProcessor;
        this.commandsProcessor = commandsProcessor;
    }

    async showResult(message: Message, output: String) {
        await this.telegramClient
            .editMessage(message.chatId, { message: message.id, text: `${message.text}\n--------\n${output}`, parseMode: "html" })
    }
}