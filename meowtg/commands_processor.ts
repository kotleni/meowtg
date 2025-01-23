import Command from "./command";
import {Api} from "telegram";
import Message = Api.Message;

export default class CommandsProcessor {
    private registered_commands: Command[] = [];

    async register(name: string, description: string, callback: (args: string[], message: Message) => Promise<void>) {
        const command = { name: name, description: description, callback: callback };
        this.registered_commands.push(command);

        console.log(`Registered command: ${command.name}`);
    }

    unregister(name: string): void {
        this.registered_commands = this.registered_commands.filter(command => command.name === name);

        console.log(`Unregistered command: ${this.registered_commands.length}`);
    }

    find_command(name: string): Command {
        return this.registered_commands.find((command) => command.name === name);
    }
}