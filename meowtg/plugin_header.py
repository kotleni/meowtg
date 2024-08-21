import json

class PluginHeader:
    name = None
    description = None
    author = None
    versionCode = None
    versionName = None
    enabled = None

    def loadFromPath(self, path):
        f = open(path, 'r')
        head = f.read().split('\n')[0].replace('# ', '')
        f.close()

        header = json.loads(head)

        self.name = header['name']
        self.description = header['description']
        self.author = header['author']
        self.versionCode = header['versionCode']
        self.versionName = header['versionName']
        self.enabled = header['enabled']

    def loadFromRemoteObject(self, obj):
        self.name = obj['name']
        self.description = obj['description']
        self.author = obj['author']
        self.versionCode = obj['versionCode']
        self.versionName = obj['versionName']
        self.enabled = True

    def getAsText(self):
        dict = { "name" : self.name, "description" : self.description, "author" : self.author, "versionCode" : self.versionCode, "versionName" : self.versionName, "enabled" : self.enabled  }
        return json.dumps(dict)