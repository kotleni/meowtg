import sys
import os
import importlib.util
from plugin_base import PluginBase
from plugin_header import PluginHeader
from const import PLUGINS_FOLDER_PATH
import traceback

class PluginsLoader:
    api = None
    folder_path = PLUGINS_FOLDER_PATH
    plugins = []

    def __init__(self, api):
        self.api = api

    def get_plugins_files(self):
        return [file for file in os.listdir(self.folder_path) if file.endswith('.py')]
    
    def get_loaded_plugins(self):
        return self.plugins
    
    async def reload_plugins(self):
        for plugin in self.get_loaded_plugins():
            if plugin.header.name == 'pkg': # Ignore integrated pkg plugin
                continue
            await self.unload_plugin(plugin.header.name)
            await self.load_plugin(plugin.header.name)

    async def load_plugin(self, path):
        module_name = path.replace('.py', '')
        module_path = f'{self.folder_path}/{module_name}.py'

        try:
            # Use the built-in importlib library to dynamically import the plugin module
            spec = importlib.util.spec_from_file_location(module_name, module_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Find and create an instance of the plugin class
            for name, obj in vars(module).items():
                if isinstance(obj, type) and issubclass(obj, PluginBase) and obj is not PluginBase:
                    # Load header
                    header = PluginHeader()
                    header.loadFromPath(module_path)

                    instance = obj(header, self.api)

                    if header.enabled:
                        await instance.load()
                        self.plugins.append(instance)

                        self.api.logger.info(f'Plugin {header.name} (v{header.versionName}) loaded.')
                    else:
                        self.plugins.append(instance)
                        self.api.logger.warn(f'Plugin {header.name} (v{header.versionName}) not loaded. (DISABLED)')
                    break
        except Exception as e:
            traceback_str = ''.join(traceback.format_tb(e.__traceback__))
            self.api.logger.error(f"Error loading {path} plugin: {str(traceback_str)}\n{e}")

    async def unload_plugin(self, name):
        all = self.get_loaded_plugins()
        plugin = None
        for _plugin in all:
            if _plugin.header.name == name:
                plugin = _plugin

        if plugin == None:
            self.api.logger.info('Can\'t unload because plugin {} is not loaded.'.format(name))
            return False
        
        self.plugins.remove(plugin)
        self.api.logger.info('Unloaded plugin {}.'.format(name))
        return True

    async def load_plugins(self):
        files = self.get_plugins_files()
        for path in files:
            await self.load_plugin(path)

    async def on_event(self, event):
        for plugin in self.plugins:
            if plugin.header.enabled:
                await plugin.on_event(event)

    async def on_command(self, event, args) -> str:
        for plugin in self.plugins:
            output = await plugin.on_command(event, args)
            if output != None and plugin.header.enabled:
                return output

        return None