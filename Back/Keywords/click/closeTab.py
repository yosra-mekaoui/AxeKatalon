import logging
import time

from selenium.webdriver.common.by import By
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import FailureHandling
from Utils.keywordUtil import KeywordUtil

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class CloseTab:
    """
    Class to handle closing browser tabs.
    """


    def close(tab_name: str):
        """
        Closes a specified tab.

        Args:
            tab_name (str): The name of the tab to close.
        """
        KeywordUtil.logInfo("Click Close Tab")
        print("Click Close Tab")
        tab = findTestObject("Custom Keywords/Tabs/CloseButton", {"TabName": tab_name})
        time.sleep(10)
        WebUI.click(tab)

        KeywordUtil.markPassed("Tab Closed")