from flask import Flask, request, jsonify
from flask_cors import CORS
from database import engine, Base
from crud import get_students, create_student, update_student, delete_student, get_class_analytics, get_student
from database import SessionLocal
import pandas as pd

app = Flask(__name__)
CORS(app)

Base.metadata.create_all(bind=engine)

@app.route('/students/', methods=['GET'])
def read_students():
    db = SessionLocal()
    skip = int(request.args.get('skip', 0))
    limit = int(request.args.get('limit', 100))
    students = get_students(db, skip, limit)
    db.close()
    return jsonify([s.__dict__ for s in students if s is not None])

@app.route('/students/', methods=['POST'])
def add_student():
    db = SessionLocal()
    data = request.json
    student = create_student(db, data)
    db.close()
    return jsonify(student.__dict__)

@app.route('/students/<int:student_id>', methods=['GET'])
def read_student(student_id):
    db = SessionLocal()
    student = get_student(db, student_id)
    db.close()
    if student:
        return jsonify(student.__dict__)
    return jsonify({"error": "Student not found"}), 404

@app.route('/students/<int:student_id>', methods=['PUT'])
def edit_student(student_id):
    db = SessionLocal()
    data = request.json
    student = update_student(db, student_id, data)
    db.close()
    if student:
        return jsonify(student.__dict__)
    return jsonify({"error": "Student not found"}), 404

@app.route('/students/<int:student_id>', methods=['DELETE'])
def remove_student(student_id):
    db = SessionLocal()
    student = delete_student(db, student_id)
    db.close()
    if student:
        return jsonify({"message": "Deleted"})
    return jsonify({"error": "Student not found"}), 404

@app.route('/analytics/', methods=['GET'])
def analytics():
    db = SessionLocal()
    data = get_class_analytics(db)
    db.close()
    return jsonify(data)

@app.route('/upload-csv/', methods=['POST'])
def upload_csv():
    db = SessionLocal()
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Must be CSV"}), 400
    df = pd.read_csv(file)
    df = df.rename(columns={
        'race/ethnicity': 'race_ethnicity',
        'parental level of education': 'parental_education',
        'test preparation course': 'test_preparation',
        'math score': 'math_score',
        'reading score': 'reading_score',
        'writing score': 'writing_score'
    })
    if 'name' not in df.columns:
        df['name'] = ['Student_' + str(i) for i in range(1, len(df) + 1)]
    for _, row in df.iterrows():
        student_data = row.to_dict()
        create_student(db, student_data)
    db.close()
    return jsonify({"message": f"{len(df)} students added"})

if __name__ == '__main__':
    app.run(debug=True)