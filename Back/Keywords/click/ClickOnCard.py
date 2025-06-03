from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.common.exceptions import NoSuchElementException
import logging
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory


class ClickOnCard:
    @staticmethod
    def click_on_card(card_name: str, version: str):
        try:
            # Find the card element

            driver = DriverFactory.getWebDriver()
            clickcard = driver.find_element(By.XPATH, f".//*[text()='{card_name}']")

            if version == 'V9':
                clickcard = driver.find_element(By.XPATH,f".//div[text()='{card_name}']//ancestor::div[contains(@class,'vertical-Card')]"f"//child::div[contains(@class,'edit-relateditem')]")
            else:
                clickcard = driver.find_element(By.XPATH,f".//div[contains(@class,'x-title-item')]//span[text()='{card_name}']"
                                                f"//ancestor::div[contains(@class,'relateditem-vertical-Card')]"
                                                f"//div[contains(@class,'edit-relateditem')]")

            clickcard.click()
            logging.info(f"Successfully clicked on card: {card_name}")

        except NoSuchElementException:
            logging.error(f"Card with name '{card_name}' not found.")
