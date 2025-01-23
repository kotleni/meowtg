import BasePlugin from "../meowtg/base_plugin";
import PluginsAPI from "../meowtg/plugins_api";
import {Api, utils} from "telegram";
import Message = Api.Message;
import PeerUser = Api.PeerUser;
import {getDisplayName} from "telegram/Utils";
import InputDocumentFileLocation = Api.InputDocumentFileLocation;

export default class CatPlugin implements BasePlugin {
    name: string = "cat";
    description: string = "Read text files.";
    api: PluginsAPI;

    async onLoad() {
        this.api.getCommandsProcessor()
            .register(this.name, this.description, (args: string[], message: Message) => this.onIdCommand(args, message));
    }

    private async onIdCommand(args: string[], message: Message) {
        if(message.replyTo) { // If reply
            const replyMessage = await message.getReplyMessage();
            const doc = replyMessage.document;
            const content = await this.api.getTelegramClient().downloadFile(new InputDocumentFileLocation({
                id: doc.id,
                accessHash: doc.accessHash,
                fileReference: doc.fileReference,
                thumbSize: "y"
            }));
            const contentString = content.toString();
            if(contentString.length < 4096 - 512) {
                await this.api.showResult(message, `<code>${contentString}</code>`);
            } else {
                await this.api.showResult(message, `Error: File is too large.`);
            }
        } else { // Self
            await this.api.showResult(message, `Error: Reply to any text file.`);
        }
    }
}