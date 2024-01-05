from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
from random import randint

class ReactTarget:
    id = None
    emoji = None

    def __init__(self, id, emoji) -> None:
        self.id = id
        self.emoji = emoji

class AutoReact(PluginBase):
    """Automatically react to messages from certain users (config in py code)"""
    
    enabled = False

    react_targets = [ReactTarget(802764912, '💩'), ReactTarget(971778574, '🔥')]

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
        
        for target in self.react_targets:
            if sender.id == target.id and randint(0, 100) < 5:
                await self.api.client(SendReactionRequest(
                    peer = chat,
                    msg_id = message.id,
                    reaction = [types.ReactionEmoji(
                        emoticon=target.emoji
                    )]
                ))
                break
