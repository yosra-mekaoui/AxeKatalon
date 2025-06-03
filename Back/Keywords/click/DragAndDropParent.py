from selenium.webdriver.common.action_chains import ActionChains
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
import logging

class DragAndDropParent:

    @staticmethod
    def execute(name1, name2):
        logging.info(f"Executing drag and drop: {name1} -> {name2}")

        node1 = WebUiCommonHelper.findWebElement(f"Object Repository/Custom Keywords/GroupStructure/Node", {"name": name1})
        node2 = WebUiCommonHelper.findWebElement(f"Object Repository/Custom Keywords/GroupStructure/Node", {"name": name2})

        WebUI.dragAndDropToObject(node1, node2)
