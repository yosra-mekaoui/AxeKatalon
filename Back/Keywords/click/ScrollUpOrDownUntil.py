import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.BuiltinKeywords import FailureHandling

from Utils.ObjectRepository import ObjectRepository
findTestObject = ObjectRepository.findTestObject

class ScrollUpOrDownUntil:
    @staticmethod
    def Clicktoscrollright( XpathToBeVisible: str, UpOrDown: str):
        path = "//body"
        driver = DriverFactory.getWebDriver()

        field_web_element_f = driver.find_element(By.XPATH,path)

        builder = ActionChains(driver)

        leftClickOnCanvas = builder.send_keys_to_element(field_web_element_f,Keys.DOWN)


        key_mapping = {
            "Down": Keys.DOWN,
            "Up": Keys.UP,
            "End": Keys.END
        }

        if UpOrDown in key_mapping:
            leftClickOnCanvas.send_keys_to_element(field_web_element_f, key_mapping[UpOrDown]).perform()
        else:
            logging.warning("Invalid scroll direction provided.")
            return

        while True:
            try:
                obj = findTestObject("Object Repository/Wave2/XPath",{'path':XpathToBeVisible})
                Founded = WebUI.verifyElementVisible(obj,FailureHandling.OPTIONAL)
                if not Founded :
                    logging.info("Element is not visible: " + XpathToBeVisible)

            except NoSuchElementException:
                pass

            builder.send_keys_to_element(field_web_element_f, key_mapping[UpOrDown]).perform()
            logging.info("Scrolling...")
