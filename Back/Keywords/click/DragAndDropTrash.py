from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
import logging
from Keywords.util import GroupStructureUtil

class DragAndDropTrash:

    @staticmethod
    def execute(driver, node1_name, node2_name):
        logging.info(f"Executing drag and drop: {node1_name} -> {node2_name}")

        node1 = GroupStructureUtil.getNodeToDrag(node1_name)
        node2 = GroupStructureUtil.getNodeToDrag(node2_name)

        logging.info(f"node1: {node1}")
        logging.info(f"node2: {node2}")

        logging.info("****   BEFORE PATH  *****")
        path = GroupStructureUtil.checkPathBetweenNodes(node1, node2)
        logging.info("****   AFTER PATH  *****")

        logging.info(f"dAttrc: {path.get_attribute('d')}")
        logging.info(f"path1: {GroupStructureUtil.checkPathBetweenNodes(node1, node2)}")

        trash = driver.find_element(By.ID, "trash")
        logging.info(f"path2: {path}")
        logging.info(f"trash: {trash}")

        ActionChains(driver).drag_and_drop(path, trash).perform()
