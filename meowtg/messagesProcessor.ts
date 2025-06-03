import {Api} from "telegram";
import Message = Api.Message;

/**
 * Represents a registered message handler.
 */
export interface MessageHandler {
    /** Unique name for this handler (for unregistration, logging) */
    name: string;
    /**
     * A function that determines if this handler should process the given message.
     * @param message The incoming message object.
     * @returns True if the handler should be executed, false otherwise.
     */
    condition: (message: Message) => boolean | Promise<boolean>;
    /**
     * The callback function to execute if the condition is met.
     * @param message The incoming message object.
     */
    callback: (message: Message) => Promise<void>;
}

/**
 * Processes incoming messages and dispatches them to registered handlers.
 */
export default class MessagesProcessor {
    private registeredHandlers: MessageHandler[] = [];

    /**
     * Register a new message handler.
     * @param name Unique name for the handler.
     * @param description Optional description of the handler.
     * @param condition A function that returns true if this handler should process the message.
     * @param callback Callback to execute when the condition is met.
     */
    async register(
        name: string,
        condition: (message: Message) => boolean | Promise<boolean>,
        callback: (message: Message) => Promise<void>
    ): Promise<void> {
        if (this.findHandler(name)) {
            console.warn(`Handler with name "${name}" is already registered. Overwriting.`);
            this.unregister(name); // Or throw an error if overwriting is not desired
        }
        const handler: MessageHandler = { name, condition, callback };
        this.registeredHandlers.push(handler);

        console.log(`Registered message handler: ${handler.name}`);
    }

    /**
     * Unregister an existing message handler.
     * @param name Unique name of the handler to unregister.
     */
    unregister(name: string): void {
        const initialCount = this.registeredHandlers.length;
        this.registeredHandlers = this.registeredHandlers.filter(handler => handler.name !== name);

        if (this.registeredHandlers.length < initialCount) {
            console.log(`Unregistered message handler: ${name}`);
        } else {
            console.warn(`Handler with name "${name}" not found for unregistration.`);
        }
    }

    /**
     * Find a handler by its name.
     * @param name Unique name of the handler.
     * @returns The MessageHandler object or undefined if not found.
     */
    findHandler(name: string): MessageHandler | undefined {
        return this.registeredHandlers.find((handler) => handler.name === name);
    }

    /**
     * Process an incoming message.
     * It will iterate through all registered handlers and execute those whose condition returns true.
     * Handlers are executed in the order they were registered.
     * @param message The Telegram API message object (or any message object).
     */
    async processMessage(message: Message): Promise<void> {
        console.log(`Processing message ID: ${message.id} from chat ID:`);
        for (const handler of this.registeredHandlers) {
            try {
                const shouldExecute = await handler.condition(message);
                if (shouldExecute) {
                    console.log(`Executing handler "${handler.name}" for message ID: ${message.id}`);
                    await handler.callback(message);
                    // Decide if you want to stop after the first matching handler
                    // If so, you might add a 'return;' here, or the callback could return a boolean
                    // indicating whether to stop further processing.
                    // For now, all matching handlers will execute.
                }
            } catch (error) {
                console.error(`Error executing handler "${handler.name}" for message ID ${message.id}:`, error);
                // Depending on requirements, you might want to stop processing or continue with other handlers.
            }
        }
    }

    /**
     * Gets the list of all registered handlers.
     * @returns An array of MessageHandler objects.
     */
    getRegisteredHandlers(): ReadonlyArray<MessageHandler> {
        return this.registeredHandlers;
    }
}