import logging
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By

import WebUI.WKeywords.verifyElementVisible
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository


findTestObject = ObjectRepository.findTestObject


class DragAndDropElem2Elembytext:

    @staticmethod
    def clickElement(source, destination):
        logging.info("Start drag")

        driver = DriverFactory.getWebDriver()

        source_element =WebUiCommonHelper.findWebElement(source, timeout=30)
        destination_element = WebUiCommonHelper.findWebElement(destination, timeout=30)

        actions = ActionChains(driver)
        actions.move_to_element(source_element)\
               .pause(3)\
               .click_and_hold(source_element)\
               .move_by_offset(1, 0)\
               .move_to_element(destination_element)\
               .move_by_offset(4, 0)\
               .pause(2)\
               .release()\
               .perform()

        i = 0
        try:
            WebUI.verifyElementVisible(findTestObject("Object Repository/Wave2/XPath",{'path': '//div[@id="conditionWindow-bodyWrap" or @id="actionWindow-body"]'}))
        except Exception:
            i += 1
            actions.perform()

        try:
            WebUI.verifyElementVisible(findTestObject("Object Repository/Wave2/XPath",{'path': '//div[@id="conditionWindow-bodyWrap" or @id="actionWindow-body"]'}))

            #WebUI.verifyElementVisible(By.XPATH, '//div[@id="conditionWindow-bodyWrap" or @id="actionWindow-body"]')
        except Exception:
            i += 1
            actions.perform()
            logging.info(f"iteration = {i}")
            raise Exception("Iteration of drag and drop exceeded")

        logging.info(f"iteration = {i}")

        if i == 2:
            raise Exception("Iteration of drag and drop exceeded")
