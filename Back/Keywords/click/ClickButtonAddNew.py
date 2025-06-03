import logging
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from Utils.Common import Thread
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from WebUI.BuiltinKeywords import FailureHandling
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from Utils.ByType import ByJavaMethod
from TestCaseExecutor import GlobalVariable
from Utils.GlobalContext import GlobalContext
from Utils.ByType import ByJavaMethod

# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class ClickButtonAddNew:


    def click(button_name: str):
        """
        Clicks the 'Add New' button based on the application version.

        Args:
            button_name (str): The name of the button to click.
        """
        if GlobalVariable.version == "V7":
            button_object = findTestObject("Object Repository/Custom Keywords/Buttons/AddNewButton")
            time.sleep(2)  # Equivalent to Thread.sleep(2000) in Groovy
            WebUI.click(button_object)
            KeywordUtil.markPassed("Add New Button Clicked Successfully")

        elif GlobalVariable.version == "V9":
            time.sleep(3)  # Equivalent to Thread.sleep(2000) in Groovy

            button_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//a[contains(@class,'btnadd')] | .//a[contains(@class,'add-related-icon')] | .//span[contains(@class,'icon-add')]"),True)
            button_web_element.click()
            Thread.sleep(500)
