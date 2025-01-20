import BasePlugin from "./base_plugin";
import {readdirSync} from "node:fs";
import PluginsAPI from "./plugins_api";

export default class PluginsProcessor {
    async load(name: string, api: PluginsAPI): Promise<BasePlugin> {
        const path = `../plugins/${name}.ts`;
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
}