import Base_plugin from "../meowtg/base_plugin";
import Plugins_api from "../meowtg/plugins_api";
import {Api} from "telegram";
import Message = Api.Message;
import PeerUser = Api.PeerUser;
import {getDisplayName} from "telegram/Utils";

export default class IdPlugin implements Base_plugin {
    name: string = "id";
    description: string = "Get the id of the user.";
    api: Plugins_api;

    async onLoad() {
        this.api.getCommandsProcessor()
            .register(this.name, this.description, (args: string[], message: Message) => this.onIdCommand(args, message));
    }

    private async onIdCommand(args: string[], message: Message) {
        if(message.replyTo) { // If reply
            const replyMessage = await message.getReplyMessage();
            await this.api.showResult(message, `${getDisplayName(replyMessage.sender)} id is ${replyMessage.sender.id}`);
        } else { // Self
            await this.api.showResult(message, `Mine id is ${message.sender.id}`);
        }
    }
}