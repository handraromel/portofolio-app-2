from app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from datetime import datetime


class TempImport(db.Model):
    """
    Temporary storage for import data while awaiting user confirmation
    """
    __tablename__ = "temp_imports"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), nullable=False)
    # 'sale', 'product', etc.
    import_type = db.Column(db.String(50), nullable=False)
    data = db.Column(JSONB, nullable=False)  # Store validated records here
    # pending, in_progress, completed, failed
    status = db.Column(db.String(50), default="pending")
    # Track progress with record_index:status mapping
    progress = db.Column(JSONB, default={})
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    @classmethod
    def create_import(cls, user_id, import_type, data):
        """Create a new temporary import"""
        import_obj = cls(
            user_id=user_id,
            import_type=import_type,
            data=data,
            progress={
                "total": len(data.get("valid_records", [])),
                "processed": 0,
                "succeeded": 0,
                "failed": 0,
                # Will store status for each record: {"0": "pending", "1": "success", "2": "failed"}
                "record_statuses": {}
            }
        )
        db.session.add(import_obj)
        db.session.commit()
        return import_obj

    @classmethod
    def get_by_id(cls, import_id, user_id):
        """Get import by ID and user ID"""
        return cls.query.filter_by(id=import_id, user_id=user_id).first()

    @classmethod
    def delete_import(cls, import_id, user_id):
        """Delete import by ID and user ID"""
        temp_import = cls.query.filter_by(
            id=import_id, user_id=user_id).first()
        if temp_import:
            db.session.delete(temp_import)
            db.session.commit()
            return True
        return False

    def update_record_status(self, record_index, status, error=None):
        """Update the status of a specific record"""
        if not self.progress:
            self.progress = {
                "total": len(self.data.get("valid_records", [])),
                "processed": 0,
                "succeeded": 0,
                "failed": 0,
                "record_statuses": {}
            }

        # Convert record_index to string to ensure it works as a JSON key
        record_index_str = str(record_index)

        # Check if this record has already been processed to avoid double counting
        already_processed = record_index_str in self.progress["record_statuses"]

        # Update the specific record status
        self.progress["record_statuses"][record_index_str] = {
            "status": status,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }

        # Only increment counters if this is the first time processing this record
        if not already_processed:
            # Update counters
            self.progress["processed"] += 1
            if status == "success":
                self.progress["succeeded"] += 1
            elif status == "failed":
                self.progress["failed"] += 1

        return self.progress
