import logging
from datetime import datetime, timedelta, date
from sqlalchemy import func, cast, extract, case, distinct, and_, or_, desc, asc
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from app import db
from app.models.sale import Sale
from app.models.user import User
from app.models.product import ProductBrand, ProductGroup, ProductDivision, ProductCategory
from app.models.tax_config import TaxConfiguration
from app.services.tax_config import TaxConfigurationService

logger = logging.getLogger('app.services.sale')


class SaleService:
    @staticmethod
    def get_all(page=1, per_page=10, search=None, start_date=None, end_date=None,
                brand_id=None, group_id=None, division_id=None, category_id=None):
        """
        Retrieve all sales with filtering and pagination
        """
        query = Sale.query

        # Apply search filter
        if search:
            query = query.filter(or_(
                Sale.sku.ilike(f'%{search}%'),
                Sale.item_no.ilike(f'%{search}%'),
                Sale.description.ilike(f'%{search}%')
            ))
            logger.debug(f"Filtering sales with search term: {search}")

        # Apply date range filter
        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Sale.input_date.between(start, end))
            logger.debug(
                f"Filtering sales by date range: {start_date} to {end_date}")

        # Apply product filters
        if brand_id:
            query = query.filter(Sale.product_brand_id == brand_id)
        if group_id:
            query = query.filter(Sale.product_group_id == group_id)
        if division_id:
            query = query.filter(Sale.product_division_id == division_id)
        if category_id:
            query = query.filter(Sale.product_category_id == category_id)

        # Apply ordering - newest first by input date
        query = query.order_by(Sale.input_date.desc(), Sale.created_at.desc())

        # Paginate results
        sales = query.paginate(page=page, per_page=per_page)

        # Process sale items
        sale_items = []
        for sale in sales.items:
            gross_sales = float(sale.discounted_amt) + float(sale.sale_amt)
            nett_sales = float(sale.sale_amt)

            # Get tax rate for the sale date
            tax_rate = SaleService._get_tax_rate_for_date(sale.input_date)
            tax_amount = (tax_rate + 100) / 100
            nett_sales_after_tax = nett_sales / tax_amount

            sale_data = {
                'sale': sale,
                'gross_sales': gross_sales,
                'nett_sales': nett_sales,
                'tax_rate': tax_rate,
                'tax_amount': tax_amount,
                'nett_sales_after_tax': nett_sales_after_tax
            }
            sale_items.append(sale_data)

        return {
            'items': sale_items,
            'total': sales.total,
            'pages': sales.pages,
            'current_page': sales.page
        }

    @staticmethod
    def get_by_id(sale_id):
        """
        Retrieve a sale by UUID
        """
        sale = Sale.query.get(sale_id)
        if not sale:
            return None

        gross_sales = float(sale.discounted_amt) + float(sale.sale_amt)
        nett_sales = float(sale.sale_amt)

        # Get tax rate for the sale date
        tax_rate = SaleService._get_tax_rate_for_date(sale.input_date)

        tax_amount = (tax_rate + 100) / 100
        nett_sales_after_tax = nett_sales / tax_amount

        return {
            'sale': sale,
            'gross_sales': gross_sales,
            'nett_sales': nett_sales,
            'tax_rate': tax_rate,
            'tax_amount': tax_amount,
            'nett_sales_after_tax': nett_sales_after_tax
        }

    @staticmethod
    def create(sale_data):
        """Create a new sale record"""
        try:
            # Validate product relationship IDs exist
            if not SaleService._validate_product_relationships(
                sale_data.get('product_brand_id'),
                sale_data.get('product_group_id'),
                sale_data.get('product_division_id'),
                sale_data.get('product_category_id')
            ):
                return None, "Invalid product relationships"

            new_sale = Sale(
                sale_qty=sale_data.get('sale_qty', 0),
                discounted_amt=sale_data.get('discounted_amt', 0.00),
                sale_amt=sale_data.get('sale_amt', 0.00),
                sku=sale_data.get('sku'),
                item_no=sale_data.get('item_no'),
                input_date=sale_data.get('input_date'),
                description=sale_data.get('description'),
                product_brand_id=sale_data.get('product_brand_id'),
                product_group_id=sale_data.get('product_group_id'),
                product_division_id=sale_data.get('product_division_id'),
                product_category_id=sale_data.get('product_category_id'),
                user_id=sale_data.get('user_id')
            )

            db.session.add(new_sale)
            db.session.commit()

            # Include calculated fields
            gross_sales = float(new_sale.discounted_amt) + \
                float(new_sale.sale_amt)
            nett_sales = float(new_sale.sale_amt)

            # Get tax rate for the sale date
            tax_rate = SaleService._get_tax_rate_for_date(new_sale.input_date)
            tax_amount = (tax_rate + 100) / 100
            nett_sales_after_tax = nett_sales / tax_amount

            logger.info(f"Sale created successfully: {new_sale.uuid}")
            return {
                'sale': new_sale,
                'gross_sales': gross_sales,
                'nett_sales': nett_sales,
                'tax_rate': tax_rate,
                'tax_amount': tax_amount,
                'nett_sales_after_tax': nett_sales_after_tax
            }, None
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating sale: {str(e)}")
            return None, f"An error occurred while creating sale: {str(e)}"

    @staticmethod
    def update(sale_id, sale_data):
        """
        Update an existing sale record
        """
        sale = Sale.query.get(sale_id)
        if not sale:
            logger.warning(f"Update failed - sale not found: {sale_id}")
            return None, "Sale not found"

        try:
            # Validate product relationship IDs if they're being updated
            brand_id = sale_data.get('product_brand_id', sale.product_brand_id)
            group_id = sale_data.get('product_group_id', sale.product_group_id)
            division_id = sale_data.get(
                'product_division_id', sale.product_division_id)
            category_id = sale_data.get(
                'product_category_id', sale.product_category_id)

            if not SaleService._validate_product_relationships(
                brand_id, group_id, division_id, category_id
            ):
                return None, "One or more product relationships do not exist"

            # Update fields
            if 'sale_qty' in sale_data:
                sale.sale_qty = sale_data['sale_qty']
            if 'discounted_amt' in sale_data:
                sale.discounted_amt = sale_data['discounted_amt']
            if 'sale_amt' in sale_data:
                sale.sale_amt = sale_data['sale_amt']
            if 'sku' in sale_data:
                sale.sku = sale_data['sku']
            if 'item_no' in sale_data:
                sale.item_no = sale_data['item_no']
            if 'input_date' in sale_data:
                sale.input_date = sale_data['input_date']
            if 'description' in sale_data:
                sale.description = sale_data['description']
            if 'product_brand_id' in sale_data:
                sale.product_brand_id = sale_data['product_brand_id']
            if 'product_group_id' in sale_data:
                sale.product_group_id = sale_data['product_group_id']
            if 'product_division_id' in sale_data:
                sale.product_division_id = sale_data['product_division_id']
            if 'product_category_id' in sale_data:
                sale.product_category_id = sale_data['product_category_id']

            db.session.commit()

            # Include calculated fields
            gross_sales = float(sale.discounted_amt) + float(sale.sale_amt)
            nett_sales = float(sale.sale_amt)

            # Get tax rate for the sale date
            tax_rate = SaleService._get_tax_rate_for_date(sale.input_date)
            tax_amount = (tax_rate + 100) / 100
            nett_sales_after_tax = nett_sales / tax_amount

            logger.info(f"Sale updated successfully: {sale_id}")
            return {
                'sale': sale,
                'gross_sales': gross_sales,
                'nett_sales': nett_sales,
                'tax_rate': tax_rate,
                'tax_amount': tax_amount,
                'nett_sales_after_tax': nett_sales_after_tax
            }, None

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error updating sale {sale_id}: {str(e)}")
            return None, f"An error occurred while updating sale: {str(e)}"

    @staticmethod
    def delete(sale_id):
        """
        Delete a sale record
        """
        sale = Sale.query.get(sale_id)
        if not sale:
            logger.warning(f"Deletion failed - sale not found: {sale_id}")
            return False, "Sale not found"

        try:
            db.session.delete(sale)
            db.session.commit()
            logger.info(f"Sale deleted successfully: {sale_id}")
            return True, None
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error deleting sale {sale_id}: {str(e)}")
            return False, f"An error occurred while deleting sale: {str(e)}"

    @staticmethod
    def get_daily_sales_by_brand(date_value=None, year=None, month=None, day=None,
                                 brand_id=None, group_id=None, division_id=None, category_id=None,
                                 include_last_year=True, page=1, per_page=10):
        """
        Get daily sales summary aggregated by brand with optional last year comparison
        using day-of-week alignment (364 days prior)
        """
        # Handle date parameters
        if date_value:
            try:
                parsed_date = datetime.strptime(date_value, '%Y-%m-%d').date()
                year = parsed_date.year
                month = parsed_date.month
                day = parsed_date.day
            except ValueError:
                raise ValueError("Invalid date format. Use YYYY-MM-DD")
        elif not all([year, month, day]):
            today = date.today()
            year = year or today.year
            month = month or today.month
            day = day or today.day

        # Set target date for this year
        target_date = date(year, month, day)

        # Use exactly 52 weeks (364 days) prior for day-of-week alignment
        # This ensures comparing same weekday (Mon-to-Mon, Tue-to-Tue, etc.)
        last_year_date = target_date - timedelta(days=364)

        logger.info(
            f"Comparing {target_date.isoformat()} with day-of-week aligned date: {last_year_date.isoformat()}")

        # Get sales data for the target date (This Year)
        ty_data = SaleService._get_sales_for_date_by_brand(
            target_date, brand_id, group_id, division_id, category_id)

        # Get last year's data if requested
        ly_data = {}
        if include_last_year:
            try:
                ly_data = SaleService._get_sales_for_date_by_brand(
                    last_year_date, brand_id, group_id, division_id, category_id)
            except Exception as e:
                logger.warning(f"Error retrieving last year data: {str(e)}")
                # Continue even if last year data isn't available
                ly_data = {}

        # Combine data with growth metrics
        combined_data = {}
        for brand_uuid in set(list(ty_data.keys()) + list(ly_data.keys())):
            ty_item = ty_data.get(brand_uuid, {})
            ly_item = ly_data.get(brand_uuid, {})

            # Create a merged record
            if brand_uuid in ty_data:
                # Start with this year's data
                merged_record = ty_item.copy()

                # If brand exists in both years, calculate growth metrics
                if brand_uuid in ly_data:
                    ly_sale_amt = ly_item.get('sale_amt', 0)
                    ty_sale_amt = merged_record.get('sale_amt', 0)

                    growth_amt = ty_sale_amt - ly_sale_amt
                    growth_pct = ((ty_sale_amt / ly_sale_amt) *
                                  100 - 100) if ly_sale_amt > 0 else None

                    merged_record['ly_data'] = {
                        'sale_qty': ly_item.get('sale_qty', 0),
                        'sale_amt': ly_sale_amt,
                        'discounted_amt': ly_item.get('discounted_amt', 0),
                        'gross_sales': ly_item.get('gross_sales', 0),
                        'nett_sales': ly_item.get('nett_sales', 0),
                        'tax_amount': ly_item.get('tax_amount', 0),
                        'nett_sales_after_tax': ly_item.get('nett_sales_after_tax', 0),
                        'transaction_count': ly_item.get('transaction_count', 0)
                    }
                    merged_record['growth_amt'] = growth_amt
                    merged_record['growth_pct'] = growth_pct
                else:
                    # No last year data
                    merged_record['ly_data'] = None
                    merged_record['growth_amt'] = None
                    merged_record['growth_pct'] = None

                combined_data[brand_uuid] = merged_record
            else:
                # Only exists in last year, show as declined 100%
                merged_record = ly_item.copy()
                merged_record['sale_qty'] = 0
                merged_record['sale_amt'] = 0
                merged_record['discounted_amt'] = 0
                merged_record['gross_sales'] = 0
                merged_record['nett_sales'] = 0
                merged_record['tax_amount'] = 0
                merged_record['nett_sales_after_tax'] = 0
                merged_record['transaction_count'] = 0

                merged_record['ly_data'] = {
                    'sale_qty': ly_item.get('sale_qty', 0),
                    'sale_amt': ly_item.get('sale_amt', 0),
                    'discounted_amt': ly_item.get('discounted_amt', 0),
                    'gross_sales': ly_item.get('gross_sales', 0),
                    'nett_sales': ly_item.get('nett_sales', 0),
                    'tax_amount': ly_item.get('tax_amount', 0),
                    'nett_sales_after_tax': ly_item.get('nett_sales_after_tax', 0),
                    'transaction_count': ly_item.get('transaction_count', 0)
                }
                merged_record['growth_amt'] = -ly_item.get('sale_amt', 0)
                merged_record['growth_pct'] = -100.0

                combined_data[brand_uuid] = merged_record

        # Convert to list for pagination
        brands_list = list(combined_data.values())

        # Calculate pagination
        total = len(brands_list)
        pages = (total + per_page - 1) // per_page  # Ceiling division
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_brands = brands_list[start_idx:end_idx]

        # Calculate totals including this year/last year comparison
        totals = SaleService._aggregate_brand_totals_with_yoy(combined_data)

        return {
            'date': target_date.isoformat(),
            'last_year_date': last_year_date.isoformat(),
            'brands': paginated_brands,
            'total': totals,
            'current_page': page,
            'pages': pages,
            'total_records': total,
            'weekday_aligned': True  # Flag to indicate we're using day-of-week alignment
        }

    @staticmethod
    def get_mtd_sales_by_brand(date_value=None, year=None, month=None,
                               brand_id=None, group_id=None, division_id=None, category_id=None,
                               include_last_year=True, page=1, per_page=10):
        """
        Get month-to-date sales summary aggregated by brand with last year comparison
        using day-of-week alignment
        """
        # Handle date parameters
        if date_value:
            if isinstance(date_value, str):
                date_obj = datetime.strptime(date_value, '%Y-%m-%d').date()
            else:
                date_obj = date_value

            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
        # Default to today if no date components provided
        elif not all([year, month]):
            today = date.today()
            year = year or today.year
            month = month or today.month
            day = today.day
        else:
            # Use the last day of the month if only year and month provided
            if month == 12:
                next_month = date(year+1, 1, 1)
            else:
                next_month = date(year, month+1, 1)
            day = (next_month - timedelta(days=1)).day

        # Set target date ranges for this year
        ty_end_date = date(year, month, day)
        ty_start_date = date(year, month, 1)

        # For last year's MTD comparison:
        # 1. Calculate the end date using 364 days (52 weeks) before the current end date
        # This ensures comparing the same day of week
        ly_end_date = ty_end_date - timedelta(days=364)

        # 2. Calculate the start date as the first day of the month for last year's end date
        ly_start_date = date(ly_end_date.year, ly_end_date.month, 1)

        # 3. Adjust to ensure we're comparing the same number of days in the month
        ty_days_in_period = (ty_end_date - ty_start_date).days + 1
        ly_days_in_period = (ly_end_date - ly_start_date).days + 1

        # If this year has more days than last year's period, we need to adjust
        if ly_days_in_period < ty_days_in_period:
            # Extend last year's period to match this year's day count if possible
            ly_max_days = calendar.monthrange(
                ly_end_date.year, ly_end_date.month)[1]
            if ly_end_date.day + (ty_days_in_period - ly_days_in_period) <= ly_max_days:
                ly_end_date = ly_end_date + \
                    timedelta(days=(ty_days_in_period - ly_days_in_period))
        # If last year has more days, we truncate to match this year's day count
        elif ly_days_in_period > ty_days_in_period:
            ly_end_date = ly_start_date + timedelta(days=ty_days_in_period - 1)

        logger.info(f"Comparing MTD period {ty_start_date.isoformat()} to {ty_end_date.isoformat()} " +
                    f"with day-of-week aligned period {ly_start_date.isoformat()} to {ly_end_date.isoformat()}")

        # Get this year's MTD data
        ty_data = SaleService._get_sales_for_date_range_by_brand(
            ty_start_date, ty_end_date, brand_id, group_id, division_id, category_id)

        # Get last year's data if requested
        ly_data = {}
        if include_last_year:
            try:
                ly_data = SaleService._get_sales_for_date_range_by_brand(
                    ly_start_date, ly_end_date, brand_id, group_id, division_id, category_id)
            except Exception as e:
                logger.warning(
                    f"Error retrieving last year MTD data: {str(e)}")
                ly_data = {}

        # Combine data with growth metrics
        combined_data = {}
        for brand_uuid in set(list(ty_data.keys()) + list(ly_data.keys())):
            ty_item = ty_data.get(brand_uuid, {})
            ly_item = ly_data.get(brand_uuid, {})

            # Create a merged record
            if brand_uuid in ty_data:
                merged_record = ty_item.copy()

                if brand_uuid in ly_data:
                    ly_sale_amt = ly_item.get('sale_amt', 0)
                    ty_sale_amt = merged_record.get('sale_amt', 0)

                    growth_amt = ty_sale_amt - ly_sale_amt
                    growth_pct = ((ty_sale_amt / ly_sale_amt) *
                                  100 - 100) if ly_sale_amt > 0 else None

                    # Add last year data with MTD specific fields
                    merged_record['ly_data'] = {
                        'sale_qty': ly_item.get('sale_qty', 0),
                        'sale_amt': ly_sale_amt,
                        'discounted_amt': ly_item.get('discounted_amt', 0),
                        'gross_sales': ly_item.get('gross_sales', 0),
                        'nett_sales': ly_item.get('nett_sales', 0),
                        'tax_amount': ly_item.get('tax_amount', 0),
                        'nett_sales_after_tax': ly_item.get('nett_sales_after_tax', 0),
                        'transaction_count': ly_item.get('transaction_count', 0),
                        'days_with_sales': ly_item.get('days_with_sales', 0),
                        'total_days': ly_item.get('total_days', 0),
                        'sales_coverage': ly_item.get('sales_coverage', 0),
                        'daily_avg_sales': ly_item.get('daily_avg_sales', 0),
                        'from_date': ly_start_date.isoformat(),
                        'to_date': ly_end_date.isoformat()
                    }
                    merged_record['growth_amt'] = growth_amt
                    merged_record['growth_pct'] = growth_pct
                else:
                    # No last year data
                    merged_record['ly_data'] = None
                    merged_record['growth_amt'] = None
                    merged_record['growth_pct'] = None

                merged_record['from_date'] = ty_start_date.isoformat()
                merged_record['to_date'] = ty_end_date.isoformat()
                combined_data[brand_uuid] = merged_record
            else:
                # Only exists in last year - handle similar to daily sales
                merged_record = ly_item.copy()
                merged_record['sale_qty'] = 0
                merged_record['sale_amt'] = 0
                merged_record['discounted_amt'] = 0
                merged_record['gross_sales'] = 0
                merged_record['nett_sales'] = 0
                merged_record['tax_amount'] = 0
                merged_record['nett_sales_after_tax'] = 0
                merged_record['transaction_count'] = 0
                merged_record['days_with_sales'] = 0
                merged_record['sales_coverage'] = 0
                merged_record['daily_avg_sales'] = 0

                merged_record['ly_data'] = {
                    'sale_qty': ly_item.get('sale_qty', 0),
                    'sale_amt': ly_item.get('sale_amt', 0),
                    'discounted_amt': ly_item.get('discounted_amt', 0),
                    'gross_sales': ly_item.get('gross_sales', 0),
                    'nett_sales': ly_item.get('nett_sales', 0),
                    'tax_amount': ly_item.get('tax_amount', 0),
                    'nett_sales_after_tax': ly_item.get('nett_sales_after_tax', 0),
                    'transaction_count': ly_item.get('transaction_count', 0),
                    'days_with_sales': ly_item.get('days_with_sales', 0),
                    'total_days': ly_item.get('total_days', 0),
                    'sales_coverage': ly_item.get('sales_coverage', 0),
                    'daily_avg_sales': ly_item.get('daily_avg_sales', 0),
                    'from_date': ly_start_date.isoformat(),
                    'to_date': ly_end_date.isoformat()
                }

                merged_record['growth_amt'] = -ly_item.get('sale_amt', 0)
                merged_record['growth_pct'] = -100.0
                merged_record['from_date'] = ty_start_date.isoformat()
                merged_record['to_date'] = ty_end_date.isoformat()

                combined_data[brand_uuid] = merged_record

        # Convert to list for pagination
        brands_list = list(combined_data.values())

        # Calculate pagination
        total = len(brands_list)
        pages = (total + per_page - 1) // per_page
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_brands = brands_list[start_idx:end_idx]

        # Calculate totals including this year/last year comparison
        totals = SaleService._aggregate_brand_totals_with_yoy(combined_data)
        if 'from_date' not in totals and 'to_date' not in totals:
            totals['from_date'] = ty_start_date.isoformat()
            totals['to_date'] = ty_end_date.isoformat()

        if 'ly_data' in totals and totals['ly_data']:
            totals['ly_data']['from_date'] = ly_start_date.isoformat()
            totals['ly_data']['to_date'] = ly_end_date.isoformat()

        return {
            'month': f"{year}-{month:02d}",
            'from_date': ty_start_date.isoformat(),
            'to_date': ty_end_date.isoformat(),
            'last_year_from_date': ly_start_date.isoformat(),
            'last_year_to_date': ly_end_date.isoformat(),
            'brands': paginated_brands,
            'total': totals,
            'current_page': page,
            'pages': pages,
            'total_records': total,
            'weekday_aligned': True  # Flag to indicate we're using day-of-week alignment
        }

    @staticmethod
    def _aggregate_brand_totals_with_yoy(brand_data):
        """Calculate totals across all brands including YoY comparisons"""
        # Initialize totals with zeros
        totals = {
            'sale_qty': 0,
            'sale_amt': 0.0,
            'discounted_amt': 0.0,
            'gross_sales': 0.0,
            'nett_sales': 0.0,
            'tax_amount': 0.0,
            'nett_sales_after_tax': 0.0,
            'transaction_count': 0,
            'ly_data': {
                'sale_qty': 0,
                'sale_amt': 0.0,
                'discounted_amt': 0.0,
                'gross_sales': 0.0,
                'nett_sales': 0.0,
                'tax_amount': 0.0,
                'nett_sales_after_tax': 0.0,
                'transaction_count': 0
            },
            'growth_amt': 0.0,
            'growth_pct': None
        }

        # Sum up all values
        for brand_uuid, data in brand_data.items():
            # This year data
            totals['sale_qty'] += data.get('sale_qty', 0)
            totals['sale_amt'] += data.get('sale_amt', 0.0)
            totals['discounted_amt'] += data.get('discounted_amt', 0.0)
            totals['gross_sales'] += data.get('gross_sales', 0.0)
            totals['nett_sales'] += data.get('nett_sales', 0.0)
            totals['tax_amount'] += data.get('tax_amount', 0.0)
            totals['nett_sales_after_tax'] += data.get(
                'nett_sales_after_tax', 0.0)
            totals['transaction_count'] += data.get('transaction_count', 0)

            # Last year data if available
            if data.get('ly_data'):
                ly = data['ly_data']
                totals['ly_data']['sale_qty'] += ly.get('sale_qty', 0)
                totals['ly_data']['sale_amt'] += ly.get('sale_amt', 0.0)
                totals['ly_data']['discounted_amt'] += ly.get(
                    'discounted_amt', 0.0)
                totals['ly_data']['gross_sales'] += ly.get('gross_sales', 0.0)
                totals['ly_data']['nett_sales'] += ly.get('nett_sales', 0.0)
                totals['ly_data']['tax_amount'] += ly.get('tax_amount', 0.0)
                totals['ly_data']['nett_sales_after_tax'] += ly.get(
                    'nett_sales_after_tax', 0.0)
                totals['ly_data']['transaction_count'] += ly.get(
                    'transaction_count', 0)

        # Calculate overall growth
        if totals['ly_data']['sale_amt'] > 0:
            totals['growth_amt'] = totals['sale_amt'] - \
                totals['ly_data']['sale_amt']
            totals['growth_pct'] = (
                (totals['sale_amt'] / totals['ly_data']['sale_amt']) * 100 - 100)

            # Add other fields needed for MTD reports if they exist in any brand
        if any('days_with_sales' in data for data in brand_data.values()):
            # Find a record with MTD fields to copy the structure
            example_record = next(
                (data for data in brand_data.values() if 'days_with_sales' in data), None)
            if example_record:
                # Add MTD specific fields
                totals['days_with_sales'] = sum(data.get(
                    'days_with_sales', 0) for data in brand_data.values() if data.get('days_with_sales'))
                totals['total_days'] = example_record.get('total_days', 0)
                totals['sales_coverage'] = (
                    totals['days_with_sales'] / totals['total_days'] * 100) if totals['total_days'] > 0 else 0

                # Add AUR calculation for this year
                totals['aur'] = totals['sale_amt'] / \
                    totals['sale_qty'] if totals['sale_qty'] > 0 else 0

                # Add AUR calculation for last year
                totals['ly_data']['aur'] = totals['ly_data']['sale_amt'] / \
                    totals['ly_data']['sale_qty'] if totals['ly_data']['sale_qty'] > 0 else 0

                totals['from_date'] = example_record.get('from_date')
                totals['to_date'] = example_record.get('to_date')

        return totals

    # Helper methods
    @staticmethod
    def _validate_product_relationships(brand_id, group_id, division_id, category_id):
        """Check if all product relationships exist"""
        if brand_id and not ProductBrand.query.get(brand_id):
            return False
        if group_id and not ProductGroup.query.get(group_id):
            return False
        if division_id and not ProductDivision.query.get(division_id):
            return False
        if category_id and not ProductCategory.query.get(category_id):
            return False
        return True

    @staticmethod
    def _get_tax_rate_for_date(input_date):
        """Get the tax rate that was active on the given date"""
        try:
            tax_config = TaxConfiguration.query.filter(
                TaxConfiguration.effective_from <= input_date,
                (TaxConfiguration.effective_until >= input_date) |
                (TaxConfiguration.effective_until.is_(None))
            ).order_by(TaxConfiguration.effective_from.desc()).first()

            if tax_config:
                return float(tax_config.tax_rate)
            return 11.0  # Default fallback rate
        except Exception as e:
            logger.exception(
                f"Error retrieving tax rate for date {input_date}: {str(e)}")
            return 11.0  # Default fallback rate in case of error

    @staticmethod
    def _get_sales_for_date_by_brand(target_date, filter_brand_id=None, filter_group_id=None,
                                     filter_division_id=None, filter_category_id=None):
        """Get aggregated sales data grouped by brand for a specific date"""
        # First, run the main brand-level aggregation query
        base_query = db.session.query(
            # Key grouping fields
            Sale.product_brand_id,
            ProductBrand.name.label('brand_name'),
            ProductBrand.id.label('brand_id'),
            func.count(distinct(Sale.uuid)).label('transaction_count'),
            func.sum(Sale.sale_qty).label('total_qty'),
            func.sum(Sale.sale_amt).label('total_sale_amount'),
            func.sum(Sale.discounted_amt).label('total_discount_amount')
        ).filter(Sale.input_date == target_date)

        # Join with product tables to get names
        base_query = base_query.join(
            ProductBrand, Sale.product_brand_id == ProductBrand.uuid
        )

        # Apply filters if provided
        if filter_brand_id:
            base_query = base_query.filter(
                Sale.product_brand_id == filter_brand_id)
        if filter_group_id:
            base_query = base_query.filter(
                Sale.product_group_id == filter_group_id)
        if filter_division_id:
            base_query = base_query.filter(
                Sale.product_division_id == filter_division_id)
        if filter_category_id:
            base_query = base_query.filter(
                Sale.product_category_id == filter_category_id)

        # Group by brand to get proper aggregation
        brand_aggregates = base_query.group_by(
            Sale.product_brand_id,
            ProductBrand.name,
            ProductBrand.id
        ).all()

        # Initialize brand_data dictionary
        brand_data = {}

        # Process each brand aggregate
        for brand_agg in brand_aggregates:
            brand_uuid = str(brand_agg.product_brand_id)

            # Get a representative record for this brand to extract reference data
            reference_record = db.session.query(
                Sale.product_group_id,
                ProductGroup.name.label('group_name'),
                ProductGroup.id.label('group_id'),
                Sale.product_division_id,
                ProductDivision.name.label('division_name'),
                ProductDivision.alias.label('division_alias'),
                Sale.product_category_id,
                ProductCategory.name.label('category_name')
            ).filter(
                Sale.product_brand_id == brand_agg.product_brand_id,
                Sale.input_date == target_date
            ).join(
                ProductGroup, Sale.product_group_id == ProductGroup.uuid
            ).join(
                ProductDivision, Sale.product_division_id == ProductDivision.uuid
            ).join(
                ProductCategory, Sale.product_category_id == ProductCategory.uuid
            ).first()

            if not reference_record:
                continue

            # Calculate derived metrics
            total_sale_amount = float(
                brand_agg.total_sale_amount) if brand_agg.total_sale_amount else 0.0
            total_discount_amount = float(
                brand_agg.total_discount_amount) if brand_agg.total_discount_amount else 0.0
            gross_sales = total_sale_amount + total_discount_amount

            # Get tax rate for the date
            tax_rate = SaleService._get_tax_rate_for_date(target_date)
            tax_amount = (tax_rate + 100) / 100
            nett_sales_after_tax = total_sale_amount / tax_amount

            # Calculate AUR
            total_qty = int(brand_agg.total_qty) if brand_agg.total_qty else 0
            aur = total_sale_amount / total_qty if total_qty > 0 else 0.0

            # Get users who contributed to this brand on this date
            user_query = db.session.query(
                User.id.label('user_id'),
                User.first_name.label('first_name'),
                User.last_name.label('last_name'),
                User.username.label('username'),
                func.count(Sale.uuid).label('sales_count'),
                func.sum(Sale.sale_amt).label('user_sale_amount')
            ).join(
                Sale, Sale.user_id == User.id
            ).filter(
                Sale.product_brand_id == brand_agg.product_brand_id,
                Sale.input_date == target_date
            ).group_by(
                User.id,
                User.first_name,
                User.last_name,
                User.username
            ).all()

            # Create a list of user contributors
            contributors = []
            for user in user_query:
                contributors.append({
                    'user_id': str(user.user_id) if user.user_id else None,
                    'name': f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else "Unknown",
                    'username': user.username,
                    'sales_count': user.sales_count,
                    'amount': float(user.user_sale_amount) if user.user_sale_amount else 0.0
                })

            # Create the brand data entry with all the aggregated info
            brand_data[brand_uuid] = {
                'brand_uuid': brand_uuid,
                'brand_id': brand_agg.brand_id,
                'brand_name': brand_agg.brand_name,
                'group': {
                    'id': reference_record.group_id,
                    'uuid': str(reference_record.product_group_id),
                    'name': reference_record.group_name
                },
                'division': {
                    'uuid': str(reference_record.product_division_id),
                    'name': reference_record.division_name,
                    'alias': reference_record.division_alias
                },
                'category': {
                    'uuid': str(reference_record.product_category_id),
                    'name': reference_record.category_name
                },
                'sale_qty': int(brand_agg.total_qty) if brand_agg.total_qty else 0,
                'sale_amt': total_sale_amount,
                'discounted_amt': total_discount_amount,
                'gross_sales': gross_sales,
                'nett_sales': total_sale_amount,
                'tax_rate': tax_rate,
                'tax_amount': tax_amount,
                'nett_sales_after_tax': nett_sales_after_tax,
                'transaction_count': brand_agg.transaction_count or 0,
                'aur': aur,
                'contributors': contributors  # Add the list of contributors
            }

        return brand_data

    @staticmethod
    def _get_sales_for_date_range_by_brand(start_date, end_date, filter_brand_id=None,
                                           filter_group_id=None, filter_division_id=None,
                                           filter_category_id=None):
        """Get aggregated sales data grouped by brand for a date range"""
        # First query for brand aggregates
        base_query = db.session.query(
            Sale.product_brand_id,
            ProductBrand.name.label('brand_name'),
            # Include the brand ID (numeric)
            ProductBrand.id.label('brand_id'),
            func.sum(Sale.sale_qty).label('total_qty'),
            func.sum(Sale.sale_amt).label('total_sale_amount'),
            func.sum(Sale.discounted_amt).label('total_discount_amount'),
            func.count(distinct(Sale.uuid)).label('transaction_count'),
            func.count(distinct(Sale.input_date)).label('days_with_sales')
        ).filter(Sale.input_date.between(start_date, end_date))

        # Join with product tables
        base_query = base_query.join(
            ProductBrand, Sale.product_brand_id == ProductBrand.uuid
        )

        # Apply filters
        if filter_brand_id:
            base_query = base_query.filter(
                Sale.product_brand_id == filter_brand_id)
        if filter_group_id:
            base_query = base_query.filter(
                Sale.product_group_id == filter_group_id)
        if filter_division_id:
            base_query = base_query.filter(
                Sale.product_division_id == filter_division_id)
        if filter_category_id:
            base_query = base_query.filter(
                Sale.product_category_id == filter_category_id)

        # Group by brand
        brand_aggregates = base_query.group_by(
            Sale.product_brand_id,
            ProductBrand.name,
            ProductBrand.id  # Add brand_id to the GROUP BY clause
        ).all()

        # Calculate total days in date range for coverage calculation
        total_days = (end_date - start_date).days + 1

        # Process results by brand
        brand_data = {}
        for brand_agg in brand_aggregates:
            brand_uuid = str(brand_agg.product_brand_id)

            # Get a representative record for this brand to extract reference data
            reference_record = db.session.query(
                Sale.product_group_id,
                ProductGroup.name.label('group_name'),
                ProductGroup.id.label('group_id'),
                Sale.product_division_id,
                ProductDivision.name.label('division_name'),
                ProductDivision.alias.label('division_alias'),
                Sale.product_category_id,
                ProductCategory.name.label('category_name')
            ).filter(
                Sale.product_brand_id == brand_agg.product_brand_id,
                Sale.input_date.between(start_date, end_date)
            ).join(
                ProductGroup, Sale.product_group_id == ProductGroup.uuid
            ).join(
                ProductDivision, Sale.product_division_id == ProductDivision.uuid
            ).join(
                ProductCategory, Sale.product_category_id == ProductCategory.uuid
            ).first()

            if not reference_record:
                continue

            # Calculate metrics
            total_sale_amount = float(
                brand_agg.total_sale_amount) if brand_agg.total_sale_amount else 0.0
            total_discount_amount = float(
                brand_agg.total_discount_amount) if brand_agg.total_discount_amount else 0.0
            gross_sales = total_sale_amount + total_discount_amount

            # Get tax rate
            tax_rate = TaxConfigurationService.get_current_tax_rate()
            tax_amount = (tax_rate + 100) / 100
            nett_sales_after_tax = total_sale_amount / tax_amount

            # Calculate coverage and daily average
            days_with_sales = brand_agg.days_with_sales or 0
            sales_coverage = (days_with_sales / total_days *
                              100) if total_days > 0 else 0

            aur = total_sale_amount / \
                int(brand_agg.total_qty) if brand_agg.total_qty and int(
                    brand_agg.total_qty) > 0 else 0

            brand_data[brand_uuid] = {
                'brand_uuid': brand_uuid,
                'brand_id': brand_agg.brand_id,
                'brand_name': brand_agg.brand_name,
                'group': {
                    'id': reference_record.group_id,
                    'uuid': str(reference_record.product_group_id),
                    'name': reference_record.group_name
                },
                'division': {
                    'uuid': str(reference_record.product_division_id),
                    'name': reference_record.division_name,
                    'alias': reference_record.division_alias
                },
                'category': {
                    'uuid': str(reference_record.product_category_id),
                    'name': reference_record.category_name
                },
                'sale_qty': int(brand_agg.total_qty) if brand_agg.total_qty else 0,
                'sale_amt': total_sale_amount,
                'discounted_amt': total_discount_amount,
                'gross_sales': gross_sales,
                'nett_sales': total_sale_amount,
                'tax_rate': tax_rate,
                'tax_amount': tax_amount,
                'nett_sales_after_tax': nett_sales_after_tax,
                'transaction_count': brand_agg.transaction_count or 0,
                'days_with_sales': days_with_sales,
                'total_days': total_days,
                'sales_coverage': sales_coverage,
                'aur': aur,  # Add AUR instead of daily_avg_sales
                'from_date': start_date.isoformat(),
                'to_date': end_date.isoformat()
            }

        return brand_data

    @staticmethod
    def _aggregate_brand_totals(brand_data):
        """Calculate totals across all brands"""
        if not brand_data:
            return {
                'sale_qty': 0,
                'sale_amt': 0.0,
                'discounted_amt': 0.0,
                'gross_sales': 0.0,
                'nett_sales': 0.0,
                'tax_amount': 0.0,
                'nett_sales_after_tax': 0.0,
                'transaction_count': 0
            }

        # Initialize counters
        totals = {
            'sale_qty': 0,
            'sale_amt': 0.0,
            'discounted_amt': 0.0,
            'gross_sales': 0.0,
            'nett_sales': 0.0,
            'tax_amount': 0.0,
            'nett_sales_after_tax': 0.0,
            'transaction_count': 0
        }

        # Add up values from all brands
        for brand_id, data in brand_data.items():
            totals['sale_qty'] += data['sale_qty']
            totals['sale_amt'] += data['sale_amt']
            totals['discounted_amt'] += data['discounted_amt']
            totals['gross_sales'] += data['gross_sales']
            totals['nett_sales'] += data['nett_sales']
            totals['tax_amount'] += data['tax_amount']
            totals['nett_sales_after_tax'] += data['nett_sales_after_tax']
            totals['transaction_count'] += data['transaction_count']

            # For MTD reports, add additional calculated fields if they exist in any brand
        if any('days_with_sales' in data for data in brand_data.values()):
            # Find the max for these values as they should be the same across brands
            example_brand = next(iter(brand_data.values()))
            totals['days_with_sales'] = max(
                data.get('days_with_sales', 0) for data in brand_data.values())
            totals['total_days'] = example_brand.get('total_days', 0)

            # Recalculate metrics
            totals['sales_coverage'] = (
                totals['days_with_sales'] / totals['total_days'] * 100) if totals['total_days'] > 0 else 0

            # Calculate overall AUR instead of daily_avg_sales
            totals['aur'] = totals['sale_amt'] / \
                totals['sale_qty'] if totals['sale_qty'] > 0 else 0

            # Add date ranges
            totals['from_date'] = example_brand.get('from_date')
            totals['to_date'] = example_brand.get('to_date')

        return totals

    # Add this method to the SaleService class

    @staticmethod
    def delete_multiple(sale_ids):
        """
        Delete multiple sale records by their UUIDs

        Args:
            sale_ids (list): List of sale UUIDs to delete

        Returns:
            tuple: (success_count, error_count, errors)
        """
        if not sale_ids:
            return 0, 0, []

        success_count = 0
        error_count = 0
        errors = []

        try:
            # Find all the sales that exist
            sales = Sale.query.filter(Sale.uuid.in_(sale_ids)).all()
            found_ids = [str(sale.uuid) for sale in sales]

            # Track missing IDs
            missing_ids = [str(id)
                           for id in sale_ids if str(id) not in found_ids]
            if missing_ids:
                error_count += len(missing_ids)
                errors.append(f"Sales not found: {', '.join(missing_ids)}")

            # Delete the found sales
            for sale in sales:
                try:
                    db.session.delete(sale)
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(
                        f"Failed to delete sale {sale.uuid}: {str(e)}")

            db.session.commit()
            logger.info(f"Bulk deleted {success_count} sales successfully")
            return success_count, error_count, errors

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error in bulk delete operation: {str(e)}")
            return 0, 1, [f"Bulk delete operation failed: {str(e)}"]
