export const ALGERIAN_TEACHER_RESOURCES = {
  systemInstruction: `
أنت "الأستاذ الجزائري"، مساعد ذكاء اصطناعي متخصص في برنامج السنة الرابعة متوسط في الجزائر.
شخصيتك: أنت أستاذ خبير، صبور، ومحفز. هدفك هو مساعدة التلاميذ على فهم دروسهم، حل تمارينهم، والتحضير لشهادة التعليم المتوسط (BEM).
يجب أن تكون على دراية كاملة بالبرنامج الدراسي الجزائري لهذه السنة في جميع المواد.

**قدراتك:**
- شرح الدروس بالتفصيل وتقديم أمثلة واضحة.
- المساعدة في حل التمارين والمسائل خطوة بخطوة.
- تقديم ملخصات وخرائط ذهنية للمراجعة.
- الإجابة على جميع أسئلة التلاميذ المتعلقة بالمنهج الدراسي.
- البحث في الويب عن معلومات إضافية لإثراء إجاباتك.
- إنشاء مخططات ورسوم بيانية لتوضيح المفاهيم.
- قراءة وتحليل الملفات التي يرفقها التلاميذ.
- عرض الكتب المدرسية والملخصات عند الطلب.

**قاعدة بيانات الموارد:**
عندما يطلب منك التلميذ كتابًا أو ملخصًا، يمكنك عرض الموارد التالية. استخدم الأمر \`[SHOW_RESOURCE:{"type": "book" or "lesson", "subject": "اسم المادة", "title": "عنوان المورد", "url": "الرابط"}]\` لعرضه.

**الكتب المدرسية:**
- اللغة العربية: https://drive.google.com/file/d/1tsCC_U1ZRuOUoIx0LuTX5l9Ya5c97J-2/view
- اللغة الفرنسية: https://drive.google.com/file/d/1qoOOsyW3mSRvh0y4vKWWll3Ucy_KNpHt/view
- اللغة الأمازيغية: https://drive.google.com/file/d/12Nu5t3TM8zYoKckH3unqGzWpXIjwRwJx/view
- اللغة الإنجليزية: https://drive.google.com/file/d/1a4kYuXUVCLLss4POfXvIYG3D7LnBWhoy/view
- الرياضيات: https://drive.google.com/file/d/1KIAmg-VUjUJ2jmIivqxGtdGTZYkRhaaR/view
- العلوم الفيزياء والتكنولوجيا: https://drive.google.com/file/d/1vUDFR0l-P9oo4EEJMPP9QZffBozQK4Zy/view
- العلوم الطبيعة والحياة: https://drive.google.com/file/d/10SIaO50cV1APQhIB52MPyVn_jZuHE7iz/view
- التاريخ: https://drive.google.com/file/d/1OwVCw3vqtgZjq7Ke8wn_nB75SXKV3Twf/view
- الجغرافيا: https://drive.google.com/file/d/1Wx523ISmAH5lf5cfqwt298iU_JeUbXG-/view
- التربية الإسلامية: https://drive.google.com/file/d/11xVGQ97CgAiJiONTlJSK40zTCX-2J1s9/view
- التربية المدنية: https://drive.google.com/file/d/110wOtIKzp4smtI6w9qhuWCBpMWtZUpDj/view
`,
  books: {
    "subjects": {
      "اللغة العربية": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1tsCC_U1ZRuOUoIx0LuTX5l9Ya5c97J-2/view" }],
      "اللغة الفرنسية": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1qoOOsyW3mSRvh0y4vKWWll3Ucy_KNpHt/view" }],
      "اللغة الأمازيغية": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/12Nu5t3TM8zYoKckH3unqGzWpXIjwRwJx/view" }],
      "اللغة الإنجليزية": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1a4kYuXUVCLLss4POfXvIYG3D7LnBWhoy/view" }],
      "الرياضيات": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1KIAmg-VUjUJ2jmIivqxGtdGTZYkRhaaR/view" }],
      "العلوم الفيزياء والتكنولوجيا": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1vUDFR0l-P9oo4EEJMPP9QZffBozQK4Zy/view" }],
      "العلوم الطبيعة والحياة": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/10SIaO50cV1APQhIB52MPyVn_jZuHE7iz/view" }],
      "التاريخ": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1OwVCw3vqtgZjq7Ke8wn_nB75SXKV3Twf/view" }],
      "الجغرافيا": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/1Wx523ISmAH5lf5cfqwt298iU_JeUbXG-/view" }],
      "التربية الإسلامية": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/11xVGQ97CgAiJiONTlJSK40zTCX-2J1s9/view" }],
      "التربية المدنية": [{ "title": "الكتاب المدرسي", "url": "https://drive.google.com/file/d/110wOtIKzp4smtI6w9qhuWCBpMWtZUpDj/view" }]
    }
  },
  lessons: {
    "subjects": {
      "اللغة العربية": [
        { "title": "ملخص 1", "url": "https://drive.google.com/file/d/11wf6eYuqG7E4x79j-6bus6HcyNeGpcmc/view" },
        { "title": "ملخص 2", "url": "https://drive.google.com/file/d/1P-l4j1LY35sD7KdqkUgA3iRdJ45emI8s/view" },
        { "title": "ملخص 3", "url": "https://drive.google.com/file/d/1OXIg5L7OR1OHMUD3Us1GtqSfA5MHdK2O/view" },
        { "title": "ملخص 4", "url": "https://drive.google.com/file/d/1Vz1UD2n-wmTT_JatD_RnbiXEcvPpj8HZ/view" },
        { "title": "ملخص 5", "url": "https://drive.google.com/file/d/1D6jFtLAA2Yz2P1C_JDSaJ26Df8UrdT3w/view" }
      ],
      "اللغة الفرنسية": "لا يوجد ملخصات حاليا.",
      "اللغة الأمازيغية": "لا يوجد ملخصات حاليا.",
      "اللغة الإنجليزية": "لا يوجد ملخصات حاليا.",
      "الرياضيات": [
        { "title": "التعرّف على قاسم عدد طبيعي", "url": "https://www.t-onec.com/2021/06/4_221.html" },
        { "title": "قواسم عدد طبيعي", "url": "https://www.t-onec.com/2021/06/4_756.html" },
        { "title": "خواص قواسم عدد طبيعي", "url": "https://www.t-onec.com/2021/06/4_744.html" },
        { "title": "القاسم المشترك الأكبر", "url": "https://www.t-onec.com/2021/06/4-pdf_27.html" }
      ],
      "العلوم الفيزياء والتكنولوجيا": "لا يوجد ملخصات حاليا.",
      "العلوم الطبيعة والحياة": [
        { "title": "ملخص 1", "url": "https://drive.google.com/file/d/1WU95CnuUeJ88np3vk4s_v9Wr5sgLqILz/view" },
        { "title": "ملخص جزء 1", "url": "https://drive.google.com/file/d/1qysNI4T3ODQ0Sg6NOD_UkSgDppit1sK-/view" },
        { "title": "ملخص جزء 2", "url": "https://drive.google.com/file/d/1xWrNn9toN7yho69A-u8UMK3YylFvT3zy/view" },
        { "title": "ملخص جزء 3", "url": "https://drive.google.com/file/d/1gklJDwiJGhaU74qtLTDJ1fcztYxC-pZr/view" }
      ],
      "التاريخ": [
        { "title": "ملخص 1", "url": "https://drive.google.com/file/d/1DGeaAdxQ6w3_sy2KNg9-RcFebdViM-xc/view" },
        { "title": "ملخص 2", "url": "https://drive.google.com/file/d/1fuGc-w0cYpw-NAJlXWq_OQ593AqQTuvb/view" },
        { "title": "ملخص 3", "url": "https://drive.google.com/file/d/1ZmZaS7kb46hWRrLH3m_haiwFC8NUDRqI/view" }
      ],
      "الجغرافيا": [
        { "title": "ملخص 1", "url": "https://drive.google.com/file/d/1RS54xhcmHXMS6Yp9KF-FIELnpMPPo6qW/view" },
        { "title": "ملخص 2", "url": "https://drive.google.com/file/d/1ZmZaS7kb46hWRrLH3m_haiwFC8NUDRqI/view" }
      ],
      "التربية الإسلامية": [
        { "title": "ملخص 1", "url": "https://drive.google.com/file/d/1Fwj6NAYS5ymRSobWgPc6jGDTDA57xnvn/view" },
        { "title": "ملخص 2", "url": "https://drive.google.com/file/d/1gzWNDKD2j65131fY9rntf_VtQMf1WrWZ/view" },
        { "title": "ملخص 3", "url": "https://drive.google.com/file/d/1HpREvd4wIldohW0I-KHOklOmU-X_DVP_/view" },
        { "title": "ملخص 4", "url": "https://drive.google.com/file/d/1oViAIoSK_jraYvao43B8RwweqKNxHFPF/view" },
        { "title": "ملخص 5", "url": "https://drive.google.com/file/d/15cL7bUt7LFi-yb0llctCJzEftBStQvIX/view" }
      ],
      "التربية المدنية": [
         { "title": "ملخص", "url": "https://drive.google.com/file/d/1ZmZaS7kb46hWRrLH3m_haiwFC8NUDRqI/view" }
      ]
    }
  }
}
