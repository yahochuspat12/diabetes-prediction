import dill
import pandas as pd
import json
import os
import numpy as np

def main():
    with open('diabetes_pipeline.pkl', 'rb') as file:
        model = dill.load(file)

    print(model['metadata'])

    json_files = ['form_diabetes_1.json', 'form_diabetes_2.json']

    for i, json_file in enumerate(json_files, 1):
        if not os.path.exists(json_file):
            print(f"\nФайл {json_file} не найден!")
            continue

        with open(json_file, encoding='utf-8') as fin:
            data = json.load(fin)
            df = pd.DataFrame.from_dict([data])

        prediction = model['model'].predict(df)[0]
        probability = model['model'].predict_proba(df)[0]

        print(f"\n=== Пациент {i} ===")
        print(f"Предсказание: {prediction}")
        print(f"Вероятности: [Нет риска: {probability[0]:.3f}, Есть риск: {probability[1]:.3f}]")

        if prediction == 1:
            print("Результат: Есть риск развития диабета")
        else:
            print("Результат: Нет риска развития диабета")


if __name__ == '__main__':
    main()