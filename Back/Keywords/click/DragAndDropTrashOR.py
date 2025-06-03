import time
import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.GroupStructureUtil import GroupStructureUtil

class DragAndDropTrashOR:
    @staticmethod
    def execute(driver: WebDriver, node1_name: str, node2_name: str):
        try:
            # Get the elements to be dragged
            node1 = GroupStructureUtil.getNodeToDrag(node1_name)
            node2 = GroupStructureUtil.getFIRSTNodeToDrag(node2_name)

            logging.info(f"Node1: {node1}")
            logging.info("****   BEFORE PATH  *****")

            # Check the path between nodes
            path = GroupStructureUtil.checkPathBetweenNodes(node1, node2)
            logging.info("****   AFTER PATH  *****")

            if path is None:
                logging.error("Path between nodes not found!")
                return

            logging.info(f"dAttrc: {path.get_attribute('d')}")
            logging.info(f"path1: {GroupStructureUtil.checkPathBetweenNodesOR(node1, node2)}")

            # Find the trash element
            trash = driver.find_element(By.ID, "trash")
            logging.info(f"path2: {path}")
            logging.info(f"trash: {trash}")

            time.sleep(2)  # Simulating the delay from the original script

            # Perform drag and drop action
            actions = ActionChains(driver)
            actions.drag_and_drop(path, trash).perform()

            logging.info("Drag and drop successful.")

        except NoSuchElementException as e:
            logging.error(f"Element not found: {e}")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
