import logging
from datetime import datetime
from app import db
from app.models.tax_config import TaxConfiguration
from sqlalchemy import or_, and_

logger = logging.getLogger('app.services.tax_config')


class TaxConfigurationService:
    @staticmethod
    def get_all(page=1, per_page=10, search=None, start_date=None, end_date=None):
        """
        Retrieve all tax configurations with filtering and pagination
        """
        query = TaxConfiguration.query

        if search:
            query = query.filter(or_(
                TaxConfiguration.name.ilike(f'%{search}%'),
                TaxConfiguration.description.ilike(f'%{search}%')
            ))
            logger.debug(
                f"Filtering tax configurations with search term: {search}")

        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(and_(
                TaxConfiguration.created_at >= start,
                TaxConfiguration.created_at <= end
            ))
            logger.debug(
                f"Filtering tax configurations by date range: {start_date} to {end_date}")

        tax_configs = query.order_by(TaxConfiguration.effective_from.desc()).paginate(
            page=page, per_page=per_page)

        return {
            'items': tax_configs.items,
            'total': tax_configs.total,
            'pages': tax_configs.pages,
            'current_page': tax_configs.page
        }

    @staticmethod
    def get_by_id(tax_config_id):
        """
        Retrieve a tax configuration by UUID
        """
        return TaxConfiguration.query.get(tax_config_id)

    @staticmethod
    def get_current_tax_rate():
        """
        Get the currently active tax rate
        """
        today = datetime.now().date()
        tax_config = TaxConfiguration.query.filter(
            TaxConfiguration.effective_from <= today,
            (TaxConfiguration.effective_until >= today) | (
                TaxConfiguration.effective_until.is_(None))
        ).order_by(TaxConfiguration.effective_from.desc()).first()

        if tax_config:
            return float(tax_config.tax_rate)
        return 11.0  # Default fallback rate

    @staticmethod
    def create(tax_config_data):
        """
        Create a new tax configuration
        """
        try:
            # Check if there's an active configuration that overlaps with this period
            effective_from = tax_config_data['effective_from']
            effective_until = tax_config_data.get('effective_until')

            overlapping = TaxConfigurationService._check_overlapping_periods(
                effective_from, effective_until)

            if overlapping:
                logger.warning(
                    f"Creation failed - overlapping tax configuration periods found")
                return None, "This tax configuration period overlaps with existing configurations"

            new_tax_config = TaxConfiguration(
                name=tax_config_data['name'],
                tax_rate=tax_config_data['tax_rate'],
                effective_from=effective_from,
                effective_until=effective_until,
                description=tax_config_data.get('description')
            )

            db.session.add(new_tax_config)
            db.session.commit()

            logger.info(
                f"Tax configuration created successfully: {new_tax_config.name}")
            return new_tax_config, None

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating tax configuration: {str(e)}")
            return None, f"An error occurred while creating tax configuration: {str(e)}"

    @staticmethod
    def update(tax_config_id, tax_config_data):
        """
        Update an existing tax configuration
        """
        tax_config = TaxConfiguration.query.get(tax_config_id)

        if not tax_config:
            logger.warning(
                f"Update failed - tax configuration not found: {tax_config_id}")
            return None, "Tax configuration not found"

        try:
            # Check if period overlaps with other configurations (excluding this one)
            effective_from = tax_config_data.get(
                'effective_from', tax_config.effective_from)
            effective_until = tax_config_data.get(
                'effective_until', tax_config.effective_until)

            overlapping = TaxConfigurationService._check_overlapping_periods(
                effective_from, effective_until, exclude_uuid=tax_config.uuid)

            if overlapping:
                logger.warning(
                    f"Update failed - overlapping tax configuration periods found")
                return None, "This tax configuration period overlaps with existing configurations"

            # Update fields
            if 'name' in tax_config_data:
                tax_config.name = tax_config_data['name']
            if 'tax_rate' in tax_config_data:
                tax_config.tax_rate = tax_config_data['tax_rate']
            if 'effective_from' in tax_config_data:
                tax_config.effective_from = tax_config_data['effective_from']
            if 'effective_until' in tax_config_data:
                tax_config.effective_until = tax_config_data['effective_until']
            if 'description' in tax_config_data:
                tax_config.description = tax_config_data['description']

            db.session.commit()
            logger.info(
                f"Tax configuration updated successfully: {tax_config_id}")
            return tax_config, None

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error updating tax configuration: {str(e)}")
            return None, f"An error occurred while updating tax configuration: {str(e)}"

    @staticmethod
    def delete(tax_config_id):
        """
        Delete a tax configuration
        """
        tax_config = TaxConfiguration.query.get(tax_config_id)

        if not tax_config:
            logger.warning(
                f"Deletion failed - tax configuration not found: {tax_config_id}")
            return False, "Tax configuration not found"

        try:
            # Check if this is currently active and is the only active config
            today = datetime.now().date()
            is_current = (tax_config.effective_from <= today and
                          (tax_config.effective_until is None or tax_config.effective_until >= today))

            if is_current:
                active_configs = TaxConfiguration.query.filter(
                    TaxConfiguration.id != tax_config_id,
                    TaxConfiguration.effective_from <= today,
                    (TaxConfiguration.effective_until >= today) | (
                        TaxConfiguration.effective_until.is_(None))
                ).count()

                if active_configs == 0:
                    logger.warning(
                        f"Deletion failed - cannot delete the only active tax configuration: {tax_config_id}")
                    return False, "Cannot delete the only active tax configuration. Create a replacement first."

            db.session.delete(tax_config)
            db.session.commit()

            logger.info(
                f"Tax configuration deleted successfully: {tax_config_id}")
            return True, None

        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error deleting tax configuration: {str(e)}")
            return False, "An error occurred while deleting tax configuration"

    @staticmethod
    def _check_overlapping_periods(effective_from, effective_until, exclude_uuid=None):
        """
        Check for overlapping tax configuration periods

        Returns True if there's an overlap
        """
        query = TaxConfiguration.query

        # If updating, exclude the current record
        if exclude_uuid is not None:
            query = query.filter(TaxConfiguration.uuid != exclude_uuid)

        # Case 1: New config has no end date (open-ended)
        if effective_until is None:
            # Check for any config that starts before or on the same day as new config's start
            # and has no end date or ends after new config's start
            overlapping = query.filter(
                TaxConfiguration.effective_from <= effective_from,
                (TaxConfiguration.effective_until.is_(None)) |
                (TaxConfiguration.effective_until >= effective_from)
            ).first()

            # Check for any config that starts after new config's start (all will overlap since new config has no end)
            if not overlapping:
                overlapping = query.filter(
                    TaxConfiguration.effective_from > effective_from
                ).first()

        # Case 2: New config has a specific end date
        else:
            # Check for any config that starts before or during the new config's period
            # and ends after or during the new config's period
            overlapping = query.filter(
                TaxConfiguration.effective_from <= effective_until,
                (TaxConfiguration.effective_until.is_(None)) |
                (TaxConfiguration.effective_until >= effective_from)
            ).first()

        return overlapping is not None
