from selenium.common.exceptions import NoSuchElementException
from WebUI.BuiltinKeywords import WebUiBuiltInKeywords as WebUI
from Utils.ObjectRepository import ObjectRepository
from Utils.keywordUtil import KeywordUtil
from WebUI.WebUiCommonHelper import WebUiCommonHelper
# Initialize ObjectRepository
findTestObject = ObjectRepository.findTestObject


class CheckColorHourglassDisplayed:
    @staticmethod
    def check(color: str, number_of_items: str) -> None:
        """
        Verifies if the hourglass icon displays the correct number of items for a given color.

        Args:
            color (str): Color of the hourglass icon ('red', 'blue', 'dark', or 'black')
            number_of_items (str): Expected number of items to verify
        """
        try:
            KeywordUtil.logInfo("Checking hourglass display")

            # Determine which object to use based on color
            if color.lower() == "red":
                test_object = findTestObject(
                    "Object Repository/Custom Keywords/Home Tasks/RedTasksIconNumber"
                )
            elif color.lower() == "blue":
                test_object = findTestObject(
                    "Object Repository/Custom Keywords/Home Tasks/BlueTasksIconNumber"
                )
            elif color.lower() in ("dark", "black"):
                test_object = findTestObject(
                    "Object Repository/Custom Keywords/Home Tasks/DarkTasksIconNumber"
                )
            else:
                raise ValueError(f"Invalid color specified: {color}")

            # Find and verify the element
            web_element = WebUiCommonHelper.findWebElement(test_object, 0)
            actual_text = web_element.text

            # Verify the count
            if actual_text == number_of_items:
                KeywordUtil.markPassed(
                    f"{number_of_items} tasks found for {color}"
                )
            else:
                KeywordUtil.markFailed(
                    f"Expected {number_of_items} tasks but found {actual_text} for {color}"
                )

        except NoSuchElementException as e:
            KeywordUtil.markFailed(f"Element not found for {color} hourglass: {str(e)}")
            raise
        except ValueError as e:
            KeywordUtil.markFailed(str(e))
            raise
        except Exception as e:
            KeywordUtil.markFailed(f"Error checking hourglass: {str(e)}")
            raise