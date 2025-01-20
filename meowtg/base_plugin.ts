import Plugins_api from "./plugins_api";

export default interface Base_plugin {
    name: string;
    description: string;
    api: Plugins_api; // Will be filled with value before onLoad call
                     // But also will be set as null after onUnload call

    onLoad: () => Promise<void>;
    //onUnload: () => Promise<void>;
}