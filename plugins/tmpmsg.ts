import BasePlugin from "../meowtg/plugins/base_plugin";
import PluginsAPI from "../meowtg/plugins/plugins_api";
import {Api} from "telegram";
import Message = Api.Message;
import {sleep} from "telegram/Helpers";

export default class TmpMsgPlugin implements BasePlugin {
    name: string = "tmp";
    description: string = "Send temporary message. .tmp [seconds] [message]";
    api: PluginsAPI;

    async onLoad() {
        await this.api.commandsProcessor
            .register(this.name, this.description, (args: string[], message: Message) => this.onCommand(args, message));
    }

    private async onCommand(args: string[], message: Message) {
        // TODO: Add catching exception from parseInt
        const time = Number.parseInt(args[1]);
        const text = args[2];

        await this.api.telegramClient
            .editMessage(message.chatId, { message: message.id, text: text });
        await sleep(1000 * time);
        await this.api.telegramClient.deleteMessages(message.chat, [message.id], { revoke: true });
    }
}