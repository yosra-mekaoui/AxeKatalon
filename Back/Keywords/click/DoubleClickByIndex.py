import logging
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.action_chains import ActionChains

from Utils.Common import Thread
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Utils.GlobalContext import GlobalContext
from Utils.ByType import ByJavaMethod


class DoubleClickByIndex:
    @staticmethod
    def click(index: int):
        logging.info(f"Double Click By Index {index}")
        Thread.sleep(3000)
        first_row = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(f".basic-grid .x-grid-view .x-grid-item[data-recordindex='{index}'] tr:nth-child(1) td:nth-child(1)"), True)
        time.sleep(2)
        actions = ActionChains(DriverFactory.getWebDriver())
        actions.double_click(first_row).perform()
        Thread.sleep(2000)
        logging.info(f"Record {first_row} Double Clicked Successfully")
