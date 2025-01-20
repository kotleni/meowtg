import Base_plugin from "./base_plugin";
import {readdirSync} from "node:fs";
import Plugins_api from "./plugins_api";

export default class PluginsProcessor {
    async load(name: string, api: Plugins_api): Promise<Base_plugin> {
        const path = `../plugins/${name}.ts`;
        const module = await import(path);
        const plugin: Base_plugin = new module.default();
        plugin.api = api;
        await plugin.onLoad();
        return plugin;
    }

    async loadAll(api: Plugins_api) {
        const pluginsFiles = readdirSync("plugins/");
        pluginsFiles.forEach(pluginName => {
            const shortPluginName = pluginName.replace(".ts", "");
            console.log(`Loading plugin ${shortPluginName}....`);
            this.load(shortPluginName, api);
        });
    }
}