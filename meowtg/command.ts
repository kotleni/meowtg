import {Api} from "telegram";
import Message = Api.Message;

export default interface Command {
    name: string;
    description: string;
    callback: (args: string[], message: Message) => void;
}