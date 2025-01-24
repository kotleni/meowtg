import Command from "./command";
import {Api} from "telegram";
import Message = Api.Message;

/**
 * Commands processor and executor
 */
export default class CommandsProcessor {
    private registeredCommands: Command[] = [];

    /**
     * Register new command
     * @param name Unique name of command without dot
     * @param description Description of plugin, can be empty
     * @param callback Callback for listening command executions
     */
    async register(name: string, description: string, callback: (args: string[], message: Message) => Promise<void>) {
        const command = { name: name, description: description, callback: callback };
        this.registeredCommands.push(command);

        console.log(`Registered command: ${command.name}`);
    }

    /**
     * Unregister exist command
     * @param name Unique name of command without dot
     */
    unregister(name: string): void {
        this.registeredCommands = this.registeredCommands.filter(command => command.name === name);

        console.log(`Unregistered command: ${this.registeredCommands.length}`);
    }

    /**
     * Find command by name
     * @param name Unique name of command without dot
     */
    findCommand(name: string): Command {
        return this.registeredCommands.find((command) => command.name === name);
    }

    /**
     * Execute command by name
     * @param name Unique name of command without dot
     * @param args Arguments, first element is command with dot
     * @param message Telegram API message object
     */
    async execute(name: string, args: string[], message: Message) {
        const command = this.findCommand(name);
        await command.callback(args, message);
    }
}