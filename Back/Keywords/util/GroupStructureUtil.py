from selenium.webdriver.common.by import By
import logging
from Utils.ObjectRepository import ObjectRepository
from WebUI.WebUiCommonHelper import WebUiCommonHelper
from Keywords.util.StructureNode import StructureNode

findTestObject = ObjectRepository.findTestObject


class GroupStructureUtil:

    @staticmethod
    def getNodeToDrag(name):
        node = findTestObject("Object Repository/Custom Keywords/GroupStructure/Node", {"name": name})
        node_element = WebUiCommonHelper.findWebElement(node, 10)
        logging.info(f"nodeElement: {node_element.text}")

        structure_node = StructureNode()
        structure_node.name = name
        transform = node_element.get_attribute("transform").replace("translate(", "").replace(")", "").split(",")

        structure_node.transformX = transform[0]
        structure_node.transformY = transform[1]
        return structure_node

    @staticmethod
    def getFIRSTNodeToDrag(name):
        node = findTestObject("Object Repository/Custom Keywords/GroupStructure/NodeFirst")
        node_element = WebUiCommonHelper.findWebElement(node, 10)

        structure_node = StructureNode()
        structure_node.name = name
        transform = node_element.get_attribute("transform").replace("translate(", "").replace(")", "").split(",")

        structure_node.transformX = transform[0]
        structure_node.transformY = transform[1]
        return structure_node

    @staticmethod
    def checkPathBetweenNodes(node1, node2):
        svgPathLink = findTestObject("Object Repository/Custom Keywords/GroupStructure/PathLink")
        paths = WebUiCommonHelper.findWebElements(svgPathLink, 10)
        node1_position = GroupStructureUtil.getNodePosition(node1)
        node2_position = GroupStructureUtil.getNodePosition(node2)

        logging.info(f"node1Position: {node1_position[:2]}")
        logging.info(f"node2Position: {node2_position[:2]}")

        for path in paths:
            d_attr = path.get_attribute("d")
            logging.info(f"dAttr: {d_attr}")

            if d_attr and (node1_position[:2] in d_attr and node2_position[:2] in d_attr):
                logging.info(f"Matched Path: {d_attr}")
                return path

        return None

    @staticmethod
    def checkPathBetweenNodesOR(node1, node2):
        svgPathLink = findTestObject("Object Repository/Custom Keywords/GroupStructure/PathLink")

        paths = WebUiCommonHelper.findWebElements(svgPathLink, 0)
        node1_position = GroupStructureUtil.getNodePosition(node1)
        node2_position = GroupStructureUtil.getNodePosition(node2)

        logging.info(f"node1Position: {node1_position[:2]}")
        logging.info(f"node2Position: {node2_position[:2]}")

        for path in paths:
            d_attr = path.get_attribute("d")
            logging.info(f"dAttr: {d_attr}")

            if d_attr and (node1_position[:2] in d_attr or node2_position[:2] in d_attr):
                logging.info(f"Matched Path: {d_attr}")
                return path

        return None

    @staticmethod
    def getNodePosition(node):
        transform_y = node.StructureNode.transform_y
        comma_index = transform_y.find(",")
        if len(transform_y) > 8 and comma_index > 0:
            transform_y = transform_y[comma_index, comma_index+4]
        return f"{node.transformX},{transform_y}"
