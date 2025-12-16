from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os

app = Flask(__name__)
# Разрешаем запросы с любых сайтов (для тестов). 
# В будущем вместо '*' лучше поставить адрес вашего сайта.
CORS(app, resources={r"/*": {"origins": "*"}})

# Настраиваем доступ к Google AI через переменную окружения
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

@app.route('/api/check', methods=['POST'])
def check_solution():
    try:
        data = request.json
        
        # Получаем данные от студента
        student_solution = data.get('solution', '')
        case_description = data.get('case_text', '') # Текст кейса
        
        if not student_solution or not case_description:
            return jsonify({"error": "Нет решения или текста кейса"}), 400

        # === ВОТ ЗДЕСЬ НАСТРАИВАЕТСЯ ИНСТРУКЦИЯ (ПРОМПТ) ===
        prompt = f"""
        Ты профессиональный эксперт и преподаватель.
        
        Твоя задача: Проверить решение студента по бизнес-кейсу.
        
        ТЕКСТ КЕЙСА:
        {case_description}
        
        РЕШЕНИЕ СТУДЕНТА:
        {student_solution}
        
        ИНСТРУКЦИЯ:
        1. Оцени решение по шкале от 1 до 10.
        2. Напиши, что сделано хорошо.
        3. Напиши, где допущены логические ошибки.
        4. Дай рекомендации, как улучшить решение.
        
        Отвечай вежливо, конструктивно, на русском языке. И используй HTML разметку (например <b>жирный</b>, <br> перенос строки), чтобы ответ красиво смотрелся на сайте.
        """
        
        # Выбираем модель (Flash - быстрая и дешевая/бесплатная)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return jsonify({"result": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Для локального запуска (не обязательно для Vercel)
if __name__ == '__main__':
    app.run(debug=True)