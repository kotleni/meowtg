from plugin_header import PluginHeader

class PluginBase:
    api = None

    header: PluginHeader = None

    def __init__(self, header, api) -> None:
        self.header = header
        self.api = api

    async def load(self):
        pass

    async def on_event(self, event):
        pass

    async def on_command(self, event, args) -> str:
        return None