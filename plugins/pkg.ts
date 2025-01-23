import BasePlugin from "../meowtg/base_plugin";
import PluginsAPI from "../meowtg/plugins_api";
import {Api} from "telegram";
import Message = Api.Message;
import PeerUser = Api.PeerUser;
import {getDisplayName} from "telegram/Utils";
import RepoInfo from "../meowtg/plugins/repo_info";
import PluginInfo from "../meowtg/plugins/plugin_info";
import * as fs from "node:fs";

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

export default class PkgPlugin implements BasePlugin {
    name: string = "pkg";
    description: string = "Plugins (aka packages) manager.";
    api: PluginsAPI;
    repositoriesClient: RepositoriesClient;

    async onLoad() {
        this.repositoriesClient = new RepositoriesClient();

        this.api.getCommandsProcessor()
            .register(this.name, this.description, (args: string[], message: Message) => this.onCommand(args, message));
    }

    private async onCommand(args: string[], message: Message) {
        const operation = args[1];
        switch (operation) {
            case "stats":
                let string = "Repositories statistics:";
                const repos = await this.repositoriesClient.loadRepositoriesInfo();

                for(const repo of repos) {
                    // console.log(`Repo: ${repo.name}`);
                    const plugins = await this.repositoriesClient.fetchRepositoryPlugins(repo);
                    // TODO: Detect is repo return error
                    string += `\n<b>${repo.name}</b> has <b>${plugins.length}</b> packages.`;
                }

                await this.api.showResult(message, string);
                break;
        }
    }
}