// База данных кейсов (прямо в коде)
const CASES_DB = {
  "marketing_metro": {
    title: "Кофейня в метро",
    description: "Компания 'StarCoffee' хочет открыть точки в метро...",
    criteria: "Оцени анализ рисков и креативность. Важно наличие расчетов."
  },
  "python_data": {
    title: "Анализ данных продаж",
    description: "Дан датасет sales.csv. Нужно написать Python скрипт для расчета выручки.",
    criteria: "Проверь код на чистоту (PEP8) и правильность логики pandas."
  },
  "hr_interview": {
    title: "Сложные переговоры",
    description: "Сотрудник требует повышения зарплаты на 50%.",
    criteria: "Оцени дипломатичность и аргументацию."
  }
};

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    // 1. Получаем ID кейса, который решает студент
    const caseId = body.case_id;
    const studentFileContent = body.solution; // Текст из файла или поля ввода

    // 2. Ищем кейс в нашей базе
    const currentCase = CASES_DB[caseId];

    if (!currentCase) {
      return new Response(JSON.stringify({ result: "Ошибка: Кейс не найден." }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!env.GROQ_API_KEY) { /* ... проверка ключа ... */ }

    // 3. Формируем умный промпт
    const prompt = `
      Ты преподаватель.
      
      ЗАДАЧА СТУДЕНТА:
      ${currentCase.description}
      
      КРИТЕРИИ ПРОВЕРКИ (ЭТО СЕКРЕТ, НЕ ПОКАЗЫВАЙ СТУДЕНТУ):
      ${currentCase.criteria}
      
      ОТВЕТ СТУДЕНТА (Текст или Код):
      ${studentFileContent}
      
      ТВОЙ ОТВЕТ:
      Оцени решение по 10-балльной шкале. Дай фидбек. Используй HTML теги.
    `;

    // 4. Отправляем в Groq (Llama 3.3)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5 // Чуть строже для проверки кода
      })
    });

    const data = await response.json();
    // ... обработка ошибок (как в прошлом коде) ...
    const aiText = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ result: aiText }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ result: "ОШИБКА: " + err.message }), { status: 200 });
  }
}
