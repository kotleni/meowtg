from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
import requests
from const import REPO, PLUGINS_FOLDER_PATH
from os import remove as remove_plugin_file


class Url:

    def __init__(self, url):
        self.file_name = url.split('/')[-1]
        self.url = url

    def download(self, path=PLUGINS_FOLDER_PATH):
        response = requests.get(self.url)
        if response.status_code == 200:
            with open(path + self.file_name, 'wb') as file:
                file.write(response.content)

        return response.status_code


class PackageHandler:
    def __init__(self, plugin, api):
        self.plugin = plugin
        self.url = Url(REPO + '/' + self.plugin)
        self.api = api

    def install(self):
        result = f'Successfully installed {self.plugin}\n'

        if self.url.download() != 200:
            result = f'Unable to locate plugin {self.plugin}\n'


        return result + self.load()

    def remove(self, path=PLUGINS_FOLDER_PATH):
        result = f'Successfully removed {self.plugin}\n'
        try:
            remove_plugin_file(path + '/' + self.plugin)

        except FileNotFoundError:
            result = f'Unable to locate plugin {self.plugin}\n'


        return result  + self.load()

    def search(self):
        url = 'https://api.github.com/repos/kotleni/meowtg/contents/plugins'
        if REPO != 'https://raw.githubusercontent.com/kotleni/meowtg-plugins/main/plugins/':
            return 'This command working only on original repository set REPO="https://raw.githubusercontent.com/kotleni/meowtg-plugins/main/plugins/"'

        response = requests.get(url)
        json_data = response.json()

        count = 0
        output = ''
        for plugin in json_data:
            if plugin['name'] == self.plugin:
                output += f'Plugin name: {plugin["name"]}\nLink: {plugin["html_url"]}\nDownload link: {plugin["download_url"]}\n'
                count+=1
        result = f'Found plugins in: {count} plugins\n{output}'

        return result

    def load(self):
        plugins_loader = self.api.plugins_loader
        plugins_loader.load_plugin(self.plugin)

        return 'Successfully reloaded'




class Package(PluginBase):
    """Package installer module: .pkg install .pkg list .pkg search .pkg remove"""
    enabled = True

    def __init__(self, api) -> None:
        super().__init__(api)

    async def load(self):
        pass

    async def on_command(self, event, args) -> str:
        if args[0] == "pkg":
            package = PackageHandler(args[2], self.api) # args[2] - plugin name
            match args[1]:
                case 'install':
                    return package.install()
                case 'remove':
                    return package.remove()
                case 'search':
                    return package.search()
                case 'reload':
                    return package.load()
                case _:
                    return 'Illegal command usage'

