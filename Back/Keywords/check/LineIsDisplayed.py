from typing import List
from selenium.common.exceptions import NoSuchElementException
from Utils.keywordUtil import KeywordUtil
from Keywords.util.TablesUtil import TablesUtil
from Keywords.util.NameValue import NameValue


class LineIsDisplayed:
    @staticmethod
    def check(column_name: str, column_value: str) -> None:
        """
        Verifies if a line with specified column name and value exists in the basic grid.

        Args:
            column_name (str): Name of the column to check
            column_value (str): Expected value in the column
        """
        try:
            KeywordUtil.logInfo("Checking if line is displayed")

            # Create NameValue pair
            nv = NameValue(name=column_name, value=column_value)
            columns = [nv]

            # Find matching record
            grid_item = TablesUtil.getMatchingRecord(TablesUtil.getBasicGrid(), columns)

            if grid_item:
                KeywordUtil.markPassed(
                    f"Line with column {column_name} and value {column_value} exists"
                )
            else:
                KeywordUtil.markFailed(
                    f"Line with column {column_name} and value {column_value} does not exist"
                )

        except NoSuchElementException:
            KeywordUtil.markFailed(
                f"Line with column {column_name} and value {column_value} does not exist"
            )
        except Exception as e:
            KeywordUtil.markFailed(f"Error checking line: {str(e)}")
            raise

    @staticmethod
    def checkByName(table_name: str, column_name: str, column_value: str) -> None:
        """
        Verifies if a line with specified column name and value exists in a named grid.

        Args:
            table_name (str): Name of the grid/table to check
            column_name (str): Name of the column to check
            column_value (str): Expected value in the column
        """
        try:
            KeywordUtil.logInfo("Checking if line is displayed")

            # Create NameValue pair
            nv = NameValue(name=column_name, value=column_value)
            columns = [nv]

            # Find matching record
            grid_item = TablesUtil.getMatchingRecord(
                TablesUtil.findGridByName(table_name),
                columns
            )

            if grid_item:
                KeywordUtil.markPassed(
                    f"Line with column {column_name} and value {column_value} exists"
                )
            else:
                KeywordUtil.markFailed(
                    f"Line with column {column_name} and value {column_value} does not exist"
                )

        except NoSuchElementException:
            KeywordUtil.markFailed(
                f"Line with column {column_name} and value {column_value} does not exist"
            )
        except Exception as e:
            KeywordUtil.markFailed(f"Error checking line: {str(e)}")
            raise