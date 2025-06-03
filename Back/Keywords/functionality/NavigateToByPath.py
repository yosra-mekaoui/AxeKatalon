import logging
from selenium.webdriver.common.by import By

from Utils.Common import Thread
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Keywords.util.Commands import Commands

from Utils.ByType import ByJavaMethod

findTestObject = ObjectRepository.findTestObject


class NavigateToByPath:
    @staticmethod
    def navigateTo(path, click_search):
        path_array = path.split(",")
        logging.info(f"Navigating to: {path_array}")
        WebUI.delay(10)

        driver = DriverFactory.getWebDriver()

        # Open menu
        WebUI.click(findTestObject("Custom Keywords/Menu/MenuButton"))
        WebUI.clearText(findTestObject("Custom Keywords/Menu/FilterField"))
        Thread.sleep(500)
        for i, node in enumerate(path_array):
            if i == 0:
                node_test_object = findTestObject("Custom Keywords/Menu/V9MenuNode", {"MenuNode": node})
                Xpathupdated = node_test_object.selector_collection['XPATH']
                button_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(Xpathupdated), True)
                button_element.click()
            else:
                node_test_object = findTestObject("Custom Keywords/Menu/V9MenuNodei", {"MenuNode": node})
                xpath_modified = node_test_object.selector_collection['XPATH']

                logging.info(f"Extracted XPath: {xpath_modified}")
                button_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(xpath_modified), True)
                button_element.click()

        if click_search:
            WebUI.click(findTestObject("Custom Keywords/Buttons/BasicButton", {"ButtonName": "Search"}))

        logging.info("Navigation completed successfully.")

    @staticmethod
    def extract_xpath(xpath_node):
        try:
            substring_to_find = "xpath: "
            start_index = xpath_node.find(substring_to_find) + len(substring_to_find)
            if start_index > len(substring_to_find):
                return xpath_node[start_index:].strip()
            logging.error("XPath extraction failed. Returning original string.")
            return xpath_node.strip()
        except Exception as e:
            logging.error(f"Error extracting XPath: {e}")
            return ""
