import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pathlib import Path
import xml.etree.ElementTree as ET

from Utils.Common import FailureHandling
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository
findTestObject = ObjectRepository.findTestObject
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
from TestCaseExecutor import GlobalVariable

class Logout:
    @staticmethod
    def logout():
        clickYesB = None
        logging.info("Logging out")

        WebUI.click(findTestObject("Custom Keywords/MainToolbar/MaintoolbarButton"))
        logging.info("Click 1")

        WebUI.click(findTestObject("Custom Keywords/MainToolbar/SignoutButton"))
        logging.info("Click 2")
        clickYesB = Commands.findFirstVisibleElement(ByJavaMethod.XPATH("//div[contains(@class,'x-message-box')]//span[contains(@class,'x-btn-inner') and text() = 'Yes']"))

        clickYesB.click()

        if GlobalVariable.Profil == 'linux':
            WebUI.click(findTestObject('Logout_Linux'))


