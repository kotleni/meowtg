import BasePlugin from "../meowtg/plugin/basePlugin";
import {Api} from "telegram";
import RepoInfo from "../meowtg/plugin/repoInfo";
import PluginInfo from "../meowtg/plugin/pluginInfo";
import * as fs from "node:fs";
import Message = Api.Message;
import {showResult} from "../meowtg/utils";

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

export default class PkgPlugin extends BasePlugin {
    name: string = "pkg";
    description: string = "Plugins (aka packages) manager.";

    repositoriesClient: RepositoriesClient;
    localPluginsService: LocalPluginsService;

    override async onLoad() {
        this.repositoriesClient = new RepositoriesClient();
        this.localPluginsService = new LocalPluginsService();

        await this.commandsProcessor
            .register(this.name, this.description, (args: string[], message: Message) => this.onCommand(args, message));
    }

    override async onUnload() {
        this.repositoriesClient = undefined;
        this.localPluginsService = undefined;

        this.commandsProcessor.unregister(this.name);
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
            default:
                await showResult(message, "Usage: <code>.pkg [stats|search|list|remove|install] [query|nothing]</code>");
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

        await showResult(message, string);
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

        await showResult(message, string);
    }

    private async onListSubCommand(message: Message) {
        let string = "Installed plugin:\n";
        const plugins = await this.localPluginsService.listInstalled();
        for(const plugin of plugins) {
            string += `${plugin}, `;
        }
        await showResult(message, string);
    }

    private async onRemovePlugin(message: Message, pluginName: string) {
        const plugins = await this.localPluginsService.listInstalled();
        const isExist = plugins.find((pluginNameInstalled) => { return pluginNameInstalled === pluginName; });
        if(isExist) {
            await this.pluginsProcessor.unload(pluginName);
            const isRemoved = await this.localPluginsService.removePlugin(pluginName);
            if(isRemoved) {
                await showResult(message, `Plugin ${pluginName} successfully removed.`);
            } else {
                await showResult(message, `Error: Can't remove plugin.`);
            }
        } else {
            await showResult(message, `Error: Plugin ${pluginName} not exist.`);
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
            await showResult(message, "Cannot fetch plugin info.");
            return;
        }

        // Download plugin
        const pluginUrl = `${repoUrl}/${pluginInfo.name}.ts`;
        const res = await fetch(`${pluginUrl}`, {});
        const content  = await res.text();

        // Write/install plugin
        const isSuccess = await this.localPluginsService.addPlugin(pluginName, content);
        if(!isSuccess) {
            await showResult(message, "Cannot install plugin.");
            return;
        }

        // Load plugin
        await this.pluginsProcessor.load(
            pluginName,
            this.telegramClient,
            this.sessionManager,
            this.pluginsProcessor,
            this.commandsProcessor
        );

        await showResult(message, "Plugin successfully installed.");
    }
}