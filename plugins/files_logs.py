from plugin_base import PluginBase
from telethon import TelegramClient, events, types
from telethon.tl.functions.messages import SendReactionRequest
import logging, os, datetime
from const import *

class FilesLogs(PluginBase):
    """Enable logging to files"""
    enabled = False

    logs_folder = "logs"

    async def load(self):
        formatter = logging.Formatter(LOGGER_FORMATTER)

        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        log_file_path = os.path.join(self.logs_folder, f"{current_date}.log")
        if not os.path.isdir(self.logs_folder):
            os.mkdir(self.logs_folder)
        file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)

        self.api.logger.addHandler(file_handler)
