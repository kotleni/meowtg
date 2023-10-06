import os
from config import Config

class Wizard:
    def is_first_run(self):
        return not os.path.isfile('tg.session')

    def setup(self, config):
        print("-------")
        print("For first run you need configure bot.")
        print("To get telegram app id and hash visit: https://my.telegram.org")
        print("-------\n")

        app_id = input("app_id = ")
        app_hash = input("app_hash = ")

        os.mkdir('assets/')
        os.mkdir('logs/')

        config.set('app_id', app_id)
        config.set('app_hash', app_hash)