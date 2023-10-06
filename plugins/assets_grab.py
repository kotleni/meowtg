from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

class AssetsGrab(PluginBase):
    description = "Automatically download all media from chats"

    SIZE_LIMIT_KB = 32 * 1024

    def __init__(self, api) -> None:
        super().__init__(api)
    
    async def load(self):
        pass

    async def on_event(self, event):
        chat = await event.get_chat()
        sender = await event.get_sender()
        message = event.message
        message_text = event.text

        if isinstance(sender, types.Channel):
            return
        
        media = message.media

        if media is None:
            return
        
        if message.file is None:
            return
        
        size = message.file.size
        size_kb = size / 1024

        if size_kb > self.SIZE_LIMIT_KB:
            self.api.logger.warn(f'File size is {size_kb} KB (more than {self.SIZE_LIMIT_KB}), skipping')
            return
        
        # download image
        await self.api.client.download_media(message, 'assets')