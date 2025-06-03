import logging
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from Utils.ByType import ByJavaMethod

class VerifyMultiComboValue:
    @staticmethod
    def Check(field_name: str, field_value: str):
        """
        Verifies if a specific value exists in a multi-combo field.

        Args:
            field_name (str): The name of the field (label text).
            field_value (str): The value to verify in the multi-combo field.
        """
        try:
            # Construct the XPath to locate the multi-combo field value
            xpath = (
                f"//span[contains(@class,'x-form-item-label-text') and "
                f"(text() = '{field_name}:' or text() = '{field_name}*:' or "
                f"text() = '{field_name}' or text() = '{field_name}*')]"
                f"/ancestor::div[contains(@class,'x-field acp-multicombo')]"
                f"//li//div[@class = 'x-tagfield-item-text' and text() = '{field_value}']"
            )

            # Find the first visible element using the constructed XPath
            field_web_element = Commands.findFirstVisibleElement(ByJavaMethod.XPATH(xpath), True)

            if field_web_element:
                # Log success if the element is found
                logging.info("Verifying element")
                KeywordUtil.markPassed("Field value is as expected")
                print("Field value is as expected")
            else:
                # Log failure if the element is not found
                logging.error("Element not found")
                KeywordUtil.markFailed("Field value is not as expected")
                print("Field value is not as expected")

        except NoSuchElementException:
            # Handle the case where the element is not found
            logging.error("Element not found")
            print("Element not found")
            KeywordUtil.markFailed("Element not found")
        except Exception as e:
            # Handle any other exceptions
            logging.error(f"Error verifying element: {str(e)}")
            KeywordUtil.markFailed("Field value is not as expected")
            print("Element not found")