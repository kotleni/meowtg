from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
import subprocess

class CommandLineExecutor:
    def execute(self, command):
        return subprocess.run(command, shell=True, capture_output=True)
    
class Cmd(PluginBase):
    """Execute shell commands on .cmd command"""
    
    enabled = True
    
    executor = CommandLineExecutor()

    def __init__(self, api) -> None:
        super().__init__(api)
        
    async def on_command(self, event, args) -> str:
        if args[0] == "cmd" or args[0] == "shell" or args[0] == "exec":
            try:
                command = " ".join(args[1:])
                output = str(self.executor.execute(command).stdout.decode('utf-8'))
                output = output + str(self.executor.execute(command).stderr.decode('utf-8'))
                
            except IndexError:
                return "Incorrect command usage. Example: .cmd <command> (e.g., .cmd wmic csproduct get name)."
            except Exception as e:
                return e
            return output
