import numpy as np
import pandas as pd
import dill
import os

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, FunctionTransformer
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score
)
from catboost import CatBoostClassifier


def handle_diabetes_data(df):
    data = df.copy()
    columns_with_zeros = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for column in columns_with_zeros:
        data[column] = data[column].replace(0, np.nan)
    return data


def main():
    df = pd.read_csv('diabetes.csv')
    X = df.drop(['Outcome'], axis=1)
    y = df['Outcome']

    numerical_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    numerical_transformer = Pipeline(steps=[
        ('data_cleaner', FunctionTransformer(handle_diabetes_data)),
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    preprocessor = ColumnTransformer(transformers=[
        ('numerical', numerical_transformer, numerical_features)
    ])

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', CatBoostClassifier(
            iterations=300,
            learning_rate=0.05,
            depth=6,
            random_state=42,
            verbose=False
        ))
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)

    train_acc = pipeline.score(X_train, y_train)
    test_acc  = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall    = recall_score(y_test, y_pred)
    f1        = f1_score(y_test, y_pred)

    print(f"Accuracy : {test_acc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1-score : {f1:.4f}")

    with open('diabetes_pipeline.pkl', 'wb') as file:
        dill.dump({
            'model': pipeline,
            'metadata': {
                'name': 'diabetes prediction pipeline',
                'author': 'kovpik',
                'accuracy': float(test_acc),
                'train_accuracy': float(train_acc),
                'dataset': 'diabetes.csv',
                'target_column': 'Outcome',
                'features': numerical_features,
                'version': '1.0.0',
                'metrics': {
                    'accuracy':  float(test_acc),
                    'precision': float(precision),
                    'recall':    float(recall),
                    'f1_score':  float(f1)
                }
            }
        }, file)

    print("Модель сохранена: diabetes_pipe.pkl")


if __name__ == '__main__':
    main()