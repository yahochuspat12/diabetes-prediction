# Диагностика диабета

Веб-приложение для прогнозирования риска развития сахарного диабета на основе методов машинного обучения.

## О проекте

Система анализирует 8 медицинских показателей и выдаёт оценку вероятности развития диабета у женщин. Использует модель градиентного бустинга **CatBoost**, обученную на датасете **Pima Indians Diabetes**.

## Стек технологий

**Машинное обучение:**
- Python 3.10+
- CatBoost
- scikit-learn
- imbalanced-learn
- pandas, numpy

**Backend:**
- FastAPI
- Uvicorn
- Pydantic

**Frontend:**
- HTML5
- CSS3
- JavaScript (Vanilla)

**Сериализация модели:**
- dill

## Структура проекта

```
loan serves/
├── diabetes.csv
├── pipeline.py
├── main.py
├── Server.py
├── index.html
├── style.css
├── script.js
├── form_diabetes_1.json
├── form_diabetes_2.json
├── requirements.txt
└── README.md
```

## Установка

```bash
git clone https://github.com/ваш-username/diabetes-prediction.git
cd diabetes-prediction
pip install -r requirements.txt
```

## Запуск

### 1. Обучение модели

```bash
python pipeline.py
```

Создаёт `diabetes_pipe.pkl` с обученной моделью.

### 2. Проверка модели

```bash
python main.py
```

### 3. Запуск сервера

```bash
python Server.py
```

Сервер запустится на `http://127.0.0.1:3000`.

### 4. Открытие интерфейса

Откройте `index.html` через **Live Server** VS Code.

## API

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/status` | Проверка статуса сервера |
| GET | `/version` | Краткая информация о модели |
| GET | `/model_info` | Расширенная информация о модели |
| POST | `/predict` | Предсказание риска диабета |

### Пример запроса `/predict`

```json
{
    "Pregnancies": 6,
    "Glucose": 148,
    "BloodPressure": 72,
    "SkinThickness": 35,
    "Insulin": 0,
    "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.627,
    "Age": 50
}
```

### Пример ответа

```json
{
    "Patient_ID": "diabetes_patient",
    "Result": 1,
    "Probability": [0.065, 0.935]
}
```

## Метрики модели

| Метрика | Значение |
|---|---|
| Accuracy | 0.71 |
| Precision | 0.58 |
| Recall | 0.69 |
| F1-score | 0.63 |

## Признаки

| Признак | Описание |
|---|---|
| `Pregnancies` | Количество беременностей |
| `Glucose` | Уровень глюкозы в плазме (mg/dL) |
| `BloodPressure` | Артериальное давление (mm Hg) |
| `SkinThickness` | Толщина кожной складки трицепса (mm) |
| `Insulin` | Уровень инсулина (mu U/ml) |
| `BMI` | Индекс массы тела |
| `DiabetesPedigreeFunction` | Наследственная предрасположенность |
| `Age` | Возраст |

## Возможности интерфейса

- Ввод 8 медицинских показателей вручную
- Загрузка данных пациента из JSON-файла
- Перетаскивание JSON-файла прямо на форму (Drag & Drop)
- Валидация введённых значений
- Просмотр информации о модели
- Визуализация вероятности заболевания

## Автор

**Ковпик**

## Лицензия

Учебный проект.