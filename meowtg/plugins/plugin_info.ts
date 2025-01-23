import VersionInfo from "./version_info";

export default interface PluginInfo {
    name: string;
    description: string;
    permissions: string[]; // Not implemented yet
    dependencies: string[]; // Not implemented yet
    authors: string[];
    pluginVersion: VersionInfo;
    clientVersion: VersionInfo;
}