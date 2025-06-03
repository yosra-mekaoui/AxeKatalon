import logging
from Utils.keywordUtil import KeywordUtil

class SetTCPrioritieX:
    @staticmethod
    def SetTCPrioritie(parameters: list):
        """
        Logs the priority of a test case by joining the list of parameters into a string.

        Args:
            parameters (list): A list of strings representing the test case priority.
        """
        try:
            # Join the list of parameters into a comma-separated string
            concat = ",".join(parameters)
            length = str(len(parameters))

            # Log the priority information
            logging.info(f"TC priority is :({length})[{concat}]")
            KeywordUtil.markPassed(f"TC priority is :[{concat}]")

        except Exception as e:
            # Handle any exceptions
            logging.error(f"Error setting TC priority: {str(e)}")
            KeywordUtil.markFailed(f"Error setting TC priority: {str(e)}")

    @staticmethod
    def SetTCEpic(parameters: list):
        """
        Logs the feature (epic) of a test case by joining the list of parameters into a string.

        Args:
            parameters (list): A list of strings representing the test case feature.
        """
        try:
            # Join the list of parameters into a comma-separated string
            concat = ",".join(parameters)
            length = str(len(parameters))

            # Log the feature information
            logging.info(f"TC feature is :({length})[{concat}]")
            KeywordUtil.markPassed(f"TC feature is :[{concat}]")

        except Exception as e:
            # Handle any exceptions
            logging.error(f"Error setting TC feature: {str(e)}")
            KeywordUtil.markFailed(f"Error setting TC feature: {str(e)}")