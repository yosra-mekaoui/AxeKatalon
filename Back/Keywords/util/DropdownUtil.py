import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from WebUI.DriverFactory import DriverFactory
import time
class DropdownUtil:
    @staticmethod
    def setDropdownValue(field_web_element, field_value: str):
        input_element = field_web_element.find_element(By.CSS_SELECTOR, "input.x-form-field.x-form-text")

        trigger_id = input_element.get_attribute("id").replace("inputEl", "trigger-picker")
        trigger_element = DriverFactory.getWebDriver().find_element(By.ID, trigger_id)
        trigger_element.click()

        triggerbar_id = input_element.get_attribute("id").replace("inputEl", "trigger-bar")
        logging.info(f"1 triggerbarId :: {triggerbar_id}")

        trigger_bar_element = DriverFactory.getWebDriver().find_element(By.ID, triggerbar_id)

        input_element.clear()
        input_element.send_keys(Keys.CONTROL + "a")  # Select all
        input_element.send_keys(field_value)
        input_element.send_keys(Keys.TAB)

        time.sleep(0.5)  # Sleep for 500ms

        body = DriverFactory.getWebDriver().find_element(By.CSS_SELECTOR, "body")
        body.click()
