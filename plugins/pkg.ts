import BasePlugin from "../meowtg/plugins/base_plugin";
import PluginsAPI from "../meowtg/plugins/plugins_api";
import {Api} from "telegram";
import RepoInfo from "../meowtg/plugins/repo_info";
import PluginInfo from "../meowtg/plugins/plugin_info";
import * as fs from "node:fs";
import Message = Api.Message;

const PLUGINS_FOLDER_PATH = "./plugins";

class RepositoriesClient {
    private repositoriesInfoFilePath: string = "storage/repositories.json";

    async loadRepositoriesInfo(): Promise<RepoInfo[]> {
        const content = fs.readFileSync(this.repositoriesInfoFilePath);
        // TODO: Impl errors detecting
        return JSON.parse(content.toString());
    }

    async fetchRepositoryPlugins(repo: RepoInfo): Promise<PluginInfo[]> {
        const url = repo.url;
        // TODO: Impl errors detecting
        const res = await fetch(`${url}meta.json`);
        return await res.json() as PluginInfo[];
    }
}

class LocalPluginsService {
    async listInstalled(): Promise<string[]> {
        return fs.readdirSync(PLUGINS_FOLDER_PATH).map<string>(entry => { return entry.replace(".ts", ""); });
    }

    async removePlugin(pluginName: string): Promise<boolean> {
        fs.rmSync(`${PLUGINS_FOLDER_PATH}/${pluginName}.ts`);
        return true; // TODO: Detect if removed
    }

    async addPlugin(pluginName: string, content: string): Promise<boolean> {
        fs.writeFileSync(`${PLUGINS_FOLDER_PATH}/${pluginName}.ts`, content);
        return true; // TODO: Detect if writed
    }
}

export default class PkgPlugin implements BasePlugin {
    name: string = "pkg";
    description: string = "Plugins (aka packages) manager.";
    api: PluginsAPI;
    repositoriesClient: RepositoriesClient;
    localPluginsService: LocalPluginsService;

    async onLoad() {
        this.repositoriesClient = new RepositoriesClient();
        this.localPluginsService = new LocalPluginsService();

        await this.api.commandsProcessor
            .register(this.name, this.description, (args: string[], message: Message) => this.onCommand(args, message));
    }

    async onUnload() {
        this.repositoriesClient = undefined;
        this.localPluginsService = undefined;

        this.api.commandsProcessor.unregister(this.name);
    }

    private async onCommand(args: string[], message: Message) {
        const operation = args[1];
        switch (operation) {
            case "stats":
                await this.onStatsSubCommand(message);
                break;
            case "search":
                await this.onSearchSubCommand(message, args[2]);
                break;
            case "list":
                await this.onListSubCommand(message);
                break;
            case "remove":
                await this.onRemovePlugin(message, args[2]);
                break;
            case "install":
                await this.onInstallPlugin(message, args[2]);
                break;
        }
    }

    private async onStatsSubCommand(message: Message) {
        let string = "Repositories statistics:";
        const repos = await this.repositoriesClient.loadRepositoriesInfo();

        for(const repo of repos) {
            // console.log(`Repo: ${repo.name}`);
            const plugins = await this.repositoriesClient.fetchRepositoryPlugins(repo);
            // TODO: Detect is repo return error
            string += `\n<b>${repo.name}</b> has <b>${plugins.length}</b> packages.`;
        }

        await this.api.showResult(message, string);
    }

    private async onSearchSubCommand(message: Message, query: string) {
        let string = "Result:";
        const repos = await this.repositoriesClient.loadRepositoriesInfo();

        for(const repo of repos) {
            const plugins = await this.repositoriesClient.fetchRepositoryPlugins(repo);
            for(const plugin of plugins) {
                if(plugin.name.includes(query)) {
                    string += `\n<b>${repo.name}/${plugin.name}</b> - <b>${plugin.description}</b>`;
                }
            }
        }

        await this.api.showResult(message, string);
    }

    private async onListSubCommand(message: Message) {
        let string = "Installed plugins:\n";
        const plugins = await this.localPluginsService.listInstalled();
        for(const plugin of plugins) {
            string += `${plugin}, `;
        }
        await this.api.showResult(message, string);
    }

    private async onRemovePlugin(message: Message, pluginName: string) {
        const plugins = await this.localPluginsService.listInstalled();
        const isExist = plugins.find((pluginNameInstalled) => { return pluginNameInstalled === pluginName; });
        if(isExist) {
            await this.api.pluginsProcessor.unload(pluginName);
            const isRemoved = await this.localPluginsService.removePlugin(pluginName);
            if(isRemoved) {
                await this.api.showResult(message, `Plugin ${pluginName} successfully removed.`);
            } else {
                await this.api.showResult(message, `Error: Can't remove plugin.`);
            }
        } else {
            await this.api.showResult(message, `Error: Plugin ${pluginName} not exist.`);
        }
    }

    private async onInstallPlugin(message: Message, pluginName: string) {
        // Find plugin
        const repos = await this.repositoriesClient.loadRepositoriesInfo();

        let repoUrl: string = undefined;
        let pluginInfo: PluginInfo = undefined;

        for(const repo of repos) {
            const plugins = await this.repositoriesClient.fetchRepositoryPlugins(repo);
            for(const plugin of plugins) {
                if(plugin.name === pluginName) {
                    pluginInfo = plugin;
                    repoUrl = repo.url;
                }
            }
        }

        if(!pluginInfo) {
            await this.api.showResult(message, "Cannot fetch plugin info.");
            return;
        }

        // Download plugin
        const pluginUrl = `${repoUrl}/${pluginInfo.name}.ts`;
        const res = await fetch(`${pluginUrl}`, {});
        const content  = await res.text();

        // Write/install plugin
        const isSuccess = await this.localPluginsService.addPlugin(pluginName, content);
        if(!isSuccess) {
            await this.api.showResult(message, "Cannot install plugin.");
            return;
        }

        // Load plugin
        await this.api.pluginsProcessor.load(pluginName, this.api);

        await this.api.showResult(message, "Plugin successfully installed.");
    }
}