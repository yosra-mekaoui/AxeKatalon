import logging
import pyodbc
from TestCaseExecutor import GlobalVariable

class ExecuteQuery034Strin:
    @staticmethod
    def exec(query: str, column: str, db_name: str, db_server: str) -> str:
        """
        Executes an SQL query and retrieves an integer value from a specified column.

        :param query: SQL query to execute
        :param column: Column name to extract the result from
        :param db_name: Database name
        :param db_server: Database server address
        :return: Retrieved integer value or 0 if no result
        """

        logging.info(f"Connecting to DB: {db_name} on {db_server}")

        # Load credentials

        user_db = GlobalVariable.USERdb
        password_db = GlobalVariable.MDPdb

        conn_str = f'DRIVER={{SQL Server}};SERVER={db_server};DATABASE={db_name};UID={user_db};PWD={password_db}'
        print(conn_str)
        print(query)
        try:
            with pyodbc.connect(conn_str) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(query)
                    row = cursor.fetchone()

                    if row:
                        result_value = row[0]  # Assuming the first column is the target
                        logging.info(f"Query result: {result_value}")
                        return result_value
                    else:
                        logging.warning("No results found.")
                        return 0
        except Exception as e:
            logging.error(f"Database query failed: {e}")
            return 0