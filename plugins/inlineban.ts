import BasePlugin from "../meowtg/plugins/base_plugin";
import PluginsAPI from "../meowtg/plugins/plugins_api";
import {Api} from "telegram";
import Message = Api.Message;
import Config from "../meowtg/config";

type StorePluginConfig = { bannedIds: string[]; warningMessage: string; }

interface SendWarningInfo {
    id: string;
    time: number;
}

const WARNING_COOLDOWN_MS = 6000;

export default class InlineBanPlugin implements BasePlugin {
    name: string = "inlineban";
    description: string = "Alternative way to ban users.";
    api: PluginsAPI;
    config: Config<StorePluginConfig>;
    lastWarnings: SendWarningInfo[] = [];

    async onLoad() {
        const fallback: StorePluginConfig = { bannedIds: [], warningMessage: "❌ You are not allowed to text here." };
        this.config = new Config(this.name, fallback);
        await this.config.load();

        await this.api.commandsProcessor.register("iban", this.description, (args: string[], message: Message) => this.onBanCommand(args, message));
        await this.api.commandsProcessor.register("ipardon", this.description, (args: string[], message: Message) => this.onPardonCommand(args, message));
        this.api.pluginsProcessor.registerMessagesListener((message: Message) => this.onMessage(message));
    }

    private async onMessage(message: Message): Promise<void> {
        //if(!isPrivateMessageNotMine(message)) return;

        const targetId = message.chatId;
        if(this.config.model.bannedIds.find(id => id == targetId.toString())) {
            await this.api.telegramClient.deleteMessages(message.chatId, [message.id], {});

            const warningInfo = this.lastWarnings.find(warning => warning.id === targetId.toString());
            if(!warningInfo || Date.now() - warningInfo.time > WARNING_COOLDOWN_MS) {
                await this.api.telegramClient.sendMessage(message.chatId, {message: this.config.model.warningMessage});
                this.lastWarnings.push({ id: targetId.toString(), time: Date.now() });
            }
        }
    }

    private async onBanCommand(args: string[], message: Message) {
        const targetId = message.chatId;
        await this.api.showResult(message, `User with id ${targetId} has ben inline-banned.`);
        this.config.model.bannedIds.push(targetId.toString());
        await this.config.save();
    }

    private async onPardonCommand(args: string[], message: Message) {
        const targetId = message.chatId;
        await this.api.showResult(message, `User with id ${targetId} has ben inline-unbanned.`);
        this.config.model.bannedIds = this.config.model.bannedIds.filter(id => id !== targetId.toString());
        await this.config.save();
    }
}