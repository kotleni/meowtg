import logging
from const import *

class CustomFormatter(logging.Formatter):
    grey = "\x1b[38;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"

    FORMATS = {
        logging.DEBUG: grey + LOGGER_FORMATTER + reset,
        logging.INFO: grey + LOGGER_FORMATTER + reset,
        logging.WARNING: yellow + LOGGER_FORMATTER + reset,
        logging.ERROR: red + LOGGER_FORMATTER + reset,
        logging.CRITICAL: bold_red + LOGGER_FORMATTER + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt, datefmt='%H:%M:%S')
        return formatter.format(record)