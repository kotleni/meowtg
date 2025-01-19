from config import Config
from wizard import Wizard
from api import API
from plugins_loader import PluginsLoader

from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
import logging, sys, os, datetime
from custom_formatter import CustomFormatter

from result_codes import *
from const import *

import shlex

api = None

config = Config()
config.load()

wizard = Wizard()
if wizard.is_first_run():
    wizard.setup(config)
    config.save()

client = TelegramClient('tg', config.get('app_id'), config.get('app_hash'))
plugins_loader = None

logger = logging.getLogger('meowtg')
logger.setLevel(logging.INFO)
formatter = CustomFormatter()

stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setLevel(logging.DEBUG)
stdout_handler.setFormatter(formatter)

logger.addHandler(stdout_handler)

@client.on(events.NewMessage)
async def log_message(event):
    chat = await event.get_chat()
    sender = await event.get_sender()
    message = event.message
    message_text = event.text

    log_message = ""
    if isinstance(sender, types.Channel):
        return

    if isinstance(sender, types.User):
        try:
            log_message = f"{sender.first_name} ({sender.username}, {sender.id}) in {chat.username}: {message_text}"
        except:
            log_message = f"{sender.first_name} ({sender.username}, {sender.id}) in ^{chat.title}: {message_text}"

    logger.info(log_message)
    
    prefix = "."
    if message_text.startswith(prefix) and len(message_text) > 3 and sender.id == api.get_my_id():
        command = message_text[len(prefix):]
        args = shlex.split(command)
        result = await plugins_loader.on_command(event, args)

        if result == COMMAND_OK_MESSAGE_REMOVE:
            await client.delete_messages(chat, [message])
            return

        if result == None:
            result = "Unknown command"
        
        if result.startswith(COMMAND_OK_MESSAGE_REPLY):
            await client.send_message(chat, f'{result.replace(COMMAND_OK_MESSAGE_REPLY, "")}', reply_to=message.id, parse_mode='html')
        else:
            await client.edit_message(chat, message, f'{message_text}\n-------\n{result}', parse_mode='html')
    else:
        await plugins_loader.on_event(event)

async def main():
    global plugins_loader, api

    logger.info("MeowTG is starting...")
    logger.info("Version: {}".format(VERSION_NAME))
    logger.info("Github: {}".format(REPO))

    await client.start()
    me = await client.get_me()
    api = API(client, logger, me)

    plugins_loader = PluginsLoader(api)
    api.register_plugins_loader(plugins_loader)

    logger.info("Loading plugins...")
    
    # Force load pkg as plugins
    await plugins_loader.load_plugin('../meowtg/pkg.py')
    
    await plugins_loader.load_plugins()
    await client.run_until_disconnected()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
