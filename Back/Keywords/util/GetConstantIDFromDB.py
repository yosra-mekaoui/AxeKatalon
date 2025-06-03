import logging
import pyodbc
from TestCaseExecutor import GlobalVariable


class GetConstantIDFromDB:
    @staticmethod
    def getid(db_name: str, db_server: str) -> int:
        """
        Executes a query to fetch the latest constants_id from the constants table.

        :param db_name: Name of the database
        :param db_server: Database server address
        :return: Retrieved constants_id or 0 if no result
        """
        logging.info(f"Connecting to DB: {db_name} on {db_server}")

        # Load credentials
        user_db = GlobalVariable.USERdb
        password_db = GlobalVariable.MDPdb

        conn_str = f'DRIVER={{SQL Server}};SERVER={db_server};DATABASE={db_name};UID={user_db};PWD={password_db}'
        query = "SELECT TOP 1 constants_id FROM constants ORDER BY 1 DESC"

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