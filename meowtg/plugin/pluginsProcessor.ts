import BasePlugin from "./basePlugin";
import {readdirSync} from "node:fs";
import {Api, TelegramClient} from "telegram";
import Message = Api.Message;
import SessionManager from "../sessionManager";
import CommandsProcessor from "../command/commandsProcessor";

const PLUGINS_FOLDER_REVERSE_PATH = "../../plugins";
const PLUGINS_FOLDER_RELATIVE_PATH = "./plugins";
const PLUGIN_FILE_EXTENSION = ".ts";

interface OnMessageListener {
    name: string;
    callback: (message: Message) => Promise<void>;
}

/**
 * Plugins loader and processor
 */
export default class PluginsProcessor {
    private loadedPlugins: BasePlugin[] = [];
    private messagesListeners: OnMessageListener[] = [];

    /**
     * Load plugin by name from plugin folder
     * @param name Name of plugin without extension
     * @param telegramClient
     * @param sessionManager
     * @param pluginsProcessor
     * @param commandsProcessor
     */
    async load(name: string, telegramClient: TelegramClient, sessionManager: SessionManager, pluginsProcessor: PluginsProcessor, commandsProcessor: CommandsProcessor): Promise<BasePlugin> {
        const path = `${PLUGINS_FOLDER_REVERSE_PATH}/${name}${PLUGIN_FILE_EXTENSION}`;
        const module = await import(path);
        const plugin: BasePlugin = new module.default();
        plugin.injectDependencies(telegramClient, sessionManager, pluginsProcessor, commandsProcessor);
        await plugin.onLoad();
        this.loadedPlugins.push(plugin);
        return plugin;
    }

    /**
     * Unload plugin by name
     * @param name Name of plugin without extension
     */
    async unload(name: string): Promise<void> {
        const plugin = this.loadedPlugins.find((p) => p.name === name);
        if(plugin) {
            await plugin.onUnload();
            this.loadedPlugins = this.loadedPlugins.filter(p => p.name !== name);
        }
    }

    /**
     * Load all plugin from plugin folder
     * @param telegramClient
     * @param sessionManager
     * @param pluginsProcessor
     * @param commandsProcessor
     */
    async loadAll(telegramClient: TelegramClient, sessionManager: SessionManager, pluginsProcessor: PluginsProcessor, commandsProcessor: CommandsProcessor) {
        const pluginsFiles = readdirSync(PLUGINS_FOLDER_RELATIVE_PATH);
        pluginsFiles.forEach(pluginName => {
            const shortPluginName = pluginName.replace(PLUGIN_FILE_EXTENSION, "");
            console.log(`Loading plugin ${shortPluginName}....`);
            this.load(shortPluginName, telegramClient, sessionManager, pluginsProcessor, commandsProcessor);
        });
    }

    /**
     * Invoke all messages listeners
     * @param message Telegram API message object
     */
    async invokeAllMessagesListeners(message: Message) {
        this.messagesListeners.forEach(listener => { listener.callback(message); });
    }

    /**
     * Register new messages listener
     * @param name Unique name of listener (can be a plugin name)
     * @param listener Function-callback for listening all messages
     */
    registerMessagesListener(name: string, listener: (message: Message) => Promise<void>) {
        this.messagesListeners.push({ name: name, callback: listener });
    }

    /**
     * Unregister messages listener
     * @param name Unique name of listener
     */
    unregisterMessagesListener(name: string) {
        this.messagesListeners = this.messagesListeners.filter((listener) => listener.name !== name);
    }
}