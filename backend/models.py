from sqlalchemy import Column, Integer, String, Float
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    gender = Column(String)
    race_ethnicity = Column(String)
    parental_education = Column(String)
    lunch = Column(String)
    test_preparation = Column(String)
    math_score = Column(Float)
    reading_score = Column(Float)
    writing_score = Column(Float)