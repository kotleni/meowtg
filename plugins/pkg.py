# { "name" : "pkg", "description" : "Default plugins manager", "author" : "kotleni", "versionCode" : 1, "versionName" : "1.0.0", "enabled" : true }
from plugin_base import PluginBase
from plugins_loader import PluginsLoader
from api import API
from plugin_header import PluginHeader
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

import os
import json
import requests

from typing import List

class RemoteManager:
    REMOTE_STATIC_URL = 'https://raw.githubusercontent.com/kotleni/meowtg-plugins/main/static.json'
    REMOTE_PLUGINS_URL = 'https://raw.githubusercontent.com/kotleni/meowtg-plugins/main/plugins'

    def fetch_remote_plugins(self):
        static = requests.get(self.REMOTE_STATIC_URL).text
        return json.loads(static)
    
    def fetch_remote_plugin(self, name):
        all = self.fetch_remote_plugins()
        entry = None
        for _entry in all:
            if _entry['name'] == name:
                entry = _entry

        return entry
    
    def download_plugin(self, name):
        all = self.fetch_remote_plugins()
        entry = None
        for _entry in all:
            if _entry['name'] == name:
                entry = _entry

        if entry == None:
            return None

        url = '{}/{}.py'.format(self.REMOTE_PLUGINS_URL, name)
        content = requests.get(url).text


        header = PluginHeader()
        header.loadFromRemoteObject(entry)
        header_text = header.getAsText()

        return '# {}\n{}'.format(header_text, content)

class PluginsManager:
    api: API = None
    loader: PluginsLoader = None

    def __init__(self, api) -> None:
        self.api = api
        self.loader = api.plugins_loader

    def find(self, name):
        all = self.get_all()
        for plug in all:
            if plug.header.name == name:
                return plug
            
        return None

    def get_all(self) -> List[str]:
        return self.loader.get_loaded_plugins()
    
class Pkg(PluginBase):
    pluginsManager: PluginsManager = None
    remoteManager: RemoteManager = None

    def __init__(self, header, api) -> None:
        super().__init__(header, api)
        self.pluginsManager = PluginsManager(api)
        self.remoteManager = RemoteManager()

    async def on_command(self, event, args):
        if args[0] == 'pkg':
            if len(args) < 2:
                return 'Usage: .pkg <list|available|install> ...'
            elif args[1] == 'list':
                plugins = self.pluginsManager.get_all()
                output = 'Installed plugins:\n'
                for plug in plugins:
                    output += '\n{} v{}'.format(plug.header.name, plug.header.versionName)
                    if not plug.header.enabled:
                        output += ' (disabled)'

                return output
            elif args[1] == 'remote':
                all = self.remoteManager.fetch_remote_plugins()
                output = 'Remote plugins:\n'
                for entry in all:
                    local_plug = self.pluginsManager.find(entry['name'])
                    output += '\n{} v{}\n  {}\n  by {}'.format(entry['name'], entry['versionName'], entry['description'], entry['author'])

                    if local_plug != None:
                        output += '\n Installed v{}'.format(local_plug.header.versionName)
                return output
            elif args[1] == 'install':
                if len(args) < 3:
                    return 'Usage: .pkg install <name>'
                content = self.remoteManager.download_plugin(args[2])
                path = '{}/{}.py'.format(self.pluginsManager.loader.folder_path, args[2])
                if os.path.isfile(path):
                   return 'Plugin already exist, use .pkg update <name> instead.' 
                else:
                    if content == None:
                        return 'Unknown plugin. Check .pkg remote to get all remote plugins.'
                    f = open(path, 'w')
                    f.write(content)
                    f.close()

                    await self.pluginsManager.loader.load_plugin(args[2])

                    return 'Installed and loaded {} plugin.'.format(args[2])
            elif args[1] == 'update':
                if len(args) < 3:
                    return 'Usage: .pkg install <name>'
                
                name = args[2]
                path = '{}/{}.py'.format(self.pluginsManager.loader.folder_path, name)
                if os.path.isfile(path):
                    plugin = self.pluginsManager.find(name)
                    entry = self.remoteManager.fetch_remote_plugin(name)

                    if entry == None:
                        return 'Plugin found locally but not exist in remote.'
                    
                    if entry['versionCode'] <= plugin.header.versionCode:
                        return 'Plugin is already updated to actual v{} version.'.format(plugin.header.versionName)
                    
                    content = self.remoteManager.download_plugin(name)

                    await self.pluginsManager.loader.unload_plugin(name)
                    os.remove(path)

                    f = open(path, 'w')
                    f.write(content)
                    f.close()

                    await self.pluginsManager.loader.load_plugin(name)

                    return 'Success updating plugin {} from v{} to v{}.'.format(name, plugin.header.versionName, entry['versionName'])
                else:
                    return 'Plugin {} not installed.'.format(name)
                
            elif args[1] == 'remove':
                if len(args) < 3:
                    return 'Usage: .pkg remove <name>'
                path = '{}/{}.py'.format(self.pluginsManager.loader.folder_path, args[2])
                if os.path.isfile(path):
                    await self.pluginsManager.loader.unload_plugin(args[2])
                    os.remove(path)
                    return 'Success removed plugin.'
                else:
                    return 'Plugin is not exist.'
            else:
                return 'Unknown sub-command.'
            
        return None