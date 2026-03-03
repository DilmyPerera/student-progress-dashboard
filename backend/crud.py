from sqlalchemy.orm import Session
import pandas as pd
from models import Student

def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Student).offset(skip).limit(limit).all()

def get_student(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()

def create_student(db: Session, student_data: dict):
    db_student = Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_data: dict):
    db_student = get_student(db, student_id)
    if db_student:
        for key, value in student_data.items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    db_student = get_student(db, student_id)
    if db_student:
        db.delete(db_student)
        db.commit()
    return db_student

def delete_all_students(db: Session):
    deleted_count = db.query(Student).delete()
    db.commit()
    return deleted_count

def get_class_analytics(db: Session):
    students = get_students(db)
    if not students:
        return {}
    df = pd.DataFrame([s.__dict__ for s in students])
    df['average'] = df[['math_score', 'reading_score', 'writing_score']].mean(axis=1)
    analytics = {
        "total_students": len(df),
        "avg_math": df['math_score'].mean(),
        "avg_reading": df['reading_score'].mean(),
        "avg_writing": df['writing_score'].mean(),
        "overall_avg": df['average'].mean(),
        "pass_rate": (df['average'] >= 60).mean() * 100,
        "grade_distribution": df['average'].apply(lambda x: 
            'A' if x >= 90 else 'B' if x >= 80 else 'C' if x >= 70 else 'D' if x >= 60 else 'F'
        ).value_counts().to_dict(),
        "top_5": df.nlargest(5, 'average')[['id', 'name', 'average']].to_dict('records'),
        "bottom_5": df.nsmallest(5, 'average')[['id', 'name', 'average']].to_dict('records')
    }
    return analytics