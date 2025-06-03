from typing import Optional, List
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from Keywords.util.Commands import Commands
from Utils.keywordUtil import KeywordUtil
from TestCaseExecutor import GlobalVariable
from Keywords.util.WizardSummaryMessage import WizardSummaryMessage
from Keywords.util.NameValue import NameValue
from Utils.ByType import ByJavaMethod


class MsgIsDisplayed:
    @staticmethod
    def check(msg_type: str, msg_text: str, output_id_name: Optional[str] = None) -> None:
        """
        Checks if a success message is displayed and captures relevant information.

        Args:
            msg_type (str): Type of message ('success')
            msg_text (str): Expected message text
            output_id_name (Optional[str]): Name for storing the main value in GlobalVariable
        """
        try:
            KeywordUtil.logInfo(f"MsgIsDisplayed {msg_type} {msg_text}")

            if msg_type.lower() == "success":
                wizard_message = MsgIsDisplayed.isWizardSummaryMessageDisplayed()

                if wizard_message:
                    if output_id_name:
                        GlobalVariable.ExecutionVariables[output_id_name] = wizard_message.main_value
                        GlobalVariable.itemID = wizard_message.main_value.replace("CA.", "")

                    KeywordUtil.logInfo(f"outputIDName {output_id_name}")
                    KeywordUtil.logInfo(f"output val {GlobalVariable.itemID}")

                    message = f"Message Displayed {wizard_message.text} {GlobalVariable.itemID}"
                    KeywordUtil.markPassed(message)

        except Exception as e:
            error_msg = f"Failed to check message: {str(e)}"
            KeywordUtil.markFailed(error_msg)
            raise

    @staticmethod
    def checkAlertMsg(msg_text: str) -> None:
        """
        Placeholder for alert message checking functionality.

        Args:
            msg_text (str): The alert message text to check
        """
        # Implementation to be added
        pass

    @staticmethod
    def isWizardSummaryMessageDisplayed() -> Optional[WizardSummaryMessage]:
        """
        Checks if a wizard summary message is displayed and extracts its details.

        Returns:
            Optional[WizardSummaryMessage]: The message details if found, None otherwise
        """
        try:
            wizard_summary_panel = Commands.findFirstVisibleElement(
                ByJavaMethod.CSS_SELECTOR (".wizard-summary-panel")
            )

            if wizard_summary_panel:
                message = WizardSummaryMessage()

                # Extract main message text
                message.text = wizard_summary_panel.find_element(
                    By.CSS_SELECTOR, ".summary-wizard-title"
                ).text

                # Try to extract main value
                try:
                    message.main_value = wizard_summary_panel.find_element(
                        By.CSS_SELECTOR, ".summary-wizard-main-value"
                    ).text
                except NoSuchElementException:
                    pass

                # Extract details
                detail_keys = wizard_summary_panel.find_elements(
                    By.CSS_SELECTOR, ".summary-wizard-display"
                )
                detail_values = wizard_summary_panel.find_elements(
                    By.CSS_SELECTOR, ".summary-wizard-value"
                )

                for index, detail_key in enumerate(detail_keys):
                    nv = NameValue()
                    nv.name = detail_key.text
                    nv.value = detail_values[index].text
                    message.details.append(nv)

                return message

            return None

        except NoSuchElementException:
            return None
        except Exception as e:
            KeywordUtil.logInfo(f"Error checking wizard summary: {str(e)}")
            return None