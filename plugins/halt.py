from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

class Halt(PluginBase):
    description = "Halt bot on .halt command"
    enabled = True
    
    def __init__(self, api) -> None:
        super().__init__(api)
    
    async def load(self):
        pass

    async def on_command(self, event, args) -> str:
        if args[0] == "halt":
            await self.api.client.disconnect()
            exit(0)