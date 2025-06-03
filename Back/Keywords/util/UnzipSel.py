import zipfile
import logging
from pathlib import Path


class UnzipSel:
    @staticmethod
    def unzip(zip_file_path: str, dest_dir: str):
        """
        Extracts a ZIP file to the specified destination directory.

        :param zip_file_path: Path to the ZIP file
        :param dest_dir: Directory where files should be extracted
        """
        try:
            zip_path = Path(zip_file_path)
            dest_path = Path(dest_dir)

            logging.info(f"Unzipping file: {zip_path} to {dest_path}")

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(dest_path)

            logging.info("Unzipping completed successfully.")
        except Exception as e:
            logging.error(f"Failed to unzip file: {e}")