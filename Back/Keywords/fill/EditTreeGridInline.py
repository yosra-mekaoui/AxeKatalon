from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from Keywords.util.Commands import Commands
from Keywords.util.TablesUtil import TablesUtil
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory
import time

class NameValue:
    def __init__(self, name=None, value=None):
        self.name = name
        self.value = value

class EditTreeGridInline:
    @staticmethod
    def fill_grid(level: str, parameters: list):

        print("Line is displayed")

        # Create a list of NameValue objects
        columns = []
        nv = NameValue(name=parameters[0], value=parameters[1])
        columns.append(nv)

        # Find the matching grid item
        grid_item = TablesUtil.getMatchingRecord(TablesUtil.getTreeGrid(), columns)
        record_index = grid_item.get_attribute("data-recordindex")
        if grid_item:
            print(f"Line with column {parameters[0]} and value {parameters[1]} exists")

        # Perform mouse over action
        actions = ActionChains(DriverFactory.getWebDriver())
        actions.move_to_element(grid_item).perform()
        print("Mouse over")

        # Handle level selection
        if level:

            level_action = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f"//span[contains(@class,'x-menu-item') and text()='{level}']"))
            level_action.click()

        # Click on the body to deselect
        DriverFactory.getWebDriver().find_element(By.CSS_SELECTOR, "body").click()

        # Prepare list of columns for filling
        list_of_columns = []
        if len(parameters) > 2:
            for i in range(2, len(parameters), 2):
                name_value = NameValue(name=parameters[i], value=parameters[i + 1])
                list_of_columns.append(name_value)

        # Fill the newly added row
        EditTreeGridInline.fill_new_added_row(int(record_index), list_of_columns)

    @staticmethod
    def fill_new_added_row(record_index: int, columns: list):
        """
        Fills the newly added row in the grid.

        :param record_index: The index of the record to fill.
        :param columns: A list of NameValue objects representing columns and their values.
        """
        for column in columns:
            # Locate the column div
            column_div = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (f".//span[contains(@class,'x-column-header-text-inner') and text()='{column.name}']/../../../../.."))
            column_div2 = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-column-header-text-inner') and text()='{column.name}']/../../../../.."))
            print(f"columnDiv: {column_div2}")

            # Get the data component ID
            data_component_id = column_div2.get_attribute("id")
            print(f"ID: {data_component_id}")

            # Locate the edit cell
            edit_cell = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}'])"))
            print(f"editCell: {edit_cell}")

            # Check if the cell is selected
            edit_cell_class = edit_cell.get_attribute("class")
            cell_selected = "selected" in edit_cell_class

            if cell_selected:
                edit_cell.click()
            else:
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.double_click(edit_cell).perform()

            time.sleep(2)

            # Locate the input field within the cell
            edit_cell_input = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//table[@data-recordindex='{record_index}']//td[contains(@class,'x-grid-cell') and @data-columnid='{data_component_id}']//input"))
            print("Before clear")

            # Clear the input field using keyboard shortcuts
            actions = ActionChains(DriverFactory.getWebDriver())
            actions.key_down(Keys.CONTROL).send_keys('a').key_up(Keys.CONTROL).perform()

            # Enter the value
            edit_cell_input.send_keys(column.value)
            time.sleep(2)
            print(f"Step: {column.value}")

# Example usage:
# EditTreeGridInline.fill_grid("Level1", ["Column1", "Value1", "Column2", "Value2"])