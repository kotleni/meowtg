import requests
from plugins_loader import PluginsLoader
from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
from const import PLUGINS_FOLDER_PATH, PLUGINS_FOLDER_PATH
from main import logger
from os import listdir, remove, mkdir


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

        return response.status_code


# def check_custom_plugins_directory():
#     try:
#         listdir(PLUGINS_FOLDER_PATH)
#
#     except FileNotFoundError:
#         logger.info('Creating custom plugins directory')
#         mkdir(PLUGINS_FOLDER_PATH)


class Install(PluginBase):
    """
    Plugin that can install a custom plugin:
    .install <link>
    .install plugin_name
    .install reply_to_message
    """
    enabled = True

    def __init__(self, api) -> None:
        super().__init__(api)

    async def load(self):
        pass

    async def on_command(self, event, args) -> str:
        output = ''
        plugin_name = ''
        if args[0] == "install":
            # check_custom_plugins_directory()
            chat = await event.get_chat()

            if event.reply_to:

                message = await self.api.client.get_messages(chat.id, ids=event.reply_to.reply_to_msg_id)
                plugin_name = message.media.document.attributes[0].file_name

                await self.api.client.download_file(message, PLUGINS_FOLDER_PATH + plugin_name)
                output = f"Successfully installed plugin: {plugin_name}"

            elif 'http' in event.message.text:
                url = Url(" ".join(event.message.text.split()[1:]))
                plugin_name = url.file_name
                if url.download() != 200:
                    output = f"Error installing plugin via http, response code: {url.download()}"

                else:
                    output = f"Successfully installed plugin {plugin_name}"

            elif len(event.message.text.split()) > 0:
                """
                Coming soon
                """
                ...

                ...

            else:
                output = "Error installing plugin: unknown error"

            #if plugin_name in listdir(PLUGINS_FOLDER_PATH):
                #remove(f"{PLUGINS_FOLDER_PATH}/{plugin_name}")
                #return 'You already have this plugin, updated.'

            plugins_loader = self.api.plugins_loader
            await plugins_loader.load_plugin(plugin_name)

            logger.info(f"Installed new plugin {plugin_name}")
            return output
