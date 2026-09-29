const SERVER_URL = 'http://127.0.0.1:3000';

const statusIndicator = document.getElementById('statusIndicator');
const serverStatusText = document.getElementById('serverStatusText');
const predictBtn = document.getElementById('predictBtn');
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panelTitle');
const panelBody = document.getElementById('panelBody');
const loadingOverlay = document.getElementById('loadingOverlay');

const validationRanges = {
    pregnancies:      { min: 0,     max: 17 },
    glucose:          { min: 20,    max: 300 },
    bloodPressure:    { min: 30,    max: 150 },
    skinThickness:    { min: 7,     max: 99 },
    insulin:          { min: 0,     max: 846 },
    bmi:              { min: 10,    max: 67.1 },
    diabetesPedigree: { min: 0.078, max: 2.42 },
    age:              { min: 21,    max: 81 }
};

const PANEL_TITLES = {
    'success': 'Успешно',
    'error':   'Ошибка',
    'warning': 'Внимание',
    'info':    'Информация'
};

function openPanel(title) {
    panelTitle.textContent = title;
    if (!panel.classList.contains('open')) {
        panel.classList.add('open');
    }
}

function closePanel() {
    panel.classList.remove('open');
    setTimeout(() => {
        if (!panel.classList.contains('open')) {
            panelBody.innerHTML = '';
        }
    }, 300);
}

function showMessage(type, html) {
    openPanel(PANEL_TITLES[type] || 'Сообщение');
    panelBody.innerHTML = `<div class="status-message status-${type}">${html}</div>`;
}

async function checkServerStatus() {
    try {
        const response = await fetch(`${SERVER_URL}/status`);
        if (response.ok) {
            statusIndicator.className = 'status-indicator status-online';
            serverStatusText.textContent = 'Сервер подключён';
            predictBtn.disabled = false;
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator status-offline';
        serverStatusText.textContent = 'Сервер недоступен';
        predictBtn.disabled = true;
    }
}

async function getModelInfo() {
    try {
        const response = await fetch(`${SERVER_URL}/model_info`);
        if (!response.ok) throw new Error('Не удалось получить данные');
        const data = await response.json();
        displayModelInfo(data);
    } catch (error) {
        showMessage('error', `Не удалось получить информацию о модели: ${error.message}`);
    }
}

function displayModelInfo(data) {
    if (data.error) {
        showMessage('error', data.error);
        return;
    }

    const accuracy = data.accuracy
        ? (data.accuracy * 100).toFixed(2) + '%'
        : '—';

    const featuresHtml = Array.isArray(data.features) && data.features.length
        ? `<div class="features-grid">${data.features.map(f => `<span>${f}</span>`).join('')}</div>`
        : '—';

    const hyperHtml = data.hyperparameters
        ? `<div class="hyperparams-grid">${Object.entries(data.hyperparameters)
            .filter(([_, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `<span>${k}: ${v}</span>`).join('')}</div>`
        : '—';

    const pipelineTags = Array.isArray(data.pipeline_steps)
        ? data.pipeline_steps.map(s => `<span class="tag">${s}</span>`).join('')
        : '—';

    const prepTags = Array.isArray(data.preprocessor_steps)
        ? data.preprocessor_steps.map(s => `<span class="tag">${s}</span>`).join('')
        : '—';

    const m = data.metrics || {};
    const metricsHtml = Object.keys(m).length
        ? `
            <div class="metrics-list">
                <div class="metric-row"><span class="metric-name">Accuracy</span><span class="metric-value">${(m.accuracy * 100).toFixed(2)}%</span></div>
                <div class="metric-row"><span class="metric-name">Precision</span><span class="metric-value">${(m.precision * 100).toFixed(2)}%</span></div>
                <div class="metric-row"><span class="metric-name">Recall</span><span class="metric-value">${(m.recall * 100).toFixed(2)}%</span></div>
                <div class="metric-row"><span class="metric-name">F1-score</span><span class="metric-value">${(m.f1_score * 100).toFixed(2)}%</span></div>
            </div>
        `
        : '';

    openPanel('Информация о модели');
    panelBody.innerHTML = `
        <div class="info-block">
            <div class="info-section">
                <h4>Общие сведения</h4>
                <p><strong>Название:</strong> ${data.name || 'diabetes prediction pipeline'}</p>
                <p><strong>Автор:</strong> ${data.author || 'kovpik'}</p>
                <p><strong>Версия:</strong> ${data.version || '1.0.0'}</p>
                <p><strong>Классификатор:</strong> ${data.classifier || 'CatBoostClassifier'}</p>
                <p><strong>Точность:</strong> ${accuracy}</p>
            </div>

            <div class="info-section">
                <h4>Данные</h4>
                <p><strong>Датасет:</strong> ${data.dataset || 'diabetes.csv'}</p>
                <p><strong>Целевая переменная:</strong> ${data.target_column || 'Outcome'}</p>
                <p><strong>Признаков:</strong> ${data.n_features || 0}</p>
                ${featuresHtml}
            </div>

            <div class="info-section">
                <h4>Структура пайплайна</h4>
                <p><strong>Этапы:</strong></p>
                <div class="tags">${pipelineTags}</div>
                <p style="margin-top:8px"><strong>Препроцессор:</strong></p>
                <div class="tags">${prepTags}</div>
            </div>

            <div class="info-section">
                <h4>Гиперпараметры</h4>
                ${hyperHtml}
            </div>

            ${metricsHtml ? `<div class="info-section"><h4>Метрики на тесте</h4>${metricsHtml}</div>` : ''}
        </div>
    `;
}

function loadFromJSON() {
    const fileInput = document.getElementById('jsonFile');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            fillFormWithData(jsonData);
            showMessage('success', `Данные из файла <strong>${file.name}</strong> успешно загружены`);
        } catch (error) {
            showMessage('error', `Ошибка при чтении JSON: ${error.message}`);
        }
    };
    reader.readAsText(file);
    fileInput.value = '';
}

function fillFormWithData(data) {
    document.getElementById('pregnancies').value = data.Pregnancies ?? '';
    document.getElementById('glucose').value = data.Glucose ?? '';
    document.getElementById('bloodPressure').value = data.BloodPressure ?? '';
    document.getElementById('skinThickness').value = data.SkinThickness ?? '';
    document.getElementById('insulin').value = data.Insulin ?? '';
    document.getElementById('bmi').value = data.BMI ?? '';
    document.getElementById('diabetesPedigree').value = data.DiabetesPedigreeFunction ?? '';
    document.getElementById('age').value = data.Age ?? '';
}

function clearForm() {
    document.getElementById('patientForm').reset();
    clearValidationErrors();
    closePanel();
}

function clearValidationErrors() {
    document.querySelectorAll('.validation-message').forEach(m => m.style.display = 'none');
    document.querySelectorAll('input').forEach(i => i.classList.remove('invalid'));
}

function showValidationError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (!input || !errorElement) return;
    input.classList.add('invalid');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideValidationError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (!input || !errorElement) return;
    input.classList.remove('invalid');
    errorElement.style.display = 'none';
}

function validateFormData(formData) {
    let isValid = true;
    clearValidationErrors();

    for (const [key, value] of Object.entries(formData)) {
        if (value === '' || isNaN(value)) {
            showValidationError(key.toLowerCase(), 'Поле должно содержать число');
            isValid = false;
        }
    }

    const checks = [
        ['Pregnancies', 'pregnancies', ''],
        ['Glucose', 'glucose', ' mg/dL'],
        ['BloodPressure', 'bloodPressure', ' mm Hg'],
        ['SkinThickness', 'skinThickness', ' mm'],
        ['Insulin', 'insulin', ' mu U/ml'],
        ['BMI', 'bmi', ''],
        ['DiabetesPedigreeFunction', 'diabetesPedigree', ''],
        ['Age', 'age', ' лет']
    ];

    for (const [field, id, suffix] of checks) {
        const range = validationRanges[id];
        if (formData[field] < range.min || formData[field] > range.max) {
            showValidationError(id, `Допустимо: ${range.min}–${range.max}${suffix}`);
            isValid = false;
        }
    }

    return isValid;
}

function displayResults(data) {
    const hasDiabetes = data.Result === 1;

    const diagnosisText = hasDiabetes
        ? 'ЕСТЬ РИСК РАЗВИТИЯ ДИАБЕТА'
        : 'НЕТ РИСКА РАЗВИТИЯ ДИАБЕТА';

    let probabilityHtml = '';
    if (Array.isArray(data.Probability) && data.Probability.length >= 2) {
        const probDiabetes = data.Probability[1] * 100;
        const probNoDiabetes = data.Probability[0] * 100;
        probabilityHtml = `
            <div class="probability-block">
                <div class="probability-title">Вероятность диабета</div>
                <div class="probability-value">${probDiabetes.toFixed(1)}%</div>
                <div class="probability-bar">
                    <div class="probability-fill" style="width: ${probDiabetes}%"></div>
                </div>
                <div class="probability-labels">
                    <span>Низкий риск: ${probNoDiabetes.toFixed(1)}%</span>
                    <span>Высокий риск: ${probDiabetes.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }

    openPanel('Результат анализа');
    panelBody.innerHTML = `
        <div class="result-block">
            <div class="diagnosis-badge ${hasDiabetes ? 'diabetes' : 'no-diabetes'}">
                ${diagnosisText}
            </div>
            ${probabilityHtml}
            <div class="risk-block">
                <div class="risk-value">${hasDiabetes ? 'Высокий' : 'Низкий'}</div>
                <div class="risk-label">Уровень риска</div>
            </div>
        </div>
    `;
}

async function predictDiabetes() {
    const formData = {
        Pregnancies: parseInt(document.getElementById('pregnancies').value) || 0,
        Glucose: parseFloat(document.getElementById('glucose').value) || 0,
        BloodPressure: parseFloat(document.getElementById('bloodPressure').value) || 0,
        SkinThickness: parseFloat(document.getElementById('skinThickness').value) || 0,
        Insulin: parseFloat(document.getElementById('insulin').value) || 0,
        BMI: parseFloat(document.getElementById('bmi').value) || 0,
        DiabetesPedigreeFunction: parseFloat(document.getElementById('diabetesPedigree').value) || 0,
        Age: parseInt(document.getElementById('age').value) || 0
    };

    if (!validateFormData(formData)) {
        showMessage('error', 'Пожалуйста, исправьте ошибки в форме.');
        return;
    }

    loadingOverlay.classList.add('show');

    try {
        const response = await fetch(`${SERVER_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Error:', error);
        showMessage('error', `Ошибка при подключении к серверу: ${error.message}`);
    } finally {
        loadingOverlay.classList.remove('show');
    }
}

function setupInputValidation() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value === '') return;
            const value = parseFloat(this.value);
            if (isNaN(value)) {
                showValidationError(this.id, 'Поле должно содержать число');
            } else {
                hideValidationError(this.id);
            }
        });

        input.addEventListener('input', function() {
            hideValidationError(this.id);
        });
    });
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    ['dragover', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            e.preventDefault();
        });
    });

    document.addEventListener('dragleave', (e) => {
        if (e.relatedTarget === null) {
            dropZone.classList.remove('drag-over');
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.name.endsWith('.json')) {
            showMessage('error', 'Можно загружать только файлы .json');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                fillFormWithData(jsonData);
                showMessage('success', `Данные из файла <strong>${file.name}</strong> успешно загружены`);
            } catch (error) {
                showMessage('error', `Ошибка при чтении JSON: ${error.message}`);
            }
        };
        reader.onerror = () => {
            showMessage('error', 'Не удалось прочитать файл');
        };
        reader.readAsText(file);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    checkServerStatus();
    setupInputValidation();
    setupDragAndDrop();
    setInterval(checkServerStatus, 30000);
});