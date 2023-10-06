from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

class MediaTimerSave(PluginBase):
    description = "Save and post to saved messages all media with timer"

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
        
        # check is image
        media = message.media
        if media is None:
            return
        if isinstance(media, types.MessageMediaWebPage):
            return
        # if not isinstance(media, types.MessageMediaPhoto):
        #     return
        if media.ttl_seconds is None:
            return
        
        # downlaod image
        path = await self.api.client.download_media(message, 'assets')
        
        # send pic to me
        await self.api.client.send_file(self.api.get_my_id(), path, caption=f'Saved from media with timer.\n{sender.first_name} (@{sender.username} {sender.id}) - {message_text}')