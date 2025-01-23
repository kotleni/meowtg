import BasePlugin from "./base_plugin";
import {readdirSync} from "node:fs";
import PluginsAPI from "./plugins_api";
import {Api} from "telegram";
import Message = Api.Message;

export default class PluginsProcessor {
    private messagesListeners: ((message: Message) => Promise<void>)[] = [];

    async load(name: string, api: PluginsAPI): Promise<BasePlugin> {
        const path = `../../plugins/${name}.ts`;
        const module = await import(path);
        const plugin: BasePlugin = new module.default();
        plugin.api = api;
        await plugin.onLoad();
        return plugin;
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
        this.messagesListeners.forEach(listener => { listener(message); });
    }

    registerMessagesListener(listener: (message: Message) => Promise<void>) {
        this.messagesListeners.push(listener);
    }
}