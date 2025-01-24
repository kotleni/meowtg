import BasePlugin from "./base_plugin";
import {readdirSync} from "node:fs";
import PluginsAPI from "./plugins_api";
import {Api} from "telegram";
import Message = Api.Message;

interface OnMessageListener {
    name: string;
    callback: (message: Message) => Promise<void>;
}

export default class PluginsProcessor {
    private loadedPlugins: BasePlugin[] = [];
    private messagesListeners: OnMessageListener[] = [];

    async load(name: string, api: PluginsAPI): Promise<BasePlugin> {
        const path = `../../plugins/${name}.ts`;
        const module = await import(path);
        const plugin: BasePlugin = new module.default();
        plugin.api = api;
        await plugin.onLoad();
        this.loadedPlugins.push(plugin);
        return plugin;
    }

    async unload(name: string): Promise<void> {
        const plugin = this.loadedPlugins.find((p) => p.name === name);
        if(plugin) {
            await plugin.onUnload();
            this.loadedPlugins = this.loadedPlugins.filter(p => p.name !== name);
        }
    }

    async loadAll(api: PluginsAPI) {
        const pluginsFiles = readdirSync("plugins/");
        pluginsFiles.forEach(pluginName => {
            const shortPluginName = pluginName.replace(".ts", "");
            console.log(`Loading plugin ${shortPluginName}....`);
            this.load(shortPluginName, api);
        });
    }

    async invokeAllMessagesListeners(message: Message) {
        this.messagesListeners.forEach(listener => { listener.callback(message); });
    }

    registerMessagesListener(name: string, listener: (message: Message) => Promise<void>) {
        this.messagesListeners.push({ name: "", callback: listener });
    }

    unregisterMessagesListener(name: string) {
        this.messagesListeners = this.messagesListeners.filter((listener) => listener.name !== name);
    }
}