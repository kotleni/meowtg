from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
import requests, os
from result_codes import *

class CatPicApi:
    def get_random_cat_pic_url(self):
        return requests.get('https://api.thecatapi.com/v1/images/search').json()[0]['url']
    
    def get_random_cat_pic(self):
        return requests.get(self.get_random_cat_pic_url()).content

class CatPic(PluginBase):
    """Send random cat pic on .cat command"""
    
    enabled = True
    
    cat_pic_api = CatPicApi()

    def __init__(self, api) -> None:
        super().__init__(api)
    
    async def load(self):
        pass

    async def on_command(self, event, args) -> str:
        chat = await event.get_chat()
        message = event.message

        if args[0] == "cat":
            try:
                catpic = self.cat_pic_api.get_random_cat_pic()
                f = open('/tmp/catpic.jpg', 'wb')  
                f.write(catpic)
                f.close()
                # await self.api.client.delete_messages(chat, [message])    
                await self.api.client.send_file(chat, '/tmp/catpic.jpg', force_document=False)
                return COMMAND_OK_MESSAGE_REMOVE
            except Exception as e:
                return "Exception: " + str(e)
