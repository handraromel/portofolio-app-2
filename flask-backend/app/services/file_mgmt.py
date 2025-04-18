import os
import uuid
import pandas as pd
import logging
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import current_app

logger = logging.getLogger('app.services.file_mgmt')

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}


class FileMgmtService:
    @staticmethod
    def allowed_file(filename):
        """Check if file has an allowed extension"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def get_download_dir():
        """Get the appropriate download directory based on OS"""
        # Get user's home directory
        home_dir = str(Path.home())

        # For Windows, use Documents folder
        if os.name == 'nt':  # Windows
            downloads_dir = os.path.join(home_dir, 'Documents', 'DSC_Exports')
        # For macOS
        elif os.name == 'posix' and os.path.exists(os.path.join(home_dir, 'Documents')):
            downloads_dir = os.path.join(home_dir, 'Documents', 'DSC_Exports')
        # For Linux and other Unix-like systems
        else:
            downloads_dir = os.path.join(home_dir, 'DSC_Exports')

        # Create directory if it doesn't exist
        os.makedirs(downloads_dir, exist_ok=True)

        return downloads_dir

    @staticmethod
    def save_file(file, directory='uploads'):
        """Save uploaded file to specified directory with unique name"""
        try:
            # Create directory if it doesn't exist
            upload_dir = os.path.join(current_app.root_path, directory)
            os.makedirs(upload_dir, exist_ok=True)

            # Secure the filename and add timestamp to make it unique
            original_filename = secure_filename(file.filename)
            _, extension = os.path.splitext(original_filename)
            unique_filename = f"{str(uuid.uuid4())}{extension}"
            file_path = os.path.join(upload_dir, unique_filename)

            # Save the file
            file.save(file_path)

            logger.info(f"File saved: {unique_filename}")
            return file_path, unique_filename
        except Exception as e:
            logger.exception(f"Error saving file: {str(e)}")
            raise e

    @staticmethod
    def read_file(file_path):
        """Read file content into pandas DataFrame"""
        try:
            if file_path.endswith('.csv'):
                # Try different encodings for CSV
                try:
                    return pd.read_csv(file_path)
                except UnicodeDecodeError:
                    return pd.read_csv(file_path, encoding='latin1')
            else:
                # For Excel files
                return pd.read_excel(file_path)
        except Exception as e:
            logger.exception(f"Error reading file {file_path}: {str(e)}")
            raise e

    @staticmethod
    def delete_file(file_path):
        """Delete a file from the filesystem"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.exception(f"Error deleting file {file_path}: {str(e)}")
            return False

    @staticmethod
    def export_to_excel(data, filename=None, directory=None):
        """Export data to Excel file in user's download directory"""
        try:
            # Use user's download directory if not specified
            if directory is None:
                directory = FileMgmtService.get_download_dir()
            else:
                # If directory is specified but not a user directory path,
                # create it within the app directory
                if not os.path.isabs(directory):
                    directory = os.path.join(current_app.root_path, directory)

            os.makedirs(directory, exist_ok=True)

            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"export_{timestamp}.xlsx"

            file_path = os.path.join(directory, filename)

            # Convert data to DataFrame if it's not already
            if not isinstance(data, pd.DataFrame):
                df = pd.DataFrame(data)
            else:
                df = data

            # Save to Excel
            df.to_excel(file_path, index=False)

            logger.info(f"Data exported to Excel: {file_path}")
            return file_path
        except Exception as e:
            logger.exception(f"Error exporting to Excel: {str(e)}")
            raise e

    @staticmethod
    def export_to_csv(data, filename=None, directory=None):
        """Export data to CSV file in user's download directory"""
        try:
            # Use user's download directory if not specified
            if directory is None:
                directory = FileMgmtService.get_download_dir()
            else:
                # If directory is specified but not a user directory path,
                # create it within the app directory
                if not os.path.isabs(directory):
                    directory = os.path.join(current_app.root_path, directory)

            os.makedirs(directory, exist_ok=True)

            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"export_{timestamp}.csv"

            file_path = os.path.join(directory, filename)

            # Convert data to DataFrame if it's not already
            if not isinstance(data, pd.DataFrame):
                df = pd.DataFrame(data)
            else:
                df = data

            # Save to CSV
            df.to_csv(file_path, index=False)

            logger.info(f"Data exported to CSV: {file_path}")
            return file_path
        except Exception as e:
            logger.exception(f"Error exporting to CSV: {str(e)}")
            raise e

    @staticmethod
    def create_sample_sales_file(directory='samples'):
        """Create a sample sales import file"""
        try:
            # Create directory if it doesn't exist
            sample_dir = os.path.join(current_app.root_path, directory)
            os.makedirs(sample_dir, exist_ok=True)

            # Define the filename
            filename = 'sales_import_sample.xlsx'
            file_path = os.path.join(sample_dir, filename)

            # Create sample data with EXACT column names expected by the importer
            sample_data = [
                {
                    'sale_qty': 5,
                    'sale_amt': 1250000.00,
                    'discounted_amt': 125000.00,
                    'input_date': '2025-04-20',
                    'sku': 'ABC123',
                    'item_no': 'ITEM001',
                    'brand': '123-BRANDNAME',
                    'group': '123-GROUPNAME',
                    'division': 'DIVISI 2-FOOTWEAR',
                    'category': 'NGESNELi',
                    'description': 'Sample product description'
                }
            ]

            # Create DataFrame
            df = pd.DataFrame(sample_data)

            # Add column notes with the exact column names
            notes = pd.DataFrame([{
                'sale_qty': 'Required: Number',
                'sale_amt': 'Required: Number',
                'discounted_amt': 'Optional: Number, defaults to 0',
                'input_date': 'Required: YYYY-MM-DD format',
                'sku': 'Optional: Product SKU',
                'item_no': 'Optional: Product item number',
                'brand': 'Required: Format must be ID-NAME (e.g., 123-BRANDNAME)',
                'group': 'Required: Format must be ID-NAME (e.g., 123-GROUPNAME)',
                'division': 'Required: Format must be NAME-ALIAS (e.g., DIVISI 2-FOOTWEAR)',
                'category': 'Required: Name only (e.g., CATEGORY NAME)',
                'description': 'Optional: Product description'
            }])

            # Create Excel writer
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Sample Data', index=False)
                notes.to_excel(
                    writer, sheet_name='Column Description', index=False)

            logger.info(f"Sample sales import file created: {file_path}")
            return file_path, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        except Exception as e:
            logger.exception(f"Error creating sample file: {str(e)}")
            raise e
