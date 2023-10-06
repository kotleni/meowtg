class PluginBase:
    api = None

    description = ""
    enabled = False

    def __init__(self, api) -> None:
        self.api = api

    async def load(self):
        pass

    async def on_event(self, event):
        pass

    async def on_command(self, event, args) -> str:
        return None