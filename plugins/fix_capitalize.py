from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

class Cmd(PluginBase):
    """Capitalize all self messages."""
    enabled = False

    def __init__(self, api) -> None:
        super().__init__(api)

    def capitalize(self, message_text):
        if message_text[0].islower():
            message_text = message_text[0].upper() + message_text[1:]

        # Check if the message ends with '.', '?', or '!'
        if not message_text.endswith(('.', '?', '!')):
            message_text += '.'

        return message_text

        
    async def on_event(self, event):
        chat = await event.get_chat()
        sender = await event.get_sender()
        message = event.message
        message_text = event.text

        if isinstance(sender, types.Channel) or sender.id != self.api.get_my_id() or message_text == None or len(message_text) < 2:
            return
        
        updated = self.capitalize(message_text)
        if updated != message:
            await self.api.client.edit_message(chat, message, updated)
        
