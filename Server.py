from fastapi import FastAPI
import dill
import numpy as np
import uvicorn
from pydantic import BaseModel
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open('diabetes_pipeline.pkl', 'rb') as file:
    model = dill.load(file)


@app.get('/status')
def status():
    return "сервис работает"


@app.get('/version')
def version():
    return model['metadata']


@app.get('/model_info')
def model_info():
    meta = model['metadata']

    classifier = model['model'].named_steps['classifier']
    params = classifier.get_params()

    hyperparams = {
        'iterations':    params.get('iterations'),
        'learning_rate': params.get('learning_rate'),
        'depth':         params.get('depth'),
        'random_state':  params.get('random_state'),
        'loss_function': params.get('loss_function'),
        'verbose':       params.get('verbose')
    }

    pipeline_steps = list(model['model'].named_steps.keys())

    preprocessor = model['model'].named_steps['preprocessor']
    numerical_pipe = preprocessor.transformers[0][1]
    preprocessor_steps = list(numerical_pipe.named_steps.keys())

    return {
        'name':               meta.get('name', 'diabetes prediction pipeline'),
        'author':             meta.get('author', 'kovpik'),
        'version':            meta.get('version', '1.0.0'),
        'accuracy':           meta.get('accuracy'),
        'train_accuracy':     meta.get('train_accuracy'),
        'metrics':            meta.get('metrics', {}),
        'dataset':            meta.get('dataset', 'diabetes.csv'),
        'target_column':      meta.get('target_column', 'Outcome'),
        'features':           meta.get('features', []),
        'n_features':         len(meta.get('features', [])),
        'pipeline_steps':     pipeline_steps,
        'preprocessor_steps': preprocessor_steps,
        'classifier':         'CatBoostClassifier',
        'hyperparameters':    hyperparams
    }


class Form(BaseModel):
    Pregnancies: int
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigreeFunction: float
    Age: int


class Prediction(BaseModel):
    Patient_ID: str
    Result: int


@app.post('/predict')
def predict(form: Form):
    df = pd.DataFrame.from_dict([form.dict()])
    y = model['model'].predict(df)
    proba = model['model'].predict_proba(df)[0].tolist()
    return {'Patient_ID': 'diabetes_patient',
            'Result': int(y[0]),
            'Probability': proba}


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=3000)