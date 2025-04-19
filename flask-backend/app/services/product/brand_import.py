import pandas as pd
import logging
import os
import re
import traceback
from datetime import datetime
from app import db
from app.models.product import ProductBrand
from app.models.temp_import import TempImport
from app.services.file_mgmt import FileMgmtService
from app.services.product.brand import ProductBrandService

logger = logging.getLogger('app.services.brand_import_export')


class BrandImportService:
    @staticmethod
    def validate_brands_from_file(file, user_id):
        """Phase 1: Validate and temporarily store brand data from Excel or CSV file"""
        file_path = None

        try:
            # Save the uploaded file
            file_path, filename = FileMgmtService.save_file(file)

            # Read file into DataFrame
            df = FileMgmtService.read_file(file_path)

            # Get column names and log them
            original_columns = list(df.columns)
            logger.info(f"Original columns in file: {original_columns}")

            # Normalize column names (case-insensitive)
            df.columns = [col.lower().strip() for col in df.columns]

            # Map expected columns to their possible variations
            column_mapping = {
                'brand': ['brand', 'name', 'brand_name', 'brandname', 'brand name', 'id-name']
            }

            # Find the brand column
            brand_column = None
            for possible_col in column_mapping['brand']:
                if possible_col in df.columns:
                    brand_column = possible_col
                    logger.info(f"Found brand column: '{possible_col}'")
                    break

            # If we didn't find a column, try using the first column
            if not brand_column and len(df.columns) > 0:
                brand_column = df.columns[0]
                logger.info(
                    f"Using first column as brand column: '{brand_column}'")

            if not brand_column:
                FileMgmtService.delete_file(file_path)
                raise ValueError("Could not identify a column for brand data")

            # Validate data (but don't insert into database yet)
            valid_records = []
            error_count = 0
            errors = []

            # Compile regex pattern for ID-NAME format
            # Matches both "123-ADIDAS" and "123 - ADIDAS" formats
            pattern = re.compile(r'^(\d+)\s*-\s*(.+)$')

            # Get existing brand IDs and names for validation
            existing_brand_ids = {
                brand.id for brand in ProductBrand.query.all()}
            existing_brand_names = {brand.name.lower()
                                    for brand in ProductBrand.query.all()}

            for idx, row in df.iterrows():
                try:
                    row_index = idx + 2  # +2 for 1-based index and header row

                    # Skip empty rows
                    if pd.isna(row[brand_column]) or str(row[brand_column]).strip() == '':
                        error_count += 1
                        errors.append(f"Row {row_index}: Empty brand value")
                        continue

                    brand_value = str(row[brand_column]).strip()

                    # Match the ID-NAME pattern
                    match = pattern.match(brand_value)
                    if not match:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Invalid format '{brand_value}'. Must be 'ID-NAME' format (e.g., '123-ADIDAS' or '123 - ADIDAS')")
                        continue

                    # Extract ID and name from the match
                    brand_id_str, brand_name = match.groups()

                    try:
                        brand_id = int(brand_id_str)
                    except ValueError:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Brand ID must be a number")
                        continue

                    brand_name = brand_name.strip()
                    if not brand_name:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Brand name cannot be empty")
                        continue

                    # Check for duplicates within the file
                    duplicate_id_count = 0
                    for i, r in df.iterrows():
                        if pd.isna(r[brand_column]) or str(r[brand_column]).strip() == '':
                            continue

                        value = str(r[brand_column]).strip()
                        m = pattern.match(value)
                        if m and int(m.group(1)) == brand_id:
                            duplicate_id_count += 1

                    if duplicate_id_count > 1:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Duplicate brand ID ({brand_id}) found in the file")
                        continue

                    # Check if ID already exists in database
                    if brand_id in existing_brand_ids:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Brand ID {brand_id} already exists in the database")
                        continue

                    # Check if name already exists in database
                    if brand_name.lower() in existing_brand_names:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Brand name '{brand_name}' already exists in the database")
                        continue

                    # If we get here, the record is valid
                    valid_records.append({
                        'id': brand_id,
                        'name': brand_name
                    })

                except Exception as e:
                    error_count += 1
                    errors.append(f"Row {row_index}: {str(e)}")
                    logger.error(
                        f"Error processing row {row_index}: {traceback.format_exc()}")

            # Create a temporary import record
            import_data = {
                'valid_records': valid_records,
                'total_count': len(df),
                'success_count': len(valid_records),
                'error_count': error_count,
                'errors': errors
            }

            temp_import = TempImport.create_import(
                user_id=user_id,
                import_type='brand',
                data=import_data
            )

            # Clean up the file after processing
            if file_path:
                FileMgmtService.delete_file(file_path)

            return {
                'import_id': temp_import.id,
                'success_count': len(valid_records),
                'error_count': error_count,
                'total_count': len(df),
                'errors': errors[:10],  # Limit the number of errors returned
                'has_more_errors': len(errors) > 10
            }

        except Exception as e:
            # Clean up the file even if there's an error
            if file_path and os.path.exists(file_path):
                FileMgmtService.delete_file(file_path)
            logger.exception(f"Error validating brand import: {str(e)}")
            raise e

    @staticmethod
    def confirm_import(import_id, user_id):
        """Phase 2: Commit a previously validated import to the database"""
        try:
            # Find the temporary import record
            temp_import = TempImport.get_by_id(import_id, user_id)

            if not temp_import:
                return {
                    'success': False,
                    'error': 'Import not found or expired'
                }

            if temp_import.import_type != 'brand':
                return {
                    'success': False,
                    'error': 'Invalid import type'
                }

            # Get the validated records
            valid_records = temp_import.data.get('valid_records', [])

            if not valid_records:
                return {
                    'success': False,
                    'error': 'No valid records to import'
                }

            # Insert all records into the database
            success_count = 0
            errors = []

            for record in valid_records:
                try:
                    # Use the existing ProductBrandService to create the record
                    brand, error = ProductBrandService.create(record)
                    if error:
                        errors.append(
                            f"Error creating brand ID {record['id']}: {error}")
                    else:
                        success_count += 1
                except Exception as e:
                    errors.append(
                        f"Error creating brand ID {record['id']}: {str(e)}")
                    logger.error(
                        f"Error creating brand during import confirmation: {str(e)}")

            # Delete the temporary import record after processing
            db.session.delete(temp_import)
            db.session.commit()

            # Return the result
            return {
                'success': True,
                'count': success_count,
                'total': len(valid_records),
                'failed': len(valid_records) - success_count,
                'errors': errors[:10] if errors else []
            }

        except Exception as e:
            logger.exception(f"Error confirming import: {str(e)}")
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def create_sample_file():
        """Generate a sample Excel file for brand import"""
        try:
            download_dir = FileMgmtService.get_download_dir()
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'brand_import_sample_{timestamp}.xlsx'
            file_path = os.path.join(download_dir, filename)

            # Create sample data with the expected ID-NAME format
            sample_data = [
                {'Brand': '123-ADIDAS'},
                {'Brand': '124-NIKE'},
                {'Brand': '125-PUMA'},
                # With space to show both formats are accepted
                {'Brand': '126 - REEBOK'}
            ]

            # Create DataFrame
            df = pd.DataFrame(sample_data)

            # Add instructions sheet
            instructions = pd.DataFrame([{
                'Format': 'ID-NAME Format:',
                'Description': 'Each brand must be in the format "ID-NAME" or "ID - NAME" (e.g., "123-ADIDAS" or "123 - ADIDAS")'
            }, {
                'Format': 'ID:',
                'Description': 'Must be a unique numeric identifier that does not exist in the database'
            }, {
                'Format': 'NAME:',
                'Description': 'Must be a unique brand name that does not exist in the database'
            }])

            # Create Excel writer
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Sample Data', index=False)
                instructions.to_excel(
                    writer, sheet_name='Instructions', index=False)

            logger.info(f"Sample brand import file created: {file_path}")
            return file_path, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        except Exception as e:
            logger.exception(f"Error creating sample file: {str(e)}")
            raise e
