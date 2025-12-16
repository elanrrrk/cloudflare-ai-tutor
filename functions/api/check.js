export async function onRequestPost(context) {
  try {
    // 1. Читаем данные, которые прислал студент
    const { request, env } = context;
    const body = await request.json();
    
    const studentSolution = body.solution;
    const caseText = body.case_text;

    if (!studentSolution || !caseText) {
      return new Response(JSON.stringify({ error: "Нет текста" }), { status: 400 });
    }

    // 2. Формируем промпт (Инструкцию)
    const prompt = `
      Ты строгий, но справедливый преподаватель.
      
      ТЕКСТ КЕЙСА:
      ${caseText}
      
      ОТВЕТ СТУДЕНТА:
      ${studentSolution}
      
      ИНСТРУКЦИЯ:
      Оцени ответ, укажи ошибки и дай рекомендации. Используй HTML теги для форматирования.
    `;

    // 3. Отправляем запрос в Google Gemini (через REST API)
    // Мы используем fetch, встроенный в Cloudflare, без установки библиотек
    const googleApiKey = env.GOOGLE_API_KEY; // Берем ключ из настроек Cloudflare
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`;

    const googleResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const googleData = await googleResponse.json();

    // 4. Достаем текст из ответа Google
    // Google возвращает вложенную структуру, нам нужно добраться до текста
    const aiText = googleData.candidates?.[0]?.content?.parts?.[0]?.text || "Ошибка получения ответа от ИИ";

    // 5. Отдаем ответ сайту
    return new Response(JSON.stringify({ result: aiText }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}