import glob
import os
import re
import logging, logging.handlers
import time
import sys
import subprocess

########################################################################
LOG = "/var/log/watchdog/api.log"
LOG_FOR_ROTATE = 10

PROCESS="netstat -nap|grep 3001"

########################################################################


########################################################################
# definicion y configuracion de logs
try:
    logger = logging.getLogger('watchdog')
    loggerHandler = logging.handlers.TimedRotatingFileHandler(LOG , 'midnight', 1, backupCount=LOG_FOR_ROTATE)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    loggerHandler.setFormatter(formatter)
    logger.addHandler(loggerHandler)
    logger.setLevel(logging.DEBUG)
except Exception, error:
    print '------------------------------------------------------------------'
    print '[ERROR] Error writing log at %s' % error
    print '------------------------------------------------------------------'
    exit()
########################################################################

def findProcess(proc):
        ps = subprocess.Popen(proc, shell=True, stdout=subprocess.PIPE)
        output = ps.stdout.read()
        ps.stdout.close()
        ps.wait()
        return output

def start_api():
    os.system("node /opt/API_REST/bin/www &")

while True:
    api = findProcess(PROCESS)
    if api != '':
        logger.debug('')
        logger.debug('**********************************************************')
        logger.info('API REST is UP')
        logger.debug('**********************************************************')
        logger.debug('')
    else:
        logger.debug('')
        logger.debug('**********************************************************')
        logger.error('API REST is DOWN')
        start_api()
        logger.debug('**********************************************************')
        logger.debug('')
    time.sleep(10)
