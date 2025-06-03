from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.remote.webelement import WebElement
from Utils.keywordUtil import KeywordUtil
from Utils.Commands import Commands
from Keywords.util.TablesUtil import TablesUtil
from Utils.ByType import ByJavaMethod
from WebUI.DriverFactory import DriverFactory
from Keywords.util.NameValue import NameValue

from selenium.webdriver.support import expected_conditions as EC
from selenium.common import  TimeoutException
from selenium.webdriver.support.wait import WebDriverWait



class ClickIcondeleteLevel:
    """
    A class to perform actions (e.g., Add, Edit, Duplicate, Delete) on a grid item using a three-points menu.
    """

    @staticmethod
    def clickThreePoints(parameters: list, action_name: str, level_name: str, tooltip: str, duplicated_name: str) -> None:
        """
        Perform actions on a grid item using a three-points menu.

        Args:
            parameters (list): A list containing column name and value to locate the grid item.
            action_name (str): The action to perform (e.g., "Add", "Edit", "Duplicate", "Delete").
            level_name (str): The name of the level or item to interact with.
            tooltip (str): Tooltip text (if applicable).
            duplicated_name (str): The name of the duplicated item (if applicable).
        """
        try:
            # Create a NameValue object for the grid item
            columns = []
            nv = NameValue(parameters[0],parameters[1])
            print('aa')
            columns.append(nv)
            #wait until element visible
            try:
                WebDriverWait(DriverFactory.getWebDriver(), 30).until(EC.visibility_of_element_located((By.XPATH, ".//div[contains(@class,'acp-hierarchy-treepanel')]")))
            except TimeoutException:
                print('element yet to be visible ')

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
                icon_three_points = Commands.findFirstVisibleElement(ByJavaMethod.CSS_SELECTOR(f"table[data-recordindex='{record_index}'] .axe-hierarchy-cmd-btn-actions"), True)
                icon_three_points.click()
                KeywordUtil.logInfo("Clicked three points")

                # Perform the specified action
                if "Add" in action_name:
                    ClickIcondeleteLevel.ClickActionsPlus(action_name, level_name, tooltip)
                elif action_name.lower() == "add existing":
                    ClickIcondeleteLevel.ClickExistingPlus(action_name, level_name)
                elif action_name.lower() == "unlink limit":
                    KeywordUtil.logInfo("Unlinking limit")
                    ClickIcondeleteLevel.ClickActionsDelete(action_name, level_name)
                elif action_name.lower() == "duplicate":
                    ClickIcondeleteLevel.ClickActionsDuplicate(action_name, duplicated_name)
                elif action_name.lower() == "edit":
                    ClickIcondeleteLevel.ClickEditAction(action_name, level_name)
                elif action_name.lower() == "edit1":
                    ClickIcondeleteLevel.ClickEditAction1(action_name, level_name)
                elif action_name.lower() == "view":
                    ClickIcondeleteLevel.ClickViewAction(action_name, level_name)
                elif action_name.lower() == "info":
                    ClickIcondeleteLevel.ClickInfoAction(action_name, parameters[1])
            else:
                KeywordUtil.markFailed(f"Grid item with column {parameters[0]} and value {parameters[1]} not found")

        except Exception as e:
            KeywordUtil.markFailed(f"An error occurred: {str(e)}")

    @staticmethod
    def ClickExistingPlus(action_name: str, level_name: str) -> None:
        """
        Handle the "Add Existing" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
        """
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True)
        add_icon.click()

        add_level = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-menu-item-text') and text() = '{level_name}']/ancestor::a"), True)
        add_level.click()

    @staticmethod
    def ClickActionsDuplicate(action_name: str, duplicated_name: str) -> None:
        """
        Handle the "Duplicate" action.

        Args:
            action_name (str): The action name.
            duplicated_name (str): The duplicated item name.
        """
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True )
        add_icon.click()

    @staticmethod
    def ClickActionsPlus(action_name: str, level_name: str, tooltip: str) -> None:
        """
        Handle the "Add" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
            tooltip (str): The tooltip text.
        """
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True)
        add_icon.click()

        add_level = Commands.findFirstVisibleElement( ByJavaMethod.XPATH(f".//span[contains(@class,'x-menu-item-text') and text() = '{level_name}']/ancestor::a"), True )
        add_level.click()

    @staticmethod
    def ClickViewAction(action_name: str, level_name: str) -> None:
        """
        Handle the "View" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
        """
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True)
        add_icon.click()

        add_level = Commands.findFirstVisibleElement( ByJavaMethod.XPATH (f".//span[contains(@class,'x-menu-item-text') and text() = '{level_name}']/ancestor::a"), True)
        add_level.click()

    @staticmethod
    def ClickEditAction(action_name: str, level_name: str) -> None:
        """
        Handle the "Edit" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
        """
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True)
        add_icon.click()

        add_level = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (f".//span[contains(@class,'x-menu-item-text') and text() = '{level_name}']/ancestor::a"), True)
        add_level.click()

        save_button = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (".//a[contains(@class,'x-btn') and @aria-disabled='false']//span[contains(@class,'x-btn-inner') and text() = 'Save']/ancestor::a"), True)
        save_button.click()

    @staticmethod
    def ClickEditAction1(action_name: str, level_name: str) -> None:
        """
        Handle the "Edit1" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
        """
        action_name = "Edit"
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH (f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True)
        add_icon.click()

        add_level = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-menu-item-text') and text() = '{level_name}']/ancestor::a"), True)
        add_level.click()

    @staticmethod
    def ClickInfoAction(action_name: str, level_name: str) -> None:
        """
        Handle the "Info" action.

        Args:
            action_name (str): The action name.
            level_name (str): The level name.
        """
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True )
        add_icon.click()

    @staticmethod
    def ClickActionsDelete(action_name: str, button_name: str) -> None:
        """
        Handle the "Delete" action.

        Args:
            action_name (str): The action name.
            button_name (str): The button name.
        """
        KeywordUtil.logInfo("Deleting...")
        add_icon = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(f".//span[contains(@class,'x-btn-inner') and text() = '{action_name}']/ancestor::a"), True)
        add_icon.click()

        if button_name:
            button = Commands.findFirstVisibleElement(
                ByJavaMethod.XPATH (f".//a[contains(@class,'x-btn') and @aria-disabled='false']//span[contains(@class,'x-btn-inner') and text() = '{button_name}']/ancestor::a"), True)
            button.click()