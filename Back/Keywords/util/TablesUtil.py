import logging
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.remote.webdriver import WebDriver
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from WebUI.DriverFactory import DriverFactory
from Keywords.util.NameValue import NameValue

from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
from Keywords.util.FieldsetUtil import FieldsetUtil


class TablesUtil:
    @staticmethod
    def getBasicGrid() -> WebElement:
        """
        Returns the first visible element of the basic grid.
        """
        return Commands.findFirstVisibleElement(ByJavaMethod.XPATH( ".//div[contains(@class,'acp-generic-grid')]") )

    @staticmethod
    def getTreeGrid() -> WebElement:
        """
        Returns the first visible element of the tree grid.
        """
        return Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[contains(@class,'acp-hierarchy-treepanel')]") )

    @staticmethod
    def findGridByName(table_name: str) -> WebElement:
        """
        Finds a grid by its name.
        """
        fieldset_element = FieldsetUtil.getFieldsetElement(table_name)
        grid_panel = fieldset_element.find_element(By.XPATH, ".//div[contains(@class,'acp-generic-grid basic-grid')]")
        return grid_panel

    @staticmethod
    def getMatchingRecord(grid_element: WebElement, columns: list[NameValue]) -> WebElement:
        """
        Finds a row in the grid matching given column values.
        """
        xpath = ".//table[contains(@class,'x-grid-item')][" + " and ".join(
            [f"descendant::text()[contains(.,'{col.value}')]" for col in columns]
        ) + "]"
        grid_item = grid_element.find_element(By.XPATH, xpath)
        logging.info(f"Line is displayed {xpath}")
        return grid_item

    @staticmethod
    def getMultipleMatchingRecordItems(columns: list[NameValue]) -> list:
        """
        Finds multiple records in a grid that match given column values.
        """
        xpath = ".//table[contains(@class,'x-grid-item')][" + " and ".join(
            [f"descendant::text()[contains(.,'{col.value}')]" for col in columns]
        ) + "]"
        time.sleep(5)
        logging.info(f"Searching with XPath: {xpath}")
        grid_item = DriverFactory.getWebDriver().find_element(By.XPATH, xpath)
        return [grid_item]

    @staticmethod
    def getCellsValue(table: WebElement, line_index: int, columns: list[NameValue]) -> list:
        """
        Retrieves values of specified columns from a given row.
        """
        try:
            grid_item = table.find_element(By.XPATH, f".//tr[@data-recordindex='{line_index}']")
        except:
            grid_container_id = table.get_attribute("id")
            js_script = f"document.querySelector('#{grid_container_id} .x-grid-view').scrollTop = document.querySelector('#{grid_container_id} .x-grid-view').scrollHeight;"
            WebUI.executeJavaScript(js_script, [])
            grid_item = table.find_element(By.XPATH, f".//tr[@data-recordindex='{line_index}']")
        return TablesUtil.getCellsValueOfGridItem(table, grid_item, columns)

    @staticmethod
    def getCellsValueOfGridItem(grid_container: WebElement, grid_item: WebElement, columns: list[NameValue]) -> list:
        """
        Extracts values of the specified columns from the grid item.
        """
        values = []
        for col in columns:
            column_cell = grid_container.find_element(By.XPATH, f".//span[text()='{col.name}']")
            col_id = column_cell.get_attribute("id").replace("-textInnerEl", "")
            value_cell = grid_item.find_element(By.CSS_SELECTOR, f"td[data-columnid='{col_id}'] div.x-grid-cell-inner")
            values.append(value_cell.text)
        return values
