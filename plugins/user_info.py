from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
import subprocess
    
class UserInfo(PluginBase):
    """User info by .user command"""
    enabled = True

    def __init__(self, api) -> None:
        super().__init__(api)
        
    async def on_command(self, event, args) -> str:
        if args[0] == "user":
            output = f"{event.chat.first_name} ({event.chat.username})\n"
            output += f"{event.chat.id}\n"
            output += f"{event.chat.phone}"

            return output
