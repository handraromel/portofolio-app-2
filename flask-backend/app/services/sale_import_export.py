import pandas as pd
import os
import logging
from datetime import datetime
import uuid
import traceback
from app import db
from app.models.sale import Sale
from app.models.product import ProductBrand, ProductGroup, ProductDivision, ProductCategory
from app.models.temp_import import TempImport
from app.services.file_mgmt import FileMgmtService
from app.services.sale import SaleService
from app.services.activity import ActivityService

logger = logging.getLogger('app.services.sale_import_export')


class SaleImportExportService:
    @staticmethod
    def import_sales_from_file(file, user_id=None):
        """Import sales data from Excel or CSV file"""
        try:
            # Save the uploaded file
            file_path, filename = FileMgmtService.save_file(file)

            # Read file into DataFrame
            df = FileMgmtService.read_file(file_path)

            # Normalize column names (case-insensitive)
            df.columns = [col.lower().strip() for col in df.columns]

            # Map expected columns to their possible variations
            column_mapping = {
                'sale_qty': ['quantity', 'qty', 'sale_qty', 'saleqty', 'sale qty'],
                'sale_amt': ['sale amount', 'saleamount', 'sale_amt', 'amount', 'sale amt'],
                'discounted_amt': ['discount', 'discount amount', 'discounted_amt', 'discountedamt', 'discounted amt'],
                'input_date': ['input date', 'date', 'input_date', 'inputdate'],
                'sku': ['sku', 'stockkeepingunit'],
                'item_no': ['item number', 'item no', 'item_no', 'itemno', 'item'],
                'brand': ['brand', 'brand_name', 'brandname', 'product brand'],
                'group': ['group', 'group_name', 'groupname', 'product group'],
                'division': ['division', 'division_name', 'divisionname', 'product division'],
                'category': ['category', 'category_name', 'categoryname', 'product category'],
                'description': ['description', 'desc', 'product description']
            }

            # Output the actual columns for debugging
            logger.info(f"Actual columns in file: {list(df.columns)}")

            # Map actual columns to standardized columns
            actual_columns = {}
            for standard_col, possible_cols in column_mapping.items():
                found = False
                for possible_col in possible_cols:
                    if possible_col in df.columns:
                        actual_columns[standard_col] = possible_col
                        found = True
                        logger.info(
                            f"Mapped column '{possible_col}' to '{standard_col}'")
                        break
                if not found:
                    # For required fields, raise error if missing
                    if standard_col in ['sale_qty', 'sale_amt', 'input_date', 'brand', 'group', 'division', 'category']:
                        FileMgmtService.delete_file(file_path)
                        raise ValueError(
                            f"Required column '{standard_col}' not found in file")

            # Log the result of column mapping for debugging
            logger.info(f"Column mapping result: {actual_columns}")

            # Rename columns to match our model
            rename_mapping = {actual_col: standard_col for standard_col,
                              actual_col in actual_columns.items()}
            df = df.rename(columns=rename_mapping)
            logger.info(f"Columns after renaming: {list(df.columns)}")

            # Process product relationships (brand, group, division, category)
            product_ids = SaleImportExportService._process_product_relationships(
                df)

            # Convert date format
            df['input_date'] = pd.to_datetime(df['input_date']).dt.date

            # Validate and convert numeric fields
            for field in ['sale_qty', 'sale_amt', 'discounted_amt']:
                if field in df.columns:
                    df[field] = pd.to_numeric(df[field], errors='coerce')
                    df[field] = df[field].fillna(0)

            # Set defaults for missing optional fields
            if 'discounted_amt' not in df.columns:
                df['discounted_amt'] = 0
            if 'sku' not in df.columns:
                df['sku'] = None
            if 'item_no' not in df.columns:
                df['item_no'] = None
            if 'description' not in df.columns:
                df['description'] = None

            # Import the records
            success_count = 0
            error_count = 0
            errors = []

            for idx, row in df.iterrows():
                try:
                    row_index = idx + 2  # +2 for 1-based index and header row

                    # Skip row if any required relationship is missing
                    if idx not in product_ids['brand'] or idx not in product_ids['group'] or \
                            idx not in product_ids['division'] or idx not in product_ids['category']:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Missing or invalid product relationship")
                        continue

                    sale_data = {
                        'sale_qty': int(row['sale_qty']),
                        'sale_amt': float(row['sale_amt']),
                        'discounted_amt': float(row['discounted_amt']),
                        'input_date': row['input_date'],
                        'sku': row['sku'] if pd.notna(row['sku']) else None,
                        'item_no': row['item_no'] if pd.notna(row['item_no']) else None,
                        'description': row['description'] if pd.notna(row['description']) else None,
                        'product_brand_id': product_ids['brand'][idx],
                        'product_group_id': product_ids['group'][idx],
                        'product_division_id': product_ids['division'][idx],
                        'product_category_id': product_ids['category'][idx],
                        'user_id': user_id
                    }

                    result, error = SaleService.create(sale_data)
                    if error:
                        error_count += 1
                        errors.append(f"Row {row_index}: {error}")
                    else:
                        success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"Row {row_index}: {str(e)}")

            # Clean up: delete the file after processing
            FileMgmtService.delete_file(file_path)

            return {
                'success_count': success_count,
                'error_count': error_count,
                'total_count': len(df),
                'errors': errors[:10],  # Limit the number of errors returned
                'has_more_errors': len(errors) > 10
            }
        except Exception as e:
            # Make sure to clean up the file even if there's an error
            if 'file_path' in locals():
                FileMgmtService.delete_file(file_path)
            logger.exception(f"Error importing sales: {str(e)}")
            raise e

    @staticmethod
    def _process_product_relationships(df):
        """Process product relationships from imported data"""
        product_ids = {
            'brand': {},
            'group': {},
            'division': {},
            'category': {}
        }

        # Process Brand (format: "id-name")
        if 'brand' in df.columns:
            for idx, brand_value in df['brand'].items():
                if pd.isna(brand_value):
                    continue

                parts = str(brand_value).split('-', 1)
                if len(parts) != 2:
                    continue

                brand_id = parts[0].strip()
                try:
                    brand_id = int(brand_id)
                    brand = ProductBrand.query.filter_by(id=brand_id).first()
                    if brand:
                        product_ids['brand'][idx] = str(brand.uuid)
                except (ValueError, TypeError):
                    pass

        # Process Group (format: "id-name")
        if 'group' in df.columns:
            for idx, group_value in df['group'].items():
                if pd.isna(group_value):
                    continue

                parts = str(group_value).split('-', 1)
                if len(parts) != 2:
                    continue

                group_id = parts[0].strip()
                try:
                    group_id = int(group_id)
                    group = ProductGroup.query.filter_by(id=group_id).first()
                    if group:
                        product_ids['group'][idx] = str(group.uuid)
                except (ValueError, TypeError):
                    pass

        # Process Division (format: "name-alias")
        if 'division' in df.columns:
            for idx, division_value in df['division'].items():
                if pd.isna(division_value):
                    continue

                parts = str(division_value).split('-', 1)

                if len(parts) == 2:
                    division_name = parts[0].strip()
                    division_alias = parts[1].strip()
                    division = ProductDivision.query.filter_by(
                        name=division_name, alias=division_alias).first()
                else:
                    division_name = parts[0].strip()
                    division = ProductDivision.query.filter_by(
                        name=division_name).first()

                if division:
                    product_ids['division'][idx] = str(division.uuid)

        # Process Category (just the name)
        if 'category' in df.columns:
            for idx, category_value in df['category'].items():
                if pd.isna(category_value):
                    continue

                category_name = str(category_value).strip()
                category = ProductCategory.query.filter_by(
                    name=category_name).first()
                if category:
                    product_ids['category'][idx] = str(category.uuid)

        return product_ids

    @staticmethod
    def export_sales(format='xlsx', filters=None):
        """Export sales data to Excel or CSV"""
        try:
            # Apply filters to the query
            query = Sale.query

            if filters:
                if 'search' in filters and filters['search']:
                    search = filters['search']
                    query = query.filter(db.or_(
                        Sale.sku.ilike(f'%{search}%'),
                        Sale.item_no.ilike(f'%{search}%'),
                        Sale.description.ilike(f'%{search}%')
                    ))

                if 'start_date' in filters and 'end_date' in filters and filters['start_date'] and filters['end_date']:
                    start_date = datetime.strptime(
                        filters['start_date'], '%Y-%m-%d').date()
                    end_date = datetime.strptime(
                        filters['end_date'], '%Y-%m-%d').date()
                    query = query.filter(
                        Sale.input_date.between(start_date, end_date))

                if 'brand_id' in filters and filters['brand_id']:
                    query = query.filter(
                        Sale.product_brand_id == filters['brand_id'])

                if 'group_id' in filters and filters['group_id']:
                    query = query.filter(
                        Sale.product_group_id == filters['group_id'])

                if 'division_id' in filters and filters['division_id']:
                    query = query.filter(
                        Sale.product_division_id == filters['division_id'])

                if 'category_id' in filters and filters['category_id']:
                    query = query.filter(
                        Sale.product_category_id == filters['category_id'])

            # Get all sales with relationships loaded
            sales = query.all()

            # Prepare data for export
            export_data = []
            for sale in sales:
                # Get tax rate for the sale date
                tax_rate = SaleService._get_tax_rate_for_date(sale.input_date)
                tax_amount = (tax_rate + 100) / 100
                nett_sales = float(sale.sale_amt)
                nett_sales_after_tax = nett_sales / tax_amount
                gross_sales = float(sale.sale_amt) + float(sale.discounted_amt)

                # Format data for export
                sale_data = {
                    'Sale Quantity': sale.sale_qty,
                    'Sale Amount': float(sale.sale_amt),
                    'Discount Amount': float(sale.discounted_amt),
                    'Gross Sales': gross_sales,
                    'Net Sales': nett_sales,
                    'Tax Rate (%)': tax_rate,
                    'Net Sales After Tax': nett_sales_after_tax,
                    'Input Date': sale.input_date.strftime('%Y-%m-%d'),
                    'SKU': sale.sku or '',
                    'Item Number': sale.item_no or '',
                    'Description': sale.description or '',
                    'Department': str(sale.brand.id) + '-' + sale.brand.name,
                    'Group': str(sale.group.id) + '-' + sale.group.name,
                    'Division': sale.division.name + '-' + (sale.division.alias or ''),
                    'Category': sale.category.name,
                    'Inputted By': sale.user.username if sale.user else "Unknown",
                    'User Name': f"{sale.user.first_name} {sale.user.last_name}" if sale.user and sale.user.first_name and sale.user.last_name else (sale.user.username if sale.user else None),
                    'Created At': sale.created_at.strftime('%Y-%m-%d %H:%M:%S') if sale.created_at else '',
                    'Updated At': sale.updated_at.strftime('%Y-%m-%d %H:%M:%S') if sale.updated_at else ''
                }
                export_data.append(sale_data)

            # Create timestamp for filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

            # Export based on requested format
            if format.lower() == 'xlsx':
                filename = f"sales_export_{timestamp}.xlsx"
                file_path = FileMgmtService.export_to_excel(
                    export_data, filename=filename, directory=None)
                mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            else:
                filename = f"sales_export_{timestamp}.csv"
                file_path = FileMgmtService.export_to_csv(
                    export_data, filename=filename, directory=None)
                mimetype = 'text/csv'
            return {
                'file_path': file_path,
                'filename': filename,
                'mimetype': mimetype,
                'record_count': len(export_data)
            }
        except Exception as e:
            logger.exception(f"Error exporting sales: {str(e)}")
            raise e

    @staticmethod
    def get_sample_file():
        """Generate a sample Excel file for sales import"""
        try:
            file_path, filename, mimetype = FileMgmtService.create_sample_sales_file()

            return {
                'file_path': file_path,
                'filename': filename,
                'mimetype': mimetype
            }
        except Exception as e:
            logger.exception(f"Error generating sample file: {str(e)}")
            raise e

    @staticmethod
    def validate_sales_from_file(file, user_id):
        """Phase 1: Validate and temporarily store sales data from Excel or CSV file"""
        file_path = None

        try:
            # Save the uploaded file
            file_path, filename = FileMgmtService.save_file(file)

            # Read file into DataFrame
            df = FileMgmtService.read_file(file_path)

            # Normalize column names (case-insensitive) - reuse existing code
            df.columns = [col.lower().strip() for col in df.columns]

            # Map expected columns to their possible variations - reuse existing code
            column_mapping = {
                'sale_qty': ['quantity', 'qty', 'sale_qty', 'saleqty', 'sale qty'],
                'sale_amt': ['sale amount', 'saleamount', 'sale_amt', 'amount', 'sale amt'],
                'discounted_amt': ['discount', 'discount amount', 'discounted_amt', 'discountedamt', 'discounted amt'],
                'input_date': ['input date', 'date', 'input_date', 'inputdate'],
                'sku': ['sku', 'stockkeepingunit'],
                'item_no': ['item number', 'item no', 'item_no', 'itemno', 'item'],
                'brand': ['brand', 'brand_name', 'brandname', 'product brand'],
                'group': ['group', 'group_name', 'groupname', 'product group'],
                'division': ['division', 'division_name', 'divisionname', 'product division'],
                'category': ['category', 'category_name', 'categoryname', 'product category'],
                'description': ['description', 'desc', 'product description']
            }

            # Output the actual columns for debugging
            logger.info(f"Actual columns in file: {list(df.columns)}")

            # Map actual columns to standardized columns - reuse existing code
            actual_columns = {}
            for standard_col, possible_cols in column_mapping.items():
                found = False
                for possible_col in possible_cols:
                    if possible_col in df.columns:
                        actual_columns[standard_col] = possible_col
                        found = True
                        logger.info(
                            f"Mapped column '{possible_col}' to '{standard_col}'")
                        break
                if not found and standard_col in ['sale_qty', 'sale_amt', 'input_date', 'brand', 'group', 'division', 'category']:
                    # Required field is missing
                    FileMgmtService.delete_file(file_path)
                    raise ValueError(
                        f"Required column '{standard_col}' not found in file")

            # Rename columns to match our model
            rename_mapping = {actual_col: standard_col for standard_col,
                              actual_col in actual_columns.items()}
            df = df.rename(columns=rename_mapping)

            # Process product relationships (brand, group, division, category)
            product_ids = SaleImportExportService._process_product_relationships(
                df)

            # Convert date format
            df['input_date'] = pd.to_datetime(df['input_date']).dt.date

            # Validate and convert numeric fields
            for field in ['sale_qty', 'sale_amt', 'discounted_amt']:
                if field in df.columns:
                    df[field] = pd.to_numeric(df[field], errors='coerce')
                    df[field] = df[field].fillna(0)

            # Set defaults for missing optional fields
            if 'discounted_amt' not in df.columns:
                df['discounted_amt'] = 0
            if 'sku' not in df.columns:
                df['sku'] = None
            if 'item_no' not in df.columns:
                df['item_no'] = None
            if 'description' not in df.columns:
                df['description'] = None

            # Validate data (but don't insert into database yet)
            valid_records = []
            error_count = 0
            errors = []

            for idx, row in df.iterrows():
                try:
                    row_index = idx + 2  # +2 for 1-based index and header row

                    # Skip row if any required relationship is missing
                    missing_relationships = []
                    if idx not in product_ids['brand']:
                        missing_relationships.append('brand')
                    if idx not in product_ids['group']:
                        missing_relationships.append('group')
                    if idx not in product_ids['division']:
                        missing_relationships.append('division')
                    if idx not in product_ids['category']:
                        missing_relationships.append('category')

                    if missing_relationships:
                        error_count += 1
                        errors.append(
                            f"Row {row_index}: Missing or invalid product relationships: {', '.join(missing_relationships)}")
                        continue

                    # Create a valid record dictionary (but don't save to database yet)
                    sale_data = {
                        'sale_qty': int(row['sale_qty']),
                        'sale_amt': float(row['sale_amt']),
                        'discounted_amt': float(row['discounted_amt']),
                        'input_date': row['input_date'].isoformat() if hasattr(row['input_date'], 'isoformat') else str(row['input_date']),
                        'sku': row['sku'] if pd.notna(row['sku']) else None,
                        'item_no': row['item_no'] if pd.notna(row['item_no']) else None,
                        'description': row['description'] if pd.notna(row['description']) else None,
                        'product_brand_id': product_ids['brand'][idx],
                        'product_group_id': product_ids['group'][idx],
                        'product_division_id': product_ids['division'][idx],
                        'product_category_id': product_ids['category'][idx],
                        'user_id': user_id
                    }

                    # Basic validation
                    # if sale_data['sale_qty'] <= 0:
                    #     error_count += 1
                    #     errors.append(
                    #         f"Row {row_index}: Sale quantity must be positive")
                    #     continue

                    # if sale_data['sale_amt'] < 0:
                    #     error_count += 1
                    #     errors.append(
                    #         f"Row {row_index}: Sale amount cannot be negative")
                    #     continue

                    # If we get here, the record is valid
                    valid_records.append(sale_data)

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
                'errors': errors,
                'user_id': user_id  # Store the user ID in the import data
            }

            try:
                old_imports = TempImport.query.filter_by(
                    user_id=user_id,
                    import_type='sale'
                ).all()

                for old_import in old_imports:
                    db.session.delete(old_import)

                db.session.commit()
                logger.info(
                    f"Cleaned up {len(old_imports)} old temporary import records for user {user_id}")
            except Exception as e:
                logger.warning(
                    f"Failed to clean up old temp imports: {str(e)}")

            temp_import = TempImport.create_import(
                user_id=user_id,
                import_type='sale',
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
                'errors': errors[:100],
                'has_more_errors': len(errors) > 100
            }

        except Exception as e:
            # Clean up the file even if there's an error
            if file_path and os.path.exists(file_path):
                FileMgmtService.delete_file(file_path)
            logger.exception(f"Error validating sales import: {str(e)}")
            raise e

    @staticmethod
    def confirm_import(import_id, user_id):
        """Phase 2: Queue a previously validated import for processing"""
        try:
            # Find the temporary import record
            temp_import = TempImport.get_by_id(import_id, user_id)

            if not temp_import:
                return {
                    'success': False,
                    'error': 'Import not found or expired'
                }

            if temp_import.import_type != 'sale':
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

            # Initialize progress tracking
            temp_import.status = "in_progress"
            temp_import.progress = {
                "total": len(valid_records),
                "processed": 0,
                "succeeded": 0,
                "failed": 0,
                "record_statuses": {}
            }
            db.session.commit()

            # Start the background processing
            import threading

            def run_import_in_background():
                from app import create_app, db

                # Create a new app context for this thread
                app = create_app()
                with app.app_context():
                    # Create a new session for this thread
                    db.session.remove()  # Close any open sessions

                    try:
                        # Query for the import record in this thread's session
                        thread_temp_import = TempImport.query.get(import_id)

                        if not thread_temp_import:
                            logger.error(
                                f"Import {import_id} not found in background thread")
                            return

                        # Process in batches to avoid long transactions
                        batch_size = 50
                        success_count = 0

                        for batch_start in range(0, len(valid_records), batch_size):
                            batch_end = min(
                                batch_start + batch_size, len(valid_records))
                            logger.info(
                                f"Processing batch {batch_start}-{batch_end} of {len(valid_records)}")

                            for idx in range(batch_start, batch_end):
                                record = valid_records[idx]
                                try:
                                    # Convert ISO date string back to date object
                                    if 'input_date' in record and isinstance(record['input_date'], str):
                                        try:
                                            record['input_date'] = datetime.fromisoformat(
                                                record['input_date']).date()
                                        except ValueError:
                                            record['input_date'] = datetime.strptime(
                                                record['input_date'], '%Y-%m-%d').date()

                                    # Set user ID if missing
                                    if 'user_id' not in record or not record['user_id']:
                                        record['user_id'] = user_id

                                    # Create the sale record
                                    result, error = SaleService.create(record)

                                    if error:
                                        logger.warning(
                                            f"Failed to import record {idx}: {error}")
                                        # Update status in the thread's session
                                        update_record_status(
                                            thread_temp_import, idx, "failed", error)
                                        db.session.commit()
                                    else:
                                        success_count += 1
                                        # Update status in the thread's session
                                        update_record_status(
                                            thread_temp_import, idx, "success")
                                        db.session.commit()

                                except Exception as e:
                                    logger.exception(
                                        f"Error processing record {idx}: {str(e)}")
                                    update_record_status(
                                        thread_temp_import, idx, "failed", str(e))
                                    db.session.commit()

                            # Commit after each batch
                            db.session.commit()

                        # Update final status
                        thread_temp_import = TempImport.query.get(
                            import_id)  # Re-query to avoid stale state
                        if thread_temp_import:
                            if success_count == len(valid_records):
                                thread_temp_import.status = "completed"
                            elif success_count > 0:
                                thread_temp_import.status = "partially_completed"
                            else:
                                thread_temp_import.status = "failed"

                            thread_temp_import.updated_at = datetime.now()
                            db.session.commit()
                            logger.info(
                                f"Import {import_id} complete with status: {thread_temp_import.status}")

                    except Exception as e:
                        logger.exception(
                            f"Background import processing failed: {str(e)}")
                        try:
                            # Re-query in case of exception
                            thread_temp_import = TempImport.query.get(
                                import_id)
                            if thread_temp_import:
                                thread_temp_import.status = "failed"
                                if not thread_temp_import.progress:
                                    thread_temp_import.progress = {}
                                thread_temp_import.progress["error"] = str(e)
                                db.session.commit()
                        except Exception as inner_e:
                            logger.exception(
                                f"Error updating failure status: {str(inner_e)}")
                    finally:
                        # Always close the session when done
                        db.session.remove()

            # Helper function to update record status
            def update_record_status(temp_import_obj, record_index, status, error=None):
                """Update the status of a specific record without using the model method"""
                if not temp_import_obj.progress:
                    temp_import_obj.progress = {
                        "total": len(valid_records),
                        "processed": 0,
                        "succeeded": 0,
                        "failed": 0,
                        "record_statuses": {}
                    }

                # Convert record_index to string to ensure it works as a JSON key
                record_index_str = str(record_index)

                # Check if this record has already been processed to avoid double counting
                already_processed = record_index_str in temp_import_obj.progress["record_statuses"]

                # Update the specific record status
                temp_import_obj.progress["record_statuses"][record_index_str] = {
                    "status": status,
                    "error": error,
                    "timestamp": datetime.now().isoformat()
                }

                # Only increment counters if this is the first time processing this record
                if not already_processed:
                    # Update counters
                    temp_import_obj.progress["processed"] += 1
                    if status == "success":
                        temp_import_obj.progress["succeeded"] += 1
                    elif status == "failed":
                        temp_import_obj.progress["failed"] += 1

            # Start the background thread
            background_thread = threading.Thread(
                target=run_import_in_background)
            background_thread.daemon = True
            background_thread.start()
            logger.info(f"Started background thread for import {import_id}")

            # Return immediately with status info
            return {
                'success': True,
                'status': 'in_progress',  # Set as in_progress, not processing
                'import_id': str(import_id),
                'count': len(valid_records),
                'total': len(valid_records)
            }

        except Exception as e:
            logger.exception(f"Error queueing import: {str(e)}")
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
