import json, os

class Config:
    path = 'config.json'
    pairs = {}

    def load(self):
        if not os.path.isfile(self.path):
            file = open(self.path, 'w')
            file.write("{}")
            file.close()

        file = open(self.path, 'r')
        self.pairs = json.loads(file.read())
        file.close()

    def save(self):
        content = json.dumps(self.pairs)

        file = open(self.path, 'w')
        file.write(content)
        file.close()

    def get(self, key):
        return self.pairs[key]

    def set(self, key, value):
        self.pairs[key] = value
