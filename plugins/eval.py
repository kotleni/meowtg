from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest

class Eval(PluginBase):
    """Evaluate python code on .eval command"""
    
    enabled = True
    
    def __init__(self, api) -> None:
        super().__init__(api)
    
    async def load(self):
        pass

    async def on_command(self, event, args) -> str:
        if args[0] == "eval":
            result = ''
            try:
                message_text = event.text
                code = message_text[6:]
                result = eval(args[1])
            except Exception as e:
                result = e
            return result
