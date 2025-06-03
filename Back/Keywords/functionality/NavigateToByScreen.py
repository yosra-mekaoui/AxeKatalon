import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository

findTestObject = ObjectRepository.findTestObject
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod


class NavigateToByScreen:
    @staticmethod
    def navigate(screen_name):
        logging.info(f"Navigating to screen: {screen_name}")
        WebUI.delay(5)
        driver = DriverFactory.getWebDriver()

        # Click on the menu button
        menu_btn = findTestObject("Custom Keywords/Menu/MenuButton")
        WebUI.click(menu_btn)

        # Clear and enter the screen name in the filter field
        filter_field = findTestObject("Custom Keywords/Menu/FilterField")
        WebUI.clearText(filter_field)
        WebUI.sendKeys(filter_field, screen_name)

        # Click on the screen node from the menu
        node_test_object = findTestObject("Custom Keywords/Menu/ScreenMenuNode",
                                          {"NodeText": screen_name})
        WebUI.click(node_test_object)

        logging.info("Navigation performed successfully")
