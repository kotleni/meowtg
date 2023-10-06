import sys
import os
import importlib.util
from plugin_base import PluginBase

class PluginsLoader:
    api = None
    folder_path = "plugins"
    plugins = []

    def __init__(self, api):
        self.api = api

    def get_plugins_files(self):
        return [file for file in os.listdir(self.folder_path) if file.endswith('.py')]

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
                    instance = obj(self.api)
                    if instance.enabled:
                        await instance.load()
                        self.plugins.append(instance)

                        self.api.logger.info(f'Plugin {path} loaded.')
                    else:
                        self.api.logger.warn(f'Plugin {path} not loaded. (DISABLED)')
                    break
        except Exception as e:
            self.api.logger.error(f"Error loading {path} plugin: {str(e)}")

    async def load_plugins(self):
        files = self.get_plugins_files()
        for path in files:
            await self.load_plugin(path)

    async def on_event(self, event):
        for plugin in self.plugins:
            await plugin.on_event(event)

    async def on_command(self, event, args) -> str:
        for plugin in self.plugins:
            output = await plugin.on_command(event, args)
            if output != None:
                return output

        return None