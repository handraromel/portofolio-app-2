import logging
from datetime import datetime, timedelta, date
from sqlalchemy import func, cast, extract, case, distinct, and_, or_, desc, asc
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from app import db
from app.models.sale import Sale
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
            # Calculate calculated fields
            gross_sales = float(sale.discounted_amt) + float(sale.sale_amt)
            nett_sales = float(sale.sale_amt)

            # Get tax rate for the sale date
            tax_rate = SaleService._get_tax_rate_for_date(sale.input_date)
            tax_amount = nett_sales * (tax_rate / 100)
            nett_sales_after_tax = nett_sales - tax_amount

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
        tax_amount = nett_sales * (tax_rate / 100)
        nett_sales_after_tax = nett_sales - tax_amount

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
        """
        Create a new sale record
        """
        try:
            # Validate product relationship IDs exist
            if not SaleService._validate_product_relationships(
                sale_data.get('product_brand_id'),
                sale_data.get('product_group_id'),
                sale_data.get('product_division_id'),
                sale_data.get('product_category_id')
            ):
                return None, "One or more product relationships do not exist"

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
                product_category_id=sale_data.get('product_category_id')
            )

            db.session.add(new_sale)
            db.session.commit()

            # Include calculated fields
            gross_sales = float(new_sale.discounted_amt) + \
                float(new_sale.sale_amt)
            nett_sales = float(new_sale.sale_amt)

            # Get tax rate for the sale date
            tax_rate = SaleService._get_tax_rate_for_date(new_sale.input_date)
            tax_amount = nett_sales * (tax_rate / 100)
            nett_sales_after_tax = nett_sales - tax_amount

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
            tax_amount = nett_sales * (tax_rate / 100)
            nett_sales_after_tax = nett_sales - tax_amount

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
    def get_daily_sales(date_value=None, year=None, month=None, day=None,
                        brand_id=None, group_id=None, division_id=None, category_id=None):
        """
        Get daily sales summary for a specific date with year-over-year comparison
        """
        # If specific date provided, extract year, month, day
        if date_value:
            if isinstance(date_value, str):
                date_obj = datetime.strptime(date_value, '%Y-%m-%d').date()
            else:
                date_obj = date_value

            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
        # Default to today if no date components provided
        elif not all([year, month, day]):
            today = date.today()
            year = year or today.year
            month = month or today.month
            day = day or today.day

        current_date = date(year, month, day)
        last_year_date = date(year-1, month, day)

        # Get current year data
        current_year_data = SaleService._get_sales_for_date(
            current_date, brand_id, group_id, division_id, category_id)

        # Get last year data
        last_year_data = SaleService._get_sales_for_date(
            last_year_date, brand_id, group_id, division_id, category_id)

        # Calculate year-over-year changes
        yoy_changes = SaleService._calculate_yoy_changes(
            current_year_data, last_year_data)

        return {
            'date': current_date.isoformat(),
            'ty': current_year_data,  # This Year
            'ly': last_year_data,     # Last Year
            'yoy_changes': yoy_changes  # Year over Year changes
        }

    @staticmethod
    def get_mtd_sales(date_value=None, year=None, month=None,
                      brand_id=None, group_id=None, division_id=None, category_id=None):
        """
        Get month-to-date sales summary with year-over-year comparison
        """
        # If specific date provided, extract year, month
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

        current_date = date(year, month, day)
        first_day_of_month = date(year, month, 1)

        # For last year comparison
        last_year_date = date(year-1, month, day)
        last_year_first_day = date(year-1, month, 1)

        # Get current year data (month to date)
        current_mtd_data = SaleService._get_sales_for_date_range(
            first_day_of_month, current_date, brand_id, group_id, division_id, category_id)

        # Get last year data (month to date)
        last_year_mtd_data = SaleService._get_sales_for_date_range(
            last_year_first_day, last_year_date, brand_id, group_id, division_id, category_id)

        # Calculate year-over-year changes
        yoy_changes = SaleService._calculate_yoy_changes(
            current_mtd_data, last_year_mtd_data)

        return {
            'month': f"{year}-{month:02d}",
            'from_date': first_day_of_month.isoformat(),
            'to_date': current_date.isoformat(),
            'ty': current_mtd_data,     # This Year
            'ly': last_year_mtd_data,   # Last Year
            'yoy_changes': yoy_changes  # Year over Year changes
        }

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
    def _get_sales_for_date(target_date, brand_id=None, group_id=None, division_id=None, category_id=None):
        """Get aggregated sales data for a specific date"""
        query = db.session.query(
            func.sum(Sale.sale_qty).label('total_qty'),
            func.sum(Sale.sale_amt).label('total_sale_amount'),
            func.sum(Sale.discounted_amt).label('total_discount_amount'),
            func.count(Sale.uuid).label('transaction_count')
        ).filter(Sale.input_date == target_date)

        # Apply product filters
        if brand_id:
            query = query.filter(Sale.product_brand_id == brand_id)
        if group_id:
            query = query.filter(Sale.product_group_id == group_id)
        if division_id:
            query = query.filter(Sale.product_division_id == division_id)
        if category_id:
            query = query.filter(Sale.product_category_id == category_id)

        result = query.first()

        # Convert from query result to dict with proper types
        total_qty = int(result.total_qty) if result.total_qty else 0
        total_sale_amount = float(
            result.total_sale_amount) if result.total_sale_amount else 0.0
        total_discount_amount = float(
            result.total_discount_amount) if result.total_discount_amount else 0.0
        gross_sales = total_sale_amount + total_discount_amount

        # Get tax rate for the date
        tax_rate = SaleService._get_tax_rate_for_date(target_date)
        tax_amount = total_sale_amount * (tax_rate / 100)
        nett_sales_after_tax = total_sale_amount - tax_amount

        return {
            'date': target_date.isoformat(),
            'sale_qty': total_qty,
            'sale_amt': total_sale_amount,
            'discounted_amt': total_discount_amount,
            'gross_sales': gross_sales,
            'nett_sales': total_sale_amount,
            'tax_rate': tax_rate,
            'tax_amount': tax_amount,
            'nett_sales_after_tax': nett_sales_after_tax,
            'transaction_count': result.transaction_count or 0
        }

    @staticmethod
    def _get_sales_for_date_range(start_date, end_date, brand_id=None, group_id=None, division_id=None, category_id=None):
        """Get aggregated sales data for a date range"""
        query = db.session.query(
            func.sum(Sale.sale_qty).label('total_qty'),
            func.sum(Sale.sale_amt).label('total_sale_amount'),
            func.sum(Sale.discounted_amt).label('total_discount_amount'),
            func.count(Sale.uuid).label('transaction_count'),
            func.count(func.distinct(Sale.input_date)).label('days_with_sales')
        ).filter(Sale.input_date.between(start_date, end_date))

        # Apply product filters
        if brand_id:
            query = query.filter(Sale.product_brand_id == brand_id)
        if group_id:
            query = query.filter(Sale.product_group_id == group_id)
        if division_id:
            query = query.filter(Sale.product_division_id == division_id)
        if category_id:
            query = query.filter(Sale.product_category_id == category_id)

        result = query.first()

        # Convert from query result to dict with proper types
        total_qty = int(result.total_qty) if result.total_qty else 0
        total_sale_amount = float(
            result.total_sale_amount) if result.total_sale_amount else 0.0
        total_discount_amount = float(
            result.total_discount_amount) if result.total_discount_amount else 0.0
        gross_sales = total_sale_amount + total_discount_amount

        # Calculate average tax rate for the period
        # For simplicity, we're using the current tax rate, but in a real scenario
        # you might want to calculate tax based on individual transactions
        current_tax_rate = TaxConfigurationService.get_current_tax_rate()
        tax_amount = total_sale_amount * (current_tax_rate / 100)
        nett_sales_after_tax = total_sale_amount - tax_amount

        # Calculate total days in date range for coverage calculation
        total_days = (end_date - start_date).days + 1
        days_with_sales = result.days_with_sales or 0
        sales_coverage = (days_with_sales / total_days *
                          100) if total_days > 0 else 0

        # Calculate daily averages
        daily_avg_sales = total_sale_amount / \
            days_with_sales if days_with_sales > 0 else 0

        return {
            'from_date': start_date.isoformat(),
            'to_date': end_date.isoformat(),
            'sale_qty': total_qty,
            'sale_amt': total_sale_amount,
            'discounted_amt': total_discount_amount,
            'gross_sales': gross_sales,
            'nett_sales': total_sale_amount,
            'tax_rate': current_tax_rate,
            'tax_amount': tax_amount,
            'nett_sales_after_tax': nett_sales_after_tax,
            'transaction_count': result.transaction_count or 0,
            'days_with_sales': days_with_sales,
            'total_days': total_days,
            'sales_coverage': sales_coverage,
            'daily_avg_sales': daily_avg_sales
        }

    @staticmethod
    def _calculate_yoy_changes(current_data, previous_data):
        """Calculate year-over-year percentage changes"""

        def calc_percentage_change(current, previous):
            if previous and previous != 0:
                return ((current - previous) / previous) * 100
            elif current > 0:
                return 100  # If previous was 0 but current is not, that's a 100% increase
            else:
                return 0  # If both are 0, no change

        return {
            'sale_qty_change': calc_percentage_change(
                current_data['sale_qty'], previous_data['sale_qty']),
            'sale_amt_change': calc_percentage_change(
                current_data['sale_amt'], previous_data['sale_amt']),
            'discounted_amt_change': calc_percentage_change(
                current_data['discounted_amt'], previous_data['discounted_amt']),
            'gross_sales_change': calc_percentage_change(
                current_data['gross_sales'], previous_data['gross_sales']),
            'nett_sales_change': calc_percentage_change(
                current_data['nett_sales'], previous_data['nett_sales']),
            'nett_sales_after_tax_change': calc_percentage_change(
                current_data['nett_sales_after_tax'], previous_data['nett_sales_after_tax']),
            'transaction_count_change': calc_percentage_change(
                current_data['transaction_count'], previous_data['transaction_count'])
        }
