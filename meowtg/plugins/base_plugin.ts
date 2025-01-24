import PluginsAPI from "./plugins_api";

export default interface BasePlugin {
    name: string;
    description: string;
    api: PluginsAPI; // Will be filled with value before onLoad call
                     // But also will be set as null after onUnload call

    onLoad: () => Promise<void>;
    onUnload: () => Promise<void>;
}