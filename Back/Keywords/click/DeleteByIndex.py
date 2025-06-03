import logging
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from Utils.ByType import ByJavaMethod

from selenium.webdriver.common.action_chains import ActionChains
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands

class DeleteByIndex:
    @staticmethod
    def dclick(index: int):
        logging.info(f"Double Click By Index {index}")
        first_row = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(f".basic-grid .x-grid-view .x-grid-item[data-recordindex='{index}'] tr:nth-child(1) td:nth-child(1)"),True)
        time.sleep(20)
        actions = ActionChains(DriverFactory.getWebDriver())
        actions.click(first_row).perform()
        actions.send_keys(Keys.DELETE).perform()
        logging.info(f"Record {first_row} Deleted Successfully")
