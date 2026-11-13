// Medical term display translations (symptoms, body locations).
//
// These terms double as STORED data values — a logged symptom keeps its English
// name in the database so pattern-matching and cross-language history stay
// consistent. We only translate for DISPLAY via trTerm(); anything not in the
// map (e.g. a user's custom symptom) falls back to the original text.

import type { Lang } from './index';

type L = Record<Lang, string>;

export const TERMS: Record<string, L> = {
  // ── Symptoms ────────────────────────────────────────────────────────────────
  'Fatigue': { en: 'Fatigue', ru: 'Усталость', tr: 'Yorgunluk', fr: 'Fatigue', es: 'Fatiga', it: 'Stanchezza', ko: '피로' },
  'Headache': { en: 'Headache', ru: 'Головная боль', tr: 'Baş ağrısı', fr: 'Mal de tête', es: 'Dolor de cabeza', it: 'Mal di testa', ko: '두통' },
  'Nausea': { en: 'Nausea', ru: 'Тошнота', tr: 'Bulantı', fr: 'Nausée', es: 'Náuseas', it: 'Nausea', ko: '메스꺼움' },
  'Bloating': { en: 'Bloating', ru: 'Вздутие', tr: 'Şişkinlik', fr: 'Ballonnements', es: 'Hinchazón', it: 'Gonfiore', ko: '복부 팽만' },
  'Cramps': { en: 'Cramps', ru: 'Спазмы', tr: 'Kramplar', fr: 'Crampes', es: 'Cólicos', it: 'Crampi', ko: '경련' },
  'Back pain': { en: 'Back pain', ru: 'Боль в спине', tr: 'Sırt ağrısı', fr: 'Mal de dos', es: 'Dolor de espalda', it: 'Mal di schiena', ko: '허리 통증' },
  'Insomnia': { en: 'Insomnia', ru: 'Бессонница', tr: 'Uykusuzluk', fr: 'Insomnie', es: 'Insomnio', it: 'Insonnia', ko: '불면증' },
  'Mood changes': { en: 'Mood changes', ru: 'Перепады настроения', tr: 'Ruh hâli değişimleri', fr: "Changements d'humeur", es: 'Cambios de humor', it: 'Sbalzi d’umore', ko: '기분 변화' },
  'Mood swings': { en: 'Mood swings', ru: 'Перепады настроения', tr: 'Ruh hâli dalgalanmaları', fr: "Sautes d'humeur", es: 'Cambios de humor', it: 'Sbalzi d’umore', ko: '감정 기복' },
  'Breast tenderness': { en: 'Breast tenderness', ru: 'Болезненность груди', tr: 'Göğüs hassasiyeti', fr: 'Sensibilité des seins', es: 'Sensibilidad en los senos', it: 'Tensione al seno', ko: '유방 압통' },
  'Hot flashes': { en: 'Hot flashes', ru: 'Приливы', tr: 'Sıcak basması', fr: 'Bouffées de chaleur', es: 'Sofocos', it: 'Vampate di calore', ko: '안면 홍조' },
  'Pelvic cramping': { en: 'Pelvic cramping', ru: 'Тазовые спазмы', tr: 'Pelvik kramp', fr: 'Crampes pelviennes', es: 'Cólicos pélvicos', it: 'Crampi pelvici', ko: '골반 경련' },
  'Acne / skin breakouts': { en: 'Acne / skin breakouts', ru: 'Акне / высыпания', tr: 'Akne / cilt döküntüleri', fr: "Acné / éruptions cutanées", es: 'Acné / brotes en la piel', it: 'Acne / sfoghi cutanei', ko: '여드름 / 피부 트러블' },
  'Hair loss (scalp)': { en: 'Hair loss (scalp)', ru: 'Выпадение волос (голова)', tr: 'Saç dökülmesi (saçlı deri)', fr: 'Chute de cheveux (cuir chevelu)', es: 'Caída del cabello (cuero cabelludo)', it: 'Perdita di capelli (cuoio capelluto)', ko: '탈모 (두피)' },
  'Excess facial/body hair': { en: 'Excess facial/body hair', ru: 'Избыточный рост волос', tr: 'Aşırı yüz/vücut kılı', fr: 'Pilosité excessive du visage/corps', es: 'Exceso de vello facial/corporal', it: 'Peluria eccessiva viso/corpo', ko: '얼굴/몸 과다 체모' },
  'Weight gain / difficulty losing weight': { en: 'Weight gain / difficulty losing weight', ru: 'Набор веса / трудно похудеть', tr: 'Kilo alımı / kilo vermede zorluk', fr: 'Prise de poids / difficulté à en perdre', es: 'Aumento de peso / dificultad para bajar', it: 'Aumento di peso / difficoltà a dimagrire', ko: '체중 증가 / 감량 어려움' },
  'Irregular bleeding': { en: 'Irregular bleeding', ru: 'Нерегулярные кровотечения', tr: 'Düzensiz kanama', fr: 'Saignements irréguliers', es: 'Sangrado irregular', it: 'Sanguinamento irregolare', ko: '불규칙 출혈' },
  'Brain fog': { en: 'Brain fog', ru: 'Туман в голове', tr: 'Zihin bulanıklığı', fr: 'Brouillard cérébral', es: 'Niebla mental', it: 'Annebbiamento mentale', ko: '브레인 포그' },
  'Low libido': { en: 'Low libido', ru: 'Низкое либидо', tr: 'Düşük libido', fr: 'Baisse de libido', es: 'Libido baja', it: 'Libido bassa', ko: '성욕 저하' },
  'Insulin resistance symptoms': { en: 'Insulin resistance symptoms', ru: 'Симптомы инсулинорезистентности', tr: 'İnsülin direnci belirtileri', fr: "Signes de résistance à l'insuline", es: 'Síntomas de resistencia a la insulina', it: 'Sintomi di insulino-resistenza', ko: '인슐린 저항성 증상' },
  'Dark skin patches': { en: 'Dark skin patches', ru: 'Тёмные пятна на коже', tr: 'Koyu cilt lekeleri', fr: 'Taches cutanées foncées', es: 'Manchas oscuras en la piel', it: 'Macchie scure sulla pelle', ko: '피부 착색' },
  'Deep pelvic pain': { en: 'Deep pelvic pain', ru: 'Глубокая тазовая боль', tr: 'Derin pelvik ağrı', fr: 'Douleur pelvienne profonde', es: 'Dolor pélvico profundo', it: 'Dolore pelvico profondo', ko: '깊은 골반 통증' },
  'Bladder pressure / pain': { en: 'Bladder pressure / pain', ru: 'Давление / боль в мочевом пузыре', tr: 'Mesane basıncı / ağrısı', fr: 'Pression / douleur vésicale', es: 'Presión / dolor en la vejiga', it: 'Pressione / dolore alla vescica', ko: '방광 압박 / 통증' },
  'Bowel pain / cramping': { en: 'Bowel pain / cramping', ru: 'Боль / спазмы в кишечнике', tr: 'Bağırsak ağrısı / kramp', fr: 'Douleur / crampes intestinales', es: 'Dolor / cólicos intestinales', it: 'Dolore / crampi intestinali', ko: '장 통증 / 경련' },
  'Pain with sex (dyspareunia)': { en: 'Pain with sex (dyspareunia)', ru: 'Боль при близости (диспареуния)', tr: 'Cinsel ilişkide ağrı (disparoni)', fr: 'Douleur pendant les rapports (dyspareunie)', es: 'Dolor en las relaciones (dispareunia)', it: 'Dolore durante i rapporti (dispareunia)', ko: '성교통 (성교통증)' },
  'Lower back pain': { en: 'Lower back pain', ru: 'Боль в пояснице', tr: 'Bel ağrısı', fr: 'Douleur lombaire', es: 'Dolor lumbar', it: 'Dolore lombare', ko: '허리 아래 통증' },
  'Leg pain / sciatica': { en: 'Leg pain / sciatica', ru: 'Боль в ноге / ишиас', tr: 'Bacak ağrısı / siyatik', fr: 'Douleur à la jambe / sciatique', es: 'Dolor de pierna / ciática', it: 'Dolore alla gamba / sciatica', ko: '다리 통증 / 좌골신경통' },
  'Shoulder/diaphragm pain': { en: 'Shoulder/diaphragm pain', ru: 'Боль в плече/диафрагме', tr: 'Omuz/diyafram ağrısı', fr: 'Douleur épaule/diaphragme', es: 'Dolor de hombro/diafragma', it: 'Dolore spalla/diaframma', ko: '어깨/횡격막 통증' },
  'Heavy bleeding': { en: 'Heavy bleeding', ru: 'Обильные кровотечения', tr: 'Yoğun kanama', fr: 'Saignements abondants', es: 'Sangrado abundante', it: 'Sanguinamento abbondante', ko: '과다 출혈' },
  'Clotting': { en: 'Clotting', ru: 'Сгустки', tr: 'Pıhtılaşma', fr: 'Caillots', es: 'Coágulos', it: 'Coaguli', ko: '혈전 (덩어리)' },
  'Bloating ("endo belly")': { en: 'Bloating ("endo belly")', ru: 'Вздутие («эндо-живот»)', tr: 'Şişkinlik ("endo göbeği")', fr: 'Ballonnements (« ventre endo »)', es: 'Hinchazón («vientre endo»)', it: 'Gonfiore ("pancia endo")', ko: '복부 팽만 ("엔도 벨리")' },
  'Painful bowel movements': { en: 'Painful bowel movements', ru: 'Болезненная дефекация', tr: 'Ağrılı bağırsak hareketleri', fr: 'Selles douloureuses', es: 'Evacuaciones dolorosas', it: 'Evacuazioni dolorose', ko: '배변 시 통증' },
  'Urinary urgency / frequency': { en: 'Urinary urgency / frequency', ru: 'Учащённое / срочное мочеиспускание', tr: 'İdrar sıkışması / sıklığı', fr: 'Urgence / fréquence urinaire', es: 'Urgencia / frecuencia urinaria', it: 'Urgenza / frequenza urinaria', ko: '요절박 / 빈뇨' },
  'Spotting between periods': { en: 'Spotting between periods', ru: 'Мажущие выделения между циклами', tr: 'Regl arası lekelenme', fr: 'Saignements entre les règles', es: 'Manchado entre reglas', it: 'Perdite tra un ciclo e l’altro', ko: '생리 사이 출혈' },
  'Severe irritability': { en: 'Severe irritability', ru: 'Сильная раздражительность', tr: 'Şiddetli sinirlilik', fr: 'Irritabilité sévère', es: 'Irritabilidad intensa', it: 'Forte irritabilità', ko: '심한 짜증' },
  'Anxiety / tension': { en: 'Anxiety / tension', ru: 'Тревога / напряжение', tr: 'Kaygı / gerginlik', fr: 'Anxiété / tension', es: 'Ansiedad / tensión', it: 'Ansia / tensione', ko: '불안 / 긴장' },
  'Depressed mood': { en: 'Depressed mood', ru: 'Подавленное настроение', tr: 'Depresif ruh hâli', fr: 'Humeur dépressive', es: 'Estado de ánimo deprimido', it: 'Umore depresso', ko: '우울한 기분' },
  'Hopelessness': { en: 'Hopelessness', ru: 'Безнадёжность', tr: 'Umutsuzluk', fr: 'Désespoir', es: 'Desesperanza', it: 'Disperazione', ko: '절망감' },
  'Rage / anger outbursts': { en: 'Rage / anger outbursts', ru: 'Вспышки гнева', tr: 'Öfke patlamaları', fr: 'Accès de colère', es: 'Estallidos de ira', it: 'Scoppi di rabbia', ko: '분노 폭발' },
  'Crying spells': { en: 'Crying spells', ru: 'Приступы плача', tr: 'Ağlama nöbetleri', fr: 'Crises de larmes', es: 'Episodios de llanto', it: 'Crisi di pianto', ko: '갑작스러운 울음' },
  'Social withdrawal': { en: 'Social withdrawal', ru: 'Социальная замкнутость', tr: 'Sosyal geri çekilme', fr: 'Retrait social', es: 'Aislamiento social', it: 'Ritiro sociale', ko: '사회적 위축' },
  'Difficulty concentrating': { en: 'Difficulty concentrating', ru: 'Трудности с концентрацией', tr: 'Konsantrasyon güçlüğü', fr: 'Difficulté à se concentrer', es: 'Dificultad para concentrarse', it: 'Difficoltà di concentrazione', ko: '집중 곤란' },
  'Hypersomnia': { en: 'Hypersomnia', ru: 'Гиперсомния', tr: 'Aşırı uyku', fr: 'Hypersomnie', es: 'Hipersomnia', it: 'Ipersonnia', ko: '과다 수면' },
  'Food cravings / binge eating': { en: 'Food cravings / binge eating', ru: 'Тяга к еде / переедание', tr: 'Yeme isteği / tıkınırcasına yeme', fr: 'Fringales / hyperphagie', es: 'Antojos / atracones', it: 'Voglie / abbuffate', ko: '식욕 폭발 / 폭식' },
  'Joint/muscle pain': { en: 'Joint/muscle pain', ru: 'Боль в суставах/мышцах', tr: 'Eklem/kas ağrısı', fr: 'Douleurs articulaires/musculaires', es: 'Dolor articular/muscular', it: 'Dolori articolari/muscolari', ko: '관절/근육 통증' },

  // ── Body locations ──────────────────────────────────────────────────────────
  'Lower abdomen / pelvis': { en: 'Lower abdomen / pelvis', ru: 'Низ живота / таз', tr: 'Alt karın / pelvis', fr: 'Bas-ventre / pelvis', es: 'Bajo vientre / pelvis', it: 'Basso ventre / pelvi', ko: '아랫배 / 골반' },
  'Lower back': { en: 'Lower back', ru: 'Поясница', tr: 'Bel', fr: 'Bas du dos', es: 'Zona lumbar', it: 'Zona lombare', ko: '허리 아래' },
  'Upper abdomen': { en: 'Upper abdomen', ru: 'Верх живота', tr: 'Üst karın', fr: 'Haut du ventre', es: 'Abdomen superior', it: 'Addome superiore', ko: '윗배' },
  'Chest': { en: 'Chest', ru: 'Грудь', tr: 'Göğüs', fr: 'Poitrine', es: 'Pecho', it: 'Petto', ko: '가슴' },
  'Shoulders': { en: 'Shoulders', ru: 'Плечи', tr: 'Omuzlar', fr: 'Épaules', es: 'Hombros', it: 'Spalle', ko: '어깨' },
  'Legs / thighs': { en: 'Legs / thighs', ru: 'Ноги / бёдра', tr: 'Bacaklar / uyluklar', fr: 'Jambes / cuisses', es: 'Piernas / muslos', it: 'Gambe / cosce', ko: '다리 / 허벅지' },
  'Whole body': { en: 'Whole body', ru: 'Всё тело', tr: 'Tüm vücut', fr: 'Tout le corps', es: 'Todo el cuerpo', it: 'Tutto il corpo', ko: '전신' },
  'Head': { en: 'Head', ru: 'Голова', tr: 'Baş', fr: 'Tête', es: 'Cabeza', it: 'Testa', ko: '머리' },
  'Bladder': { en: 'Bladder', ru: 'Мочевой пузырь', tr: 'Mesane', fr: 'Vessie', es: 'Vejiga', it: 'Vescica', ko: '방광' },
  'Bowel': { en: 'Bowel', ru: 'Кишечник', tr: 'Bağırsak', fr: 'Intestin', es: 'Intestino', it: 'Intestino', ko: '장' },

  // ── Menopause symptoms ──────────────────────────────────────────────────────
  'Night sweats': { en: 'Night sweats', ru: 'Ночная потливость', tr: 'Gece terlemeleri', fr: 'Sueurs nocturnes', es: 'Sudores nocturnos', it: 'Sudorazioni notturne', ko: '야간 발한' },
  'Chills': { en: 'Chills', ru: 'Озноб', tr: 'Üşüme', fr: 'Frissons', es: 'Escalofríos', it: 'Brividi', ko: '오한' },
  'Palpitations': { en: 'Palpitations', ru: 'Сердцебиение', tr: 'Çarpıntı', fr: 'Palpitations', es: 'Palpitaciones', it: 'Palpitazioni', ko: '심계항진' },
  'Restless legs': { en: 'Restless legs', ru: 'Синдром беспокойных ног', tr: 'Huzursuz bacaklar', fr: 'Jambes sans repos', es: 'Piernas inquietas', it: 'Gambe senza riposo', ko: '하지불안' },
  'Anxiety': { en: 'Anxiety', ru: 'Тревожность', tr: 'Kaygı', fr: 'Anxiété', es: 'Ansiedad', it: 'Ansia', ko: '불안' },
  'Low mood': { en: 'Low mood', ru: 'Подавленное настроение', tr: 'Düşük ruh hâli', fr: 'Humeur basse', es: 'Ánimo bajo', it: 'Umore basso', ko: '우울감' },
  'Memory issues': { en: 'Memory issues', ru: 'Проблемы с памятью', tr: 'Hafıza sorunları', fr: 'Troubles de la mémoire', es: 'Problemas de memoria', it: 'Problemi di memoria', ko: '기억력 문제' },
  'Irritability': { en: 'Irritability', ru: 'Раздражительность', tr: 'Sinirlilik', fr: 'Irritabilité', es: 'Irritabilidad', it: 'Irritabilità', ko: '짜증' },
  'Joint pain': { en: 'Joint pain', ru: 'Боль в суставах', tr: 'Eklem ağrısı', fr: 'Douleurs articulaires', es: 'Dolor articular', it: 'Dolori articolari', ko: '관절 통증' },
  'Headaches': { en: 'Headaches', ru: 'Головные боли', tr: 'Baş ağrıları', fr: 'Maux de tête', es: 'Dolores de cabeza', it: 'Mal di testa', ko: '두통' },
  'Hair thinning': { en: 'Hair thinning', ru: 'Истончение волос', tr: 'Saç incelmesi', fr: 'Cheveux clairsemés', es: 'Cabello más fino', it: 'Diradamento dei capelli', ko: '모발 가늘어짐' },
  'Weight gain': { en: 'Weight gain', ru: 'Набор веса', tr: 'Kilo alımı', fr: 'Prise de poids', es: 'Aumento de peso', it: 'Aumento di peso', ko: '체중 증가' },
  'Dry skin': { en: 'Dry skin', ru: 'Сухость кожи', tr: 'Kuru cilt', fr: 'Peau sèche', es: 'Piel seca', it: 'Pelle secca', ko: '건조한 피부' },
  'Vaginal dryness': { en: 'Vaginal dryness', ru: 'Сухость влагалища', tr: 'Vajinal kuruluk', fr: 'Sécheresse vaginale', es: 'Sequedad vaginal', it: 'Secchezza vaginale', ko: '질 건조' },
  'Urinary urgency': { en: 'Urinary urgency', ru: 'Позывы к мочеиспусканию', tr: 'İdrar sıkışması', fr: 'Urgence urinaire', es: 'Urgencia urinaria', it: 'Urgenza urinaria', ko: '요절박' },
  'Frequent UTIs': { en: 'Frequent UTIs', ru: 'Частые ИМП', tr: 'Sık idrar yolu enfeksiyonu', fr: 'Infections urinaires fréquentes', es: 'ITU frecuentes', it: 'IVU frequenti', ko: '잦은 요로감염' },

  // ── Community topics ────────────────────────────────────────────────────────
  'All': { en: 'All', ru: 'Все', tr: 'Tümü', fr: 'Tous', es: 'Todos', it: 'Tutti', ko: '전체' },
  'Period & Cycle': { en: 'Period & Cycle', ru: 'Месячные и цикл', tr: 'Regl ve Döngü', fr: 'Règles et cycle', es: 'Regla y ciclo', it: 'Mestruazioni e ciclo', ko: '생리 & 주기' },
  'Endometriosis': { en: 'Endometriosis', ru: 'Эндометриоз', tr: 'Endometriozis', fr: 'Endométriose', es: 'Endometriosis', it: 'Endometriosi', ko: '자궁내막증' },
  'Treatments & Meds': { en: 'Treatments & Meds', ru: 'Лечение и лекарства', tr: 'Tedaviler ve İlaçlar', fr: 'Traitements et médicaments', es: 'Tratamientos y medicamentos', it: 'Trattamenti e farmaci', ko: '치료 & 약물' },
  'Mental Health': { en: 'Mental Health', ru: 'Психическое здоровье', tr: 'Ruh Sağlığı', fr: 'Santé mentale', es: 'Salud mental', it: 'Salute mentale', ko: '정신 건강' },
  'Diagnosis Journey': { en: 'Diagnosis Journey', ru: 'Путь к диагнозу', tr: 'Tanı Yolculuğu', fr: 'Parcours de diagnostic', es: 'Camino al diagnóstico', it: 'Percorso diagnostico', ko: '진단 여정' },
  'Relationships': { en: 'Relationships', ru: 'Отношения', tr: 'İlişkiler', fr: 'Relations', es: 'Relaciones', it: 'Relazioni', ko: '관계' },
  'Ask the Community': { en: 'Ask the Community', ru: 'Спросить сообщество', tr: 'Topluluğa Sor', fr: 'Demander à la communauté', es: 'Pregunta a la comunidad', it: 'Chiedi alla community', ko: '커뮤니티에 질문' },

  // ── Trigger categories ──────────────────────────────────────────────────────
  'Food': { en: 'Food', ru: 'Еда', tr: 'Yiyecek', fr: 'Alimentation', es: 'Comida', it: 'Alimentazione', ko: '음식' },
  'Stress': { en: 'Stress', ru: 'Стресс', tr: 'Stres', fr: 'Stress', es: 'Estrés', it: 'Stress', ko: '스트레스' },
  'Activity': { en: 'Activity', ru: 'Активность', tr: 'Aktivite', fr: 'Activité', es: 'Actividad', it: 'Attività', ko: '활동' },
  'Environment': { en: 'Environment', ru: 'Окружение', tr: 'Çevre', fr: 'Environnement', es: 'Entorno', it: 'Ambiente', ko: '환경' },
  'Cycle': { en: 'Cycle', ru: 'Цикл', tr: 'Döngü', fr: 'Cycle', es: 'Ciclo', it: 'Ciclo', ko: '주기' },

  // ── Menopause stages & symptom groups ───────────────────────────────────────
  'Perimenopause': { en: 'Perimenopause', ru: 'Перименопауза', tr: 'Perimenopoz', fr: 'Périménopause', es: 'Perimenopausia', it: 'Perimenopausa', ko: '폐경 전후기' },
  'Menopause': { en: 'Menopause', ru: 'Менопауза', tr: 'Menopoz', fr: 'Ménopause', es: 'Menopausia', it: 'Menopausa', ko: '갱년기' },
  'Post-menopause': { en: 'Post-menopause', ru: 'Постменопауза', tr: 'Postmenopoz', fr: 'Post-ménopause', es: 'Posmenopausia', it: 'Post-menopausa', ko: '폐경 후기' },
  'Early / Surgical': { en: 'Early / Surgical', ru: 'Ранняя / хирургическая', tr: 'Erken / Cerrahi', fr: 'Précoce / chirurgicale', es: 'Precoz / quirúrgica', it: 'Precoce / chirurgica', ko: '조기 / 수술적' },
  'Vasomotor': { en: 'Vasomotor', ru: 'Вазомоторные', tr: 'Vazomotor', fr: 'Vasomoteur', es: 'Vasomotor', it: 'Vasomotori', ko: '혈관운동' },
  'Sleep & Energy': { en: 'Sleep & Energy', ru: 'Сон и энергия', tr: 'Uyku ve Enerji', fr: 'Sommeil et énergie', es: 'Sueño y energía', it: 'Sonno ed energia', ko: '수면 & 에너지' },
  'Mood & Mind': { en: 'Mood & Mind', ru: 'Настроение и разум', tr: 'Ruh Hâli ve Zihin', fr: 'Humeur et esprit', es: 'Ánimo y mente', it: 'Umore e mente', ko: '기분 & 정신' },
  'Physical': { en: 'Physical', ru: 'Физические', tr: 'Fiziksel', fr: 'Physique', es: 'Físico', it: 'Fisici', ko: '신체' },
  'Urogenital': { en: 'Urogenital', ru: 'Урогенитальные', tr: 'Ürogenital', fr: 'Uro-génital', es: 'Urogenital', it: 'Urogenitali', ko: '비뇨생식' },
};

/** Translate a stored medical term for display; falls back to the original. */
export function trTerm(term: string, lang: Lang): string {
  return TERMS[term]?.[lang] ?? term;
}
