import logging
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod


class DoubleClickElementByXpath:
    @staticmethod
    def click(xpath: str):
        logging.info(f"Double Click on Element with XPath: {xpath}")
        button_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(xpath), True)
        actions = ActionChains(DriverFactory.getWebDriver())
        actions.double_click(button_element).perform()
        logging.info("Clicked Successfully")


