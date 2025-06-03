import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.remote.webdriver import WebDriver
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.TablesUtil import TablesUtil
from WebUI.DriverFactory import DriverFactory
from Keywords.util.NameValue import NameValue



class ClickOnDeleteIconByColumn2:
    @staticmethod
    def click( column_name: str, column_value: str):
        logging.info(f"Double Click By Column {column_name}:{column_value}")

        basic_grid = TablesUtil2.findfindFirstVisibleGrid2(column_name)
        name_value = NameValue(name=column_name, value=column_value)

        logging.info("Step1")

        matching_record = TablesUtil.getMatchingRecord(basic_grid, [name_value])
        logging.info("Step2")

        logging.info(f"Matching element doubleclickbycolumn {matching_record}")
        actions = ActionChains(DriverFactory.getWebDriver())
        logging.info("Step3")

        logging.info(f"Record {matching_record} Double Clicked Successfully")
        logging.info("Step4")

        element = matching_record.find_element(By.XPATH, ".//div[contains(@class,'fa-trash')]")
        logging.info("Step5")

        actions.click(element).perform()