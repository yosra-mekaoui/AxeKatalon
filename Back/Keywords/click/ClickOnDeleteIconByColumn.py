import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Keywords.util.TablesUtil2 import TablesUtil2
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.NameValue import NameValue

class ClickOnDeleteIconByColumn:
    @staticmethod
    def click(column_name: str, column_value: str):
        logging.info(f"Double Click By Column {column_name}: {column_value}")

        # Locate the grid
        basic_grid = TablesUtil2.findfindFirstVisibleGrid()

        name_value = NameValue(name=column_name, value=column_value)

        logging.info("Step 1")

        # Find the matching record
        matching_record = TablesUtil.getMatchingRecord(basic_grid, [name_value])

        logging.info("Step 2")
        logging.info(f"Matching element doubleclickbycolumn {matching_record}")

        actions = ActionChains(DriverFactory.getWebDriver())

        logging.info("Step 3")

        logging.info(f"Record {matching_record} Double Clicked Successfully")

        logging.info("Step 4")

        # Find the delete icon within the matching record
        element = matching_record.find_element(By.XPATH, ".//div[contains(@class,'fa-trash')]")

        logging.info("Step 5")

        # Perform click action
        actions.click(element).perform()
