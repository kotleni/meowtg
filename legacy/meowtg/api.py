from plugins_loader import PluginsLoader

from telethon import TelegramClient
from telethon.types import User
from logging import Logger

class API:
    client: TelegramClient = None
    logger: Logger = None
    plugins_loader: PluginsLoader = None

    me: User = None

    def __init__(self, client: TelegramClient, logger: Logger, me: User):
        self.client = client
        self.logger = logger
        self.me = me

    def register_plugins_loader(self, plugins_loader: PluginsLoader):
        self.plugins_loader = plugins_loader

    def get_my_id(self):
        return self.me.id