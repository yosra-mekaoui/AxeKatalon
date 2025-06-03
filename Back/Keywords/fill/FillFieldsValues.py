import time
from threading import Thread

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from WebUI.DriverFactory import DriverFactory
from selenium.common.exceptions import WebDriverException
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
findTestObject = ObjectRepository.findTestObject


class FillFieldsValues:
    @staticmethod
    def set(field_name: str, field_value: str):

        print(f"Fill Field {field_name} with: {field_value}")

        # Construct XPath for locating the field
        xpath = (
            f".//div[contains(@class,'axe-basic-field')]//span[contains(@class,'x-form-item-label-text') "
            f"and (text() = '{field_name}:' or text() = '{field_name}*:' or "
            f"text() = '{field_name}' or text() = '{field_name}*')]"
            f"/ancestor::div[contains(@class,'axe-basic-field')]"
        )
        test_object=findTestObject("GUI/Xpath",{'xpath':f'{xpath}'})
        WebUI.waitForElementPresent(test_object,30)
        WebUiCommonHelper.checkTestObjectParameter(test_object)


        # Switch to frame if necessary
        is_switch_into_frame = WebUiCommonHelper.switchToParentFrame(test_object, 10)
        #elements = WebUiCommonHelper.findWebElements(test_object,10)
        fieldWebElement = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[contains(@class,'axe-basic-field')]//span[contains(@class,'x-form-item-label-text') and  ( text() = '" + field_name + ":' or text() = '" + field_name + "*:'   or text() = '" + field_name + "'   or text() = '" + field_name + "*' ) ]/ancestor::div[contains(@class,'axe-basic-field')]"),True)

        # Find first visible element
        '''''
        field_web_element = next((e for e in fieldWebElement if e.is_displayed()), None)
        if not field_web_element:
            raise WebDriverException(f"Visible element not found for field: {field_name}")
        '''''
        element_id = fieldWebElement.get_attribute("id")
        print(f"Element ID: {element_id}")


        try:
            if "fieldcontainer" in element_id:
                inner_field = fieldWebElement.find_element(By.CSS_SELECTOR, ".axe-basic-field")
                FillFieldsValues._set_text_value(inner_field, field_value)
                time.sleep(8)  # Consider replacing with explicit wait
            elif "combo" in element_id:
                FillFieldsValues._set_dropdown_value(fieldWebElement, field_value)
            elif "textarea" in element_id:
                FillFieldsValues._set_textarea_value(fieldWebElement, field_value)
            else:
                FillFieldsValues._set_text_value(fieldWebElement, field_value)

            print(f"Successfully filled field {field_name}")
        except Exception as e:
            raise WebDriverException(f"Error filling field {field_name}: {str(e)}")

    @staticmethod
    def _set_text_value(element, value):
        input_field = element.find_element(By.CSS_SELECTOR, "input.x-form-field.x-form-text")
        input_field.clear()
        input_field.send_keys(value)
        input_field.send_keys(Keys.TAB)

    @staticmethod
    def _set_textarea_value(element, value):
        textarea = element.find_element(By.CSS_SELECTOR, "textarea.x-form-field.x-form-text")
        textarea.clear()
        textarea.send_keys(value)
        textarea.send_keys(Keys.TAB)

    @staticmethod
    def _set_dropdown_value(element, value):
        driver = DriverFactory.getWebDriver()
        input_field = element.find_element(By.CSS_SELECTOR, "input.x-form-field.x-form-text")
        input_id = input_field.get_attribute("id")

        # Find dropdown trigger elements
        trigger_id = input_id.replace("inputEl", "trigger-picker")
        trigger_bar_id = input_id.replace("inputEl", "trigger-bar")

        # Open dropdown (if needed)
        ActionChains(driver).click(input_field).perform()
        time.sleep(0.5)

        # Clear existing value using keyboard shortcut
        ActionChains(driver) \
            .key_down(Keys.CONTROL) \
            .send_keys('a') \
            .key_up(Keys.CONTROL) \
            .send_keys(Keys.BACKSPACE) \
            .perform()

        input_field.send_keys(value)
        input_field.send_keys(Keys.TAB)
        time.sleep(1)