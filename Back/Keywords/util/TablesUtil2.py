import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from WebUI.DriverFactory import DriverFactory
from Keywords.util.Commands import Commands
from Utils.ByType import ByJavaMethod
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
import time

class TablesUtil2:
    @staticmethod
    def getBasicGrid() -> WebElement:
        return Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[contains(@class,'acp-generic-grid')]"))

    @staticmethod
    def findfindFirstVisibleGrid() :
        time.sleep(2)
        return Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[contains(@class,'acp-generic-grid basic-grid')]"))

    @staticmethod
    def findfindFirstVisibleGrid2(column_name: str) -> WebElement:
        logging.info(f"Step alpha: {column_name}")
        time.sleep(2)
        grid_panel = Commands.findFirstVisibleElement(ByJavaMethod.XPATH( f"//*[text()='{column_name}']//ancestor::div[contains(@class,'x-column-header')]//ancestor::div[contains(@class,'acp-generic-grid basic-grid')]"))
        logging.info("Step beta")
        return grid_panel

    @staticmethod
    def findfindFirstVisibleGridWithFilter() -> WebElement:
        return Commands.findFirstVisibleElement(ByJavaMethod.XPATH(".//div[contains(@class,' x-panel basic-grid x-fit-item x-panel-default')]"))

    @staticmethod
    def getMatchingRecord(grid_element: WebElement, columns: list) -> WebElement:
        xpath = ".//table[contains(@class,'x-grid-item')]["
        xpath += " and ".join([f"descendant::text()[contains(.,'{col.value}')]" for col in columns])
        xpath += "]"
        return grid_element.find_element(By.XPATH, xpath)

    @staticmethod
    def getCellsValue(table: WebElement, line_index: int, columns: list) -> list:
        grid_item = table.find_element(By.XPATH, f".//tr[contains(@class,'x-grid-item') and @data-recordindex='{line_index}']")
        if not grid_item:
            grid_container_id = table.get_attribute("id")
            js = f"document.getElementById('{grid_container_id}').querySelector('.x-grid-view').scrollTop = document.getElementById('{grid_container_id}').querySelector('.x-grid-view').scrollHeight;"
            WebUI.executeJavaScript(js)
            grid_item = table.find_element(By.XPATH, f".//tr[contains(@class,'x-grid-item') and @data-recordindex='{line_index}']")
        return TablesUtil2.get_cells_value_of_grid_item(table, grid_item, columns)

    @staticmethod
    def getCellsValueOfGridItem(grid_container: WebElement, grid_item: WebElement, columns: list) -> list:
        values = []
        for col in columns:
            column_cell = grid_container.find_element(By.XPATH, f".//span[text()='{col.name}']")
            column_id = column_cell.get_attribute("id").replace("-textInnerEl", "")
            value_cell = grid_item.find_element(By.CSS_SELECTOR, f"td[data-columnid='{column_id}'] div.x-grid-cell-inner")
            values.append(value_cell.get_attribute("innerHTML"))
        return values