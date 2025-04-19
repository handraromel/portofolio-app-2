from app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid


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
    created_at = db.Column(db.DateTime, default=func.now())

    @classmethod
    def create_import(cls, user_id, import_type, data):
        """Create a new temporary import"""
        import_obj = cls(
            user_id=user_id,
            import_type=import_type,
            data=data
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
