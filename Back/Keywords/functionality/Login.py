import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from Utils.Common import FailureHandling
from WebUI.DriverFactory import DriverFactory
from Utils.ObjectRepository import ObjectRepository
findTestObject = ObjectRepository.findTestObject
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI

from WebUI.WKeywords import setText
class Login:
    @staticmethod
    def login(username, password):
        logging.info("Logging in")

        # Check for the AzureAddAccount button and click if present
        if WebUI.verifyElementPresent(findTestObject('Login Linux/AzureAddAccount'), 5,FailureHandling.OPTIONAL):
            WebUI.click(findTestObject('Login Linux/AzureAddAccount'))
        # Set username
        WebUI.setText(findTestObject("Custom Keywords/Login/LoginUsername"), username)
        # Check for next button and click if present
        if WebUI.verifyElementPresent(findTestObject('Login Linux/Button next Linux'), 5,FailureHandling.OPTIONAL):
            WebUI.click(findTestObject('Login Linux/Button next Linux'))
        # Set password
        WebUI.setText(findTestObject("Custom Keywords/Login/LoginPassword"), password)
        # Click the login button
        WebUI.click(findTestObject("Custom Keywords/Login/LoginButton"))
        # If the menu button is not found, click 'Yes' button
        if not WebUI.verifyElementPresent(findTestObject('Custom Keywords/Menu/MenuButton'), 10,FailureHandling.OPTIONAL):
            WebUI.click(findTestObject("//*[text()='Yes' or @value='Yes']"))
        logging.info("Logged in successfully")


    

    
