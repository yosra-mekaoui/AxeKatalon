from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.remote.webelement import WebElement
from Utils.keywordUtil import KeywordUtil
from Utils.Commands import Commands
from WebUI.DriverFactory import DriverFactory
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.NameValue import NameValue
from Utils.ByType import ByJavaMethod
from selenium.webdriver import Remote as WebDriver


class ClickIconAddPlus:
    """
    A class to interact with a grid item by clicking a three-points menu and performing an "Add" action.
    """

    @staticmethod
    def clickThreePoints(parameters: list, action_name: str, level_name: str) -> None:
        """
        Perform actions on a grid item using a three-points menu.

        Args:
            parameters (list): A list containing column name and value to locate the grid item.
            action_name (str): The action to perform (e.g., "Add").
            level_name (str): The name of the level or item to interact with.
        """
        try:
            # Create a NameValue object for the grid item
            columns = []
            nv = NameValue()
            nv.name = parameters[0]
            nv.value = parameters[1]
            columns.append(nv)

            # Locate the grid item
            grid_item: WebElement = TablesUtil.getMatchingRecord(TablesUtil.getTreeGrid(), columns)
            if grid_item:
                record_index = grid_item.get_attribute("data-recordindex")
                KeywordUtil.markPassed(f"Line with column {parameters[0]} and value {parameters[1]} exists")

                # Perform mouse-over action
                actions = ActionChains(DriverFactory.getWebDriver())
                actions.move_to_element(grid_item).perform()
                KeywordUtil.logInfo("Mouse over")

                # Click the three-points icon
                icon_three_points = Commands.findFirstVisibleElement(
                    ByJavaMethod.CSS_SELECTOR(f"table[data-recordindex='{record_index}'] .axe-hierarchy-cmd-btn-actions"), True
                )
                icon_three_points.click()
                KeywordUtil.logInfo("Clicked three points")

                # Perform the "Add" action
                if action_name.lower() == "add":
                    ClickIconAddPlus.clickActionsPlus(action_name, level_name)
            else:
                KeywordUtil.markFailed(f"Grid item with column {parameters[0]} and value {parameters[1]} not found")

        except Exception as e:
            KeywordUtil.markFailed(f"An error occurred: {str(e)}")

    @staticmethod
    def clickActionsPlus(action_name: str, level_name: str) -> None:
        """
        Handle the "Add" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
        """
        try:
            # Locate and click the "Add" icon
            add_icon = Commands.findFirstVisibleElement(
                ByJavaMethod.XPATH (f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True
            )
            add_icon.click()

            # Locate and click the level item
            add_level = Commands.findFirstVisibleElement(
                ByJavaMethod.XPATH (f".//span[contains(@class,'x-menu-item-text') and text() = '{level_name}']/ancestor::a"), True
            )
            add_level.click()

            KeywordUtil.markPassed(f"Successfully performed '{action_name}' action for level '{level_name}'")

        except Exception as e:
            KeywordUtil.markFailed(f"Failed to perform '{action_name}' action: {str(e)}")