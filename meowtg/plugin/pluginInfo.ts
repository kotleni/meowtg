import VersionInfo from "./versionInfo";

export default interface PluginInfo {
    name: string;
    description: string;
    permissions: string[]; // Not implemented yet
    dependencies: string[]; // Not implemented yet
    authors: string[];
    pluginVersion: VersionInfo;
    clientVersion: VersionInfo;
}