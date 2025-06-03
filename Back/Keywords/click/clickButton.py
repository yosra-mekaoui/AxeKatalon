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


class ClickButton:

    def click(button_name: str):
        """
        Clicks a button based on its name.

        Args:
            button_name (str): The name of the button to click.
        """

        # button_object = findTestObject("Object Repository/Custom Keywords/Buttons/BasicButton",{"ButtonName": button_name})
        button_web_element = None



        if GlobalVariable.version != 'V9':
            button_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(
                ".//a[contains(@class,'x-btn') and @aria-disabled='false']//span[contains(@class,'x-btn-inner') and text() = '" + button_name + "']/ancestor::a"),
                                                                      True)
        elif GlobalVariable.version == 'V9':
            button_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(
                "  .//a[@role='button' and contains(@id,'" + button_name + "')] | .//a[@role='button' and @aria-disabled='false' and contains(@id,'" + button_name + "')] |.//a[contains(@class,'x-btn') and @aria-disabled='false']//span[contains(@class,'x-btn-inner') and text() = '" + button_name + "']/ancestor::a | .//a[@class='x-btn acp-basic-btn btnIcon x-unselectable x-box-item x-toolbar-item x-btn-default-toolbar-small' and @data-qtip='" + button_name + "']  "),True)

        if button_name.lower() in ["yes", "save"]:
            ClickButton.check_for_action_performed_successfully()
            Thread.sleep(1500)
        # if button_name.lower() in ["refresh","calculate","next"]:
        #     Thread.sleep(2000)

        time.sleep(0.5)  # Equivalent to Thread.sleep(500) in Groovy
        button_web_element.click()
        if button_name.lower() in ["refresh","calculate","next"]:
            Thread.sleep(3000)

        KeywordUtil.markPassed(f"The click on {button_name} button is done successfully")

    @staticmethod
    def check_for_action_performed_successfully():
        """
        Checks if the action performed successfully message is displayed.
        """

        def check_action():
            action_performed_successfully = findTestObject(
                "Custom Keywords/Messages/ActionPerformedSuccessfullyMessage")
            if action_performed_successfully:
                KeywordUtil.logInfo("The message is displayed")

        from threading import Thread
        check_thread = Thread(target=check_action)
        check_thread.start()

