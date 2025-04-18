import pandas as pd
import logging
from datetime import datetime
import uuid
from app import db
from app.models.sale import Sale
from app.models.product import ProductBrand, ProductGroup, ProductDivision, ProductCategory
from app.services.file_mgmt import FileMgmtService
from app.services.sale import SaleService

logger = logging.getLogger('app.services.sale_import_export')


class SaleImportExportService:
    @staticmethod
    def import_sales_from_file(file):
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
                'sale_qty': ['quantity', 'qty', 'sale_qty', 'saleqty'],
                'sale_amt': ['sale amount', 'saleamount', 'sale_amt', 'amount'],
                'discounted_amt': ['discount', 'discount amount', 'discounted_amt', 'discountedamt'],
                'input_date': ['input date', 'date', 'input_date', 'inputdate'],
                'sku': ['sku', 'stockkeepingunit'],
                'item_no': ['item number', 'item no', 'item_no', 'itemno', 'item'],
                'brand': ['brand', 'brand_name', 'brandname', 'product brand'],
                'group': ['group', 'group_name', 'groupname', 'product group'],
                'division': ['division', 'division_name', 'divisionname', 'product division'],
                'category': ['category', 'category_name', 'categoryname', 'product category'],
                'description': ['description', 'desc', 'product description']
            }

            # Map actual columns to standardized columns
            actual_columns = {}
            for standard_col, possible_cols in column_mapping.items():
                found = False
                for possible_col in possible_cols:
                    if possible_col in df.columns:
                        actual_columns[standard_col] = possible_col
                        found = True
                        break
                if not found:
                    # For required fields, raise error if missing
                    if standard_col in ['sale_qty', 'sale_amt', 'input_date', 'brand', 'group', 'division', 'category']:
                        FileMgmtService.delete_file(file_path)
                        raise ValueError(
                            f"Required column '{standard_col}' not found in file")

            # Rename columns to match our model
            rename_mapping = {
                actual_col: standard_col for standard_col, actual_col in actual_columns.items()}
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
                        'product_category_id': product_ids['category'][idx]
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
                    'UUID': str(sale.uuid),
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
                    'Brand ID': sale.brand.id,
                    'Brand Name': sale.brand.name,
                    'Group ID': sale.group.id,
                    'Group Name': sale.group.name,
                    'Division Name': sale.division.name,
                    'Division Alias': sale.division.alias or '',
                    'Category Name': sale.category.name,
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
