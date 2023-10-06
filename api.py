class API:
    client = None
    logger = None
    plugins_loader = None

    me = None

    def __init__(self, client, logger, me):
        self.client = client
        self.logger = logger
        self.me = me

    def register_plugins_loader(self, plugins_loader):
        self.plugins_loader = plugins_loader

    def get_my_id(self):
        return self.me.id