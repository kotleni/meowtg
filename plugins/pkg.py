# { "name" : "pkg", "description" : "Default plugins manager", "author" : "kotleni", "versionCode" : 1, "versionName" : "1.0.0", "enabled" : true }
from plugin_base import PluginBase
from plugins_loader import PluginsLoader
from api import API
from plugin_header import PluginHeader
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

import json
import requests

from typing import List

class RemoteManager:
    REMOTE_STATIC_URL = 'https://raw.githubusercontent.com/kotleni/meowtg-plugins/main/static.json'
    REMOTE_PLUGINS_URL = 'https://raw.githubusercontent.com/kotleni/meowtg-plugins/main/plugins'

    def fetch_remote_plugins(self):
        static = requests.get(self.REMOTE_STATIC_URL).content
        return json.loads(static)

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
                return 'Usage: .pkg <list|all> ...'
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
            else:
                return 'Unknown sub-command.'
            
        return None