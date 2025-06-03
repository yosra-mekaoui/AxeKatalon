import openpyxl
import datetime
import sys

from Utils.keywordUtil import KeywordUtil


class VerifyElementInExcelFile:
    @staticmethod

    def VerifyElementInExcel(file_name, column_name, rowNumber, value_to_check_with):
        """
        Verify if a specific cell in an Excel file matches a given value.
        """
        # Get current date and format it as "_MM_dd_YYYY"
        formatted_date = datetime.datetime.now().strftime("_%m_%d_%Y")
        full_file_name = f"{file_name}{formatted_date}.xlsx"

        # Load the workbook and the first sheet
        wb = openpyxl.load_workbook(full_file_name, data_only=True)
        sheet = wb.worksheets[0]  # First sheet

        # Find column index based on column name
        colnr = VerifyElementInExcelFile.findColumn(sheet, column_name)

        # Get the cell value at the specified row and column
        cell_value = sheet.cell(row=rowNumber , column=colnr + 1).value  # openpyxl is 1-based index


        if cell_value is None:
            cell_value = ""

        # Convert value to string for comparison
        cell_value_str = str(cell_value).strip()

        print(f"Cell Value: {cell_value_str}")

        if cell_value_str != value_to_check_with:
            print("ERROR: Values do not match!")
            errormsg = "ERROR: Values do not match! expected: {} found: {} on cell: (row,column)=({}, {})".format(value_to_check_with, cell_value_str, rowNumber, colnr+1)

            KeywordUtil.markFailed(errormsg)
        else:
            SUCCESSmsg = "SUCCESS: Values match! cell: (row,column)=({}, {})".format( rowNumber, colnr+1)

            KeywordUtil.markPassed("SUCCESS: Values match!")
            print("SUCCESS: Values match!")



    def findColumn(sheet, column_name):
        """
        Find the column index by matching the column name in the first row.
        """
        r0=sheet[1]
        for col_idx, cell in enumerate(sheet[1]):  # First row (header row)
            cv=cell.value
            if str(cell.value).strip() == column_name:
                return col_idx  # Zero-based index

        print(f"ERROR: Column '{column_name}' not found!")
        KeywordUtil.markFailed(f"ERROR: Column '{column_name}' not found!")

    # Example usage

#VerifyElementInExcelFile.VerifyElementInExcel(r"C:\Users\houss\Downloads\Investigation xtjs", "State", 2, "Passed")
