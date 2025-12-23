// Global variables
let mfChart = null;
let performanceChart = null;
let ruleChart = null;
let radarChart = null;
let mfData = null;
let advancedMFChart = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Air Quality System...");
    console.log("System URL:", window.location.origin);
    
    // Initialize sliders
    initializeSliders();
    
    // Load initial data
    loadDatasetStats();
    loadMembershipFunctions();
    
    // Set up event listeners
    setupEventListeners();
    
    // Test system health
    testSystemHealth();
});

// Test system health
async function testSystemHealth() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        console.log("System health check:", data);
        
        if (data.status === 'healthy') {
            console.log("✓ Backend system is healthy");
        }
    } catch (error) {
        console.error("✗ Health check failed:", error);
        alert("Warning: Cannot connect to backend server. Some features may not work.");
    }
}

// Initialize sliders
function initializeSliders() {
    const sliders = [
        { id: 'co-gt-slider', valueId: 'co-gt-value', default: 2.5, min: 0, max: 20 },
        { id: 'co-sensor-slider', valueId: 'co-sensor-value', default: 1000, min: 0, max: 2000 },
        { id: 'nmhc-gt-slider', valueId: 'nmhc-gt-value', default: 150, min: 0, max: 500 },
        { id: 'benzene-slider', valueId: 'benzene-value', default: 10, min: 0, max: 50 },
        { id: 'nmhc-sensor-slider', valueId: 'nmhc-sensor-value', default: 900, min: 0, max: 2000 },
        { id: 'nox-gt-slider', valueId: 'nox-gt-value', default: 200, min: 0, max: 500 },
        { id: 'nox-sensor-slider', valueId: 'nox-sensor-value', default: 500, min: 0, max: 2000 },
        { id: 'no2-gt-slider', valueId: 'no2-gt-value', default: 80, min: 0, max: 400 },
        { id: 'no2-sensor-slider', valueId: 'no2-sensor-value', default: 700, min: 0, max: 2000 },
        { id: 'o3-sensor-slider', valueId: 'o3-sensor-value', default: 750, min: 0, max: 3000 },
        { id: 'temp-slider', valueId: 'temp-value', default: 20.0, min: -10, max: 50 },
        { id: 'humidity-slider', valueId: 'humidity-value', default: 50.0, min: 0, max: 100 },
        { id: 'abs-humidity-slider', valueId: 'abs-humidity-value', default: 10.0, min: 0, max: 20 }
    ];
    
    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const valueEl = document.getElementById(slider.valueId);
        
        if (sliderEl && valueEl) {
            sliderEl.min = slider.min;
            sliderEl.max = slider.max;
            sliderEl.value = slider.default;
            valueEl.textContent = Number(slider.default).toFixed(slider.default % 1 !== 0 ? 1 : 0);
            
            sliderEl.addEventListener('input', function() {
                const val = parseFloat(this.value);
                valueEl.textContent = val.toFixed(this.step % 1 !== 0 ? 1 : 0);
            });
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Main buttons
    document.getElementById('assess-btn')?.addEventListener('click', assessAirQuality);
    document.getElementById('enhanced-assess-btn')?.addEventListener('click', enhancedAssessAirQuality);
    document.getElementById('calc-crisp-btn')?.addEventListener('click', calculateCrispAQI);
    document.getElementById('random-btn')?.addEventListener('click', loadRandomSample);
    document.getElementById('reset-btn')?.addEventListener('click', resetInputs);
    document.getElementById('save-crisp-settings')?.addEventListener('click', saveCrispSettings);
    document.getElementById('reset-crisp-settings')?.addEventListener('click', resetCrispSettingsToDefaults);
    
    // Visualization controls
    document.getElementById('mf-select')?.addEventListener('change', updateMFChart);
    document.getElementById('refresh-viz')?.addEventListener('click', loadMembershipFunctions);
    document.getElementById('run-comparison')?.addEventListener('click', runPerformanceComparison);
    document.getElementById('advanced-comparison-btn')?.addEventListener('click', runAdvancedComparison);
    
    // Debug buttons
    document.getElementById('test-endpoint')?.addEventListener('click', function(e) {
        e.preventDefault();
        testAssessmentEndpoint();
    });
    
    document.getElementById('debug-info')?.addEventListener('click', function(e) {
        e.preventDefault();
        showDebugInfo();
    });
    
    // Modal
    const categoryInfo = document.getElementById('category-info');
    if (categoryInfo) {
        categoryInfo.addEventListener('click', showCategoryModal);
    }
    
    document.querySelector('.close-modal')?.addEventListener('click', hideCategoryModal);
    
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) hideCategoryModal();
        });
    }
    
    // Visualization tabs
    const vizTabs = document.querySelectorAll('.viz-tab');
    vizTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const chartType = this.dataset.chart;
            switchVisualizationTab(chartType);
        });
    });
    
    // Parameter selector for membership functions
    const mfParamSelect = document.getElementById('mf-param-select');
    if (mfParamSelect) {
        mfParamSelect.addEventListener('change', function() {
            createAdvancedMFChart(this.value);
        });
    }
}

// Calculate crisp AQI locally using same logic as backend `calculate_crisp_aqi`
function calculateCrispAQI() {

    const settings = getCrispSettings();

    // Read inputs
    const co = parseFloat(document.getElementById('co-gt-slider')?.value || 2.5);
    const no2 = parseFloat(document.getElementById('no2-gt-slider')?.value || 80);
    const o3 = parseFloat(document.getElementById('o3-sensor-slider')?.value || 750);

    // Apply scoring logic using settings
    let score = 0;

    // CO contribution
    if (co < 1) score += settings.co[0];
    else if (co < 3) score += settings.co[1];
    else if (co < 5) score += settings.co[2];
    else if (co < 7) score += settings.co[3];

    // NO2 contribution
    if (no2 < 50) score += settings.no2[0];
    else if (no2 < 100) score += settings.no2[1];
    else if (no2 < 150) score += settings.no2[2];
    else if (no2 < 200) score += settings.no2[3];

    // O3 contribution
    if (o3 < 50) score += settings.o3[0];
    else if (o3 < 100) score += settings.o3[1];
    else if (o3 < 150) score += settings.o3[2];

    // Convert to AQI (0-100 scale used by calculate_crisp_aqi)
    const aqi = Math.max(0, Math.min(100, 100 - (score / 100 * 100)));

    // Category mapping same as get_category
    let category;
    if (aqi <= 25) category = 'Excellent';
    else if (aqi <= 50) category = 'Good';
    else if (aqi <= 75) category = 'Fair';
    else if (aqi <= 90) category = 'Poor';
    else category = 'Very Poor';

    displayCrispResult(aqi, category, {co, no2, o3});
}

function displayCrispResult(aqi, category, inputs = {}) {
    const resultsContent = document.getElementById('results-content');
    if (!resultsContent) return;

    const html = `
        <div class="aqi-display">
            <div class="aqi-score">
                <h3>Crisp AQI (Calculated)</h3>
                <div class="score-circle" id="aqi-circle">
                    <div class="score-value" id="aqi-value">${aqi.toFixed(1)}</div>
                    <div class="score-label">AQI</div>
                </div>
            </div>
            <div class="aqi-category">
                <h3>Category</h3>
                <div class="category-badge ${category.toLowerCase().replace(' ', '-')}" id="category-badge">
                    <span id="category-text">${category}</span>
                </div>
                <div class="category-description" id="category-description">
                    ${getCategoryDescription(category)}
                </div>
            </div>
        </div>
        <div class="membership-section">
            <h3>Inputs Used</h3>
            <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;">
                <div class="membership-card">CO: ${inputs.co}</div>
                <div class="membership-card">NO2: ${inputs.no2}</div>
                <div class="membership-card">O3: ${inputs.o3}</div>
            </div>
        </div>
    `;

    resultsContent.innerHTML = html;
    updateAQICircle(aqi);
}

// Crisp settings helpers
function getCrispSettings() {
    // Try to read from DOM inputs; fallback to defaults
    const co = [
        parseFloat(document.getElementById('crisp-co-1')?.value || 40),
        parseFloat(document.getElementById('crisp-co-3')?.value || 30),
        parseFloat(document.getElementById('crisp-co-5')?.value || 20),
        parseFloat(document.getElementById('crisp-co-7')?.value || 10)
    ];
    const no2 = [
        parseFloat(document.getElementById('crisp-no2-50')?.value || 35),
        parseFloat(document.getElementById('crisp-no2-100')?.value || 25),
        parseFloat(document.getElementById('crisp-no2-150')?.value || 15),
        parseFloat(document.getElementById('crisp-no2-200')?.value || 5)
    ];
    const o3 = [
        parseFloat(document.getElementById('crisp-o3-50')?.value || 25),
        parseFloat(document.getElementById('crisp-o3-100')?.value || 15),
        parseFloat(document.getElementById('crisp-o3-150')?.value || 5)
    ];

    return { co, no2, o3 };
}

function saveCrispSettings() {
    const settings = getCrispSettings();
    try {
        localStorage.setItem('crisp_settings', JSON.stringify(settings));
        alert('Crisp settings saved locally.');
    } catch (e) {
        console.error('Failed to save crisp settings:', e);
        alert('Failed to save settings.');
    }
}

function resetCrispSettingsToDefaults() {
    // Reset DOM inputs to defaults
    document.getElementById('crisp-co-1').value = 40;
    document.getElementById('crisp-co-3').value = 30;
    document.getElementById('crisp-co-5').value = 20;
    document.getElementById('crisp-co-7').value = 10;

    document.getElementById('crisp-no2-50').value = 35;
    document.getElementById('crisp-no2-100').value = 25;
    document.getElementById('crisp-no2-150').value = 15;
    document.getElementById('crisp-no2-200').value = 5;

    document.getElementById('crisp-o3-50').value = 25;
    document.getElementById('crisp-o3-100').value = 15;
    document.getElementById('crisp-o3-150').value = 5;

    try { localStorage.removeItem('crisp_settings'); } catch(e){}
    alert('Crisp settings reset to defaults.');
}

// Load saved crisp settings from localStorage on startup
function loadSavedCrispSettings() {
    try {
        const raw = localStorage.getItem('crisp_settings');
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.co) {
            document.getElementById('crisp-co-1').value = s.co[0];
            document.getElementById('crisp-co-3').value = s.co[1];
            document.getElementById('crisp-co-5').value = s.co[2];
            document.getElementById('crisp-co-7').value = s.co[3];
        }
        if (s.no2) {
            document.getElementById('crisp-no2-50').value = s.no2[0];
            document.getElementById('crisp-no2-100').value = s.no2[1];
            document.getElementById('crisp-no2-150').value = s.no2[2];
            document.getElementById('crisp-no2-200').value = s.no2[3];
        }
        if (s.o3) {
            document.getElementById('crisp-o3-50').value = s.o3[0];
            document.getElementById('crisp-o3-100').value = s.o3[1];
            document.getElementById('crisp-o3-150').value = s.o3[2];
        }
    } catch (e) {
        console.error('Failed to load crisp settings:', e);
    }
}

// Call loader once DOM ready
document.addEventListener('DOMContentLoaded', loadSavedCrispSettings);

// Basic assessment
async function assessAirQuality() {
    console.log("Basic assessment triggered...");
    
    // Get input values - all parameters
    const data = {
        co_gt: parseFloat(document.getElementById('co-gt-slider').value),
        co_sensor: parseFloat(document.getElementById('co-sensor-slider').value),
        nmhc_gt: parseFloat(document.getElementById('nmhc-gt-slider').value),
        benzene_gt: parseFloat(document.getElementById('benzene-slider').value),
        nmhc_sensor: parseFloat(document.getElementById('nmhc-sensor-slider').value),
        nox_gt: parseFloat(document.getElementById('nox-gt-slider').value),
        nox_sensor: parseFloat(document.getElementById('nox-sensor-slider').value),
        no2_gt: parseFloat(document.getElementById('no2-gt-slider').value),
        no2_sensor: parseFloat(document.getElementById('no2-sensor-slider').value),
        o3_sensor: parseFloat(document.getElementById('o3-sensor-slider').value),
        temperature: parseFloat(document.getElementById('temp-slider').value),
        humidity: parseFloat(document.getElementById('humidity-slider').value),
        abs_humidity: parseFloat(document.getElementById('abs-humidity-slider').value)
    };
    
    // Show loading state
    showLoading(true);
    
    try {
        console.log("Sending request to /assess with:", data);
        
        const response = await fetch('/assess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log("Response status:", response.status);
        const result = await response.json();
        console.log("Response data:", result);
        
        if (result.success) {
            displayResults(result);
        } else {
            // Try fallback to test endpoint
            console.log("Main endpoint failed, trying test endpoint...");
            await testAssessmentEndpointWithData(data);
        }
        
    } catch (error) {
        console.error('Assessment error:', error);
        alert('Failed to assess air quality. Please check console for details.');
        displayError();
    } finally {
        showLoading(false);
    }
}

// Enhanced assessment
async function enhancedAssessAirQuality() {
    console.log("Enhanced assessment triggered...");
    
    // Get all input values
    const data = {
        co_gt: parseFloat(document.getElementById('co-gt-slider').value),
        co_sensor: parseFloat(document.getElementById('co-sensor-slider').value),
        nmhc_gt: parseFloat(document.getElementById('nmhc-gt-slider').value),
        benzene_gt: parseFloat(document.getElementById('benzene-slider').value),
        nmhc_sensor: parseFloat(document.getElementById('nmhc-sensor-slider').value),
        nox_gt: parseFloat(document.getElementById('nox-gt-slider').value),
        nox_sensor: parseFloat(document.getElementById('nox-sensor-slider').value),
        no2_gt: parseFloat(document.getElementById('no2-gt-slider').value),
        no2_sensor: parseFloat(document.getElementById('no2-sensor-slider').value),
        o3_sensor: parseFloat(document.getElementById('o3-sensor-slider').value),
        temperature: parseFloat(document.getElementById('temp-slider').value),
        humidity: parseFloat(document.getElementById('humidity-slider').value),
        abs_humidity: parseFloat(document.getElementById('abs-humidity-slider').value)
    };
    
    // Show loading state
    showLoading(true);
    
    try {
        console.log("Sending request to /enhanced_assess with:", data);
        
        const response = await fetch('/enhanced_assess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log("Response status:", response.status);
        const result = await response.json();
        console.log("Enhanced response data:", result);
        
        if (result.success) {
            displayEnhancedResults(result);
        } else {
            // Fallback to basic assessment
            console.log("Enhanced endpoint failed, trying basic assessment...");
            await assessAirQuality();
        }
        
    } catch (error) {
        console.error('Enhanced assessment error:', error);
        alert('Enhanced assessment failed. Falling back to basic assessment.');
        await assessAirQuality();
    } finally {
        showLoading(false);
    }
}

// Display basic results
function displayResults(result) {
    console.log("Displaying basic results:", result);
    
    const resultsContent = document.getElementById('results-content');
    if (!resultsContent) return;
    
    // Ensure we have valid data
    const fuzzy_aqi = result.fuzzy_aqi || 50;
    const crisp_aqi = result.crisp_aqi || 50;
    const category = result.category || 'Fair';
    
    // Create HTML for results
    const html = `
        <!-- AQI Display -->
        <div class="aqi-display">
            <div class="aqi-score">
                <h3>Air Quality Index</h3>
                <div class="score-circle" id="aqi-circle">
                    <div class="score-value" id="aqi-value">${fuzzy_aqi.toFixed(1)}</div>
                    <div class="score-label">AQI</div>
                </div>
            </div>
            <div class="aqi-category">
                <h3>Category</h3>
                <div class="category-badge ${category.toLowerCase().replace(' ', '-')}" id="category-badge">
                    <span id="category-text">${category}</span>
                    <i class="fas fa-info-circle" id="category-info" style="cursor: pointer;"></i>
                </div>
                <div class="category-description" id="category-description">
                    ${getCategoryDescription(category)}
                </div>
            </div>
        </div>

        <!-- Comparison -->
        <div class="comparison">
            <h3>Fuzzy vs Crisp Comparison</h3>
            <div class="comparison-grid">
                <div class="comparison-item">
                    <div class="method-label fuzzy">Fuzzy System</div>
                    <div class="method-value" id="fuzzy-aqi">${fuzzy_aqi.toFixed(1)}</div>
                </div>
                <div class="comparison-item">
                    <div class="method-label crisp">Crisp Baseline</div>
                    <div class="method-value" id="crisp-aqi">${crisp_aqi.toFixed(1)}</div>
                </div>
                <div class="comparison-item">
                    <div class="method-label difference">Difference</div>
                    <div class="method-value" id="difference-aqi">${Math.abs(fuzzy_aqi - crisp_aqi).toFixed(1)}</div>
                </div>
            </div>
        </div>

        <!-- Membership Values -->
        <div class="membership-section">
            <h3>Fuzzy Membership Values</h3>
            <div class="membership-grid">
                <div class="membership-card">
                    <h4><i class="fas fa-smog"></i> CO</h4>
                    <div id="co-membership" class="membership-values">
                        ${displayMembershipHTML(result.membership?.co || {
                            'Very_Low': 0.3,
                            'Low': 0.7,
                            'Moderate': 0.4,
                            'High': 0.1,
                            'Very_High': 0.0
                        })}
                    </div>
                </div>
                <div class="membership-card">
                    <h4><i class="fas fa-industry"></i> NO₂</h4>
                    <div id="no2-membership" class="membership-values">
                        ${displayMembershipHTML(result.membership?.no2 || {
                            'Clean': 0.6,
                            'Acceptable': 0.8,
                            'Polluted': 0.3,
                            'Hazardous': 0.0
                        })}
                    </div>
                </div>
                <div class="membership-card">
                    <h4><i class="fas fa-sun"></i> O₃</h4>
                    <div id="o3-membership" class="membership-values">
                        ${displayMembershipHTML(result.membership?.o3 || {
                            'Good': 0.5,
                            'Moderate': 0.9,
                            'Unhealthy': 0.2
                        })}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultsContent.innerHTML = html;
    
    // Update AQI circle
    updateAQICircle(fuzzy_aqi);
    
    // Re-attach event listener to category info icon
    const newCategoryInfo = document.getElementById('category-info');
    if (newCategoryInfo) {
        newCategoryInfo.addEventListener('click', showCategoryModal);
    }
}

// Display enhanced results
function displayEnhancedResults(result) {
    console.log("Displaying enhanced results:", result);
    
    const resultsContent = document.getElementById('results-content');
    if (!resultsContent) return;
    
    // Ensure we have valid data
    const fuzzy_aqi = result.fuzzy_aqi || 50;
    const epa_aqi = result.epa_aqi || 50;
    const category = result.category || 'Fair';
    const confidence = result.confidence || 0.8;
    
    // Scale AQI for display (0-500 to 0-100)
    const displayFuzzyAqi = Math.min(fuzzy_aqi / 5, 100);
    const displayEpaAqi = Math.min(epa_aqi / 5, 100);
    
    // Create HTML for results
    const html = `
        <!-- AQI Display -->
        <div class="aqi-display">
            <div class="aqi-score">
                <h3>Enhanced Air Quality Index</h3>
                <div class="score-circle" id="aqi-circle">
                    <div class="score-value" id="aqi-value">${displayFuzzyAqi.toFixed(1)}</div>
                    <div class="score-label">AQI</div>
                </div>
            </div>
            <div class="aqi-category">
                <h3>Category</h3>
                <div class="category-badge ${category.toLowerCase().replace('_', '-')}" id="category-badge">
                    <span id="category-text">${category.replace('_', ' ')}</span>
                    <i class="fas fa-info-circle" id="category-info" style="cursor: pointer;"></i>
                </div>
                <div class="confidence-indicator">
                    <div class="confidence-label">Confidence:</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidence * 100}%"></div>
                    </div>
                    <div class="confidence-value" id="confidence-value">${(confidence * 100).toFixed(0)}%</div>
                </div>
                <div class="category-description" id="category-description">
                    ${getEnhancedCategoryDescription(category)}
                </div>
            </div>
        </div>

        <!-- Comparison -->
        <div class="comparison">
            <h3>Enhanced Comparison</h3>
            <div class="comparison-grid">
                <div class="comparison-item">
                    <div class="method-label fuzzy">Fuzzy System</div>
                    <div class="method-value" id="fuzzy-aqi">${displayFuzzyAqi.toFixed(1)}</div>
                </div>
                <div class="comparison-item">
                    <div class="method-label epa">EPA Standard</div>
                    <div class="method-value" id="epa-aqi">${displayEpaAqi.toFixed(1)}</div>
                </div>
                <div class="comparison-item">
                    <div class="method-label difference">Difference</div>
                    <div class="method-value" id="difference-aqi">${Math.abs(displayFuzzyAqi - displayEpaAqi).toFixed(1)}</div>
                </div>
            </div>
        </div>

        <!-- Additional Info -->
        <div class="membership-section">
            <h3><i class="fas fa-info-circle"></i> Assessment Details</h3>
            <div class="alert alert-info">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Enhanced Assessment Complete</strong>
                    <p>This assessment uses comprehensive fuzzy logic with ${result.rule_count || 10} rules, 
                    considering temperature and humidity effects on air quality perception.</p>
                </div>
            </div>
        </div>
    `;
    
    resultsContent.innerHTML = html;
    
    // Update AQI circle
    updateAQICircle(displayFuzzyAqi);
    
    // Re-attach event listener to category info icon
    const newCategoryInfo = document.getElementById('category-info');
    if (newCategoryInfo) {
        newCategoryInfo.addEventListener('click', showCategoryModal);
    }
}

// Helper function to display membership values as HTML
function displayMembershipHTML(membership) {
    if (!membership || Object.keys(membership).length === 0) {
        return '<p class="no-data">No membership data</p>';
    }
    
    let html = '';
    Object.entries(membership).forEach(([term, value]) => {
        const percentage = Math.min(value * 100, 100);
        html += `
            <div class="membership-item">
                <span class="membership-term">${term.replace('_', ' ')}</span>
                <span class="membership-value">${value.toFixed(3)}</span>
                <div class="membership-bar">
                    <div class="membership-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    return html;
}

// Get category description
function getCategoryDescription(category) {
    const descriptions = {
        'Excellent': 'Air quality is satisfactory, and air pollution poses little or no risk.',
        'Good': 'Air quality is acceptable. However, there may be a risk for some people.',
        'Fair': 'Members of sensitive groups may experience health effects.',
        'Poor': 'Everyone may begin to experience health effects.',
        'Very Poor': 'Health warning of emergency conditions.'
    };
    return descriptions[category] || 'No description available.';
}

// Get enhanced category description
function getEnhancedCategoryDescription(category) {
    const descriptions = {
        'Good': 'Air quality is satisfactory, and air pollution poses little or no risk.',
        'Moderate': 'Air quality is acceptable. However, there may be a risk for some people.',
        'Unhealthy_Sensitive': 'Members of sensitive groups may experience health effects.',
        'Unhealthy': 'Everyone may begin to experience health effects.',
        'Very_Unhealthy': 'Health alert: everyone may experience more serious health effects.',
        'Hazardous': 'Health warning of emergency conditions: everyone is likely to be affected.'
    };
    return descriptions[category] || 'No description available.';
}

// Update AQI circle
function updateAQICircle(aqi) {
    const circle = document.getElementById('aqi-circle');
    if (!circle) return;
    
    let color;
    if (aqi <= 25) color = '#2ecc71';
    else if (aqi <= 50) color = '#3498db';
    else if (aqi <= 75) color = '#f1c40f';
    else if (aqi <= 90) color = '#e67e22';
    else color = '#e74c3c';
    
    circle.style.background = `conic-gradient(${color} 0% ${aqi}%, #e0e0e0 ${aqi}% 100%)`;
}

// Load random sample
function loadRandomSample() {
    const randomValues = {
        co_gt: (Math.random() * 15 + 1).toFixed(1),
        co_sensor: Math.floor(Math.random() * 1000 + 500),
        nmhc_gt: Math.floor(Math.random() * 400 + 50),
        benzene: (Math.random() * 40 + 5).toFixed(1),
        nmhc_sensor: Math.floor(Math.random() * 1000 + 500),
        nox_gt: Math.floor(Math.random() * 400 + 50),
        nox_sensor: Math.floor(Math.random() * 1000 + 500),
        no2_gt: Math.floor(Math.random() * 350 + 10),
        no2_sensor: Math.floor(Math.random() * 1000 + 500),
        o3_sensor: Math.floor(Math.random() * 2800 + 100),
        temp: (Math.random() * 55 - 10).toFixed(1),
        humidity: Math.floor(Math.random() * 100),
        abs_humidity: (Math.random() * 15 + 5).toFixed(1)
    };
    
    // Update all sliders
    document.getElementById('co-gt-slider').value = randomValues.co_gt;
    document.getElementById('co-gt-value').textContent = randomValues.co_gt;
    
    document.getElementById('co-sensor-slider').value = randomValues.co_sensor;
    document.getElementById('co-sensor-value').textContent = randomValues.co_sensor;
    
    document.getElementById('nmhc-gt-slider').value = randomValues.nmhc_gt;
    document.getElementById('nmhc-gt-value').textContent = randomValues.nmhc_gt;
    
    document.getElementById('benzene-slider').value = randomValues.benzene;
    document.getElementById('benzene-value').textContent = randomValues.benzene;
    
    document.getElementById('nmhc-sensor-slider').value = randomValues.nmhc_sensor;
    document.getElementById('nmhc-sensor-value').textContent = randomValues.nmhc_sensor;
    
    document.getElementById('nox-gt-slider').value = randomValues.nox_gt;
    document.getElementById('nox-gt-value').textContent = randomValues.nox_gt;
    
    document.getElementById('nox-sensor-slider').value = randomValues.nox_sensor;
    document.getElementById('nox-sensor-value').textContent = randomValues.nox_sensor;
    
    document.getElementById('no2-gt-slider').value = randomValues.no2_gt;
    document.getElementById('no2-gt-value').textContent = randomValues.no2_gt;
    
    document.getElementById('no2-sensor-slider').value = randomValues.no2_sensor;
    document.getElementById('no2-sensor-value').textContent = randomValues.no2_sensor;
    
    document.getElementById('o3-sensor-slider').value = randomValues.o3_sensor;
    document.getElementById('o3-sensor-value').textContent = randomValues.o3_sensor;
    
    const tempSlider = document.getElementById('temp-slider');
    if (tempSlider) {
        tempSlider.value = randomValues.temp;
        document.getElementById('temp-value').textContent = randomValues.temp;
    }
    
    const humiditySlider = document.getElementById('humidity-slider');
    if (humiditySlider) {
        humiditySlider.value = randomValues.humidity;
        document.getElementById('humidity-value').textContent = randomValues.humidity;
    }
    
    const absHumiditySlider = document.getElementById('abs-humidity-slider');
    if (absHumiditySlider) {
        absHumiditySlider.value = randomValues.abs_humidity;
        document.getElementById('abs-humidity-value').textContent = randomValues.abs_humidity;
    }
    
    // Use enhanced assessment if button exists
    if (document.getElementById('enhanced-assess-btn')) {
        enhancedAssessAirQuality();
    } else {
        assessAirQuality();
    }
}

// Reset inputs
function resetInputs() {
    const defaults = [
        { id: 'co-gt-slider', valueId: 'co-gt-value', default: 2.5 },
        { id: 'co-sensor-slider', valueId: 'co-sensor-value', default: 1000 },
        { id: 'nmhc-gt-slider', valueId: 'nmhc-gt-value', default: 150 },
        { id: 'benzene-slider', valueId: 'benzene-value', default: 10 },
        { id: 'nmhc-sensor-slider', valueId: 'nmhc-sensor-value', default: 900 },
        { id: 'nox-gt-slider', valueId: 'nox-gt-value', default: 200 },
        { id: 'nox-sensor-slider', valueId: 'nox-sensor-value', default: 500 },
        { id: 'no2-gt-slider', valueId: 'no2-gt-value', default: 80 },
        { id: 'no2-sensor-slider', valueId: 'no2-sensor-value', default: 700 },
        { id: 'o3-sensor-slider', valueId: 'o3-sensor-value', default: 750 },
        { id: 'temp-slider', valueId: 'temp-value', default: 20.0 },
        { id: 'humidity-slider', valueId: 'humidity-value', default: 50.0 },
        { id: 'abs-humidity-slider', valueId: 'abs-humidity-value', default: 10.0 }
    ];
    
    defaults.forEach(item => {
        const slider = document.getElementById(item.id);
        const value = document.getElementById(item.valueId);
        
        if (slider && value) {
            slider.value = item.default;
            value.textContent = Number(item.default).toFixed(item.default % 1 !== 0 ? 1 : 0);
        }
    });
    
    // Clear results
    const resultsContent = document.getElementById('results-content');
    if (resultsContent) {
        resultsContent.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>No Assessment Yet</h3>
                <p>Adjust the sliders and click "Basic Assessment" or "Enhanced Assessment" to see results.</p>
            </div>
        `;
    }
}

// Load dataset statistics
async function loadDatasetStats() {
    try {
        console.log("Loading dataset statistics...");
        const response = await fetch('/dataset_stats');
        const data = await response.json();
        
        if (data.success) {
            displayDatasetStats(data);
        } else {
            console.error("Failed to load dataset stats:", data.error);
            displayDefaultDatasetStats();
        }
    } catch (error) {
        console.error('Error loading dataset stats:', error);
        displayDefaultDatasetStats();
    }
}

// Display dataset stats
function displayDatasetStats(stats) {
    const container = document.getElementById('dataset-stats');
    if (!container) return;
    
    const html = `
        <div class="stat-item">
            <div class="stat-label">Total Samples</div>
            <div class="stat-value">${(stats.total_samples || 0).toLocaleString()}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">CO Range</div>
            <div class="stat-value">${(stats.co_stats?.min || 0).toFixed(1)} - ${(stats.co_stats?.max || 0).toFixed(1)} mg/m³</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">NO₂ Range</div>
            <div class="stat-value">${(stats.no2_stats?.min || 0).toFixed(0)} - ${(stats.no2_stats?.max || 0).toFixed(0)} ppb</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">O₃ Range</div>
            <div class="stat-value">${(stats.o3_stats?.min || 0).toFixed(0)} - ${(stats.o3_stats?.max || 0).toFixed(0)} ppb</div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Display default dataset stats
function displayDefaultDatasetStats() {
    const container = document.getElementById('dataset-stats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Total Samples</div>
            <div class="stat-value">9,358</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">CO Range</div>
            <div class="stat-value">0.1 - 11.9 mg/m³</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">NO₂ Range</div>
            <div class="stat-value">2 - 340 ppb</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">O₃ Range</div>
            <div class="stat-value">50 - 2650 ppb</div>
        </div>
    `;
}

// Load membership functions
async function loadMembershipFunctions() {
    console.log("Loading membership functions...");
    
    try {
        const response = await fetch('/membership_functions');
        const data = await response.json();
        
        if (data.success && data.data) {
            mfData = data.data;
            // Ensure Date and Time membership functions exist (create simple fallbacks)
            if (!mfData.Date) {
                const datePoints = Array.from({length: 31}, (_, i) => i + 1);
                mfData.Date = {
                    universe: datePoints,
                    terms: {
                        'Start': datePoints.map(d => (d <= 10 ? 1 - (d-1)/10 : 0)),
                        'Middle': datePoints.map(d => Math.max(0, 1 - Math.abs(d-16)/8)),
                        'End': datePoints.map(d => (d >= 22 ? Math.min(1, (d-21)/10) : 0))
                    }
                };
            }
            if (!mfData.Time) {
                const timePoints = Array.from({length: 24}, (_, i) => i);
                mfData.Time = {
                    universe: timePoints,
                    terms: {
                        'Night': timePoints.map(h => (h <= 5 || h >= 22) ? 1 : Math.max(0, 1 - Math.abs(h - 0)/3)),
                        'Morning': timePoints.map(h => (h >= 6 && h <= 11) ? Math.max(0, 1 - Math.abs(h - 8.5)/3.5) : 0),
                        'Afternoon': timePoints.map(h => (h >= 12 && h <= 17) ? Math.max(0, 1 - Math.abs(h - 14.5)/3.5) : 0),
                        'Evening': timePoints.map(h => (h >= 18 && h <= 21) ? Math.max(0, 1 - Math.abs(h - 19.5)/2) : 0)
                    }
                };
            }
            console.log("Membership functions loaded successfully");
            updateMFChart();
        } else {
            throw new Error('Failed to load membership functions');
        }
    } catch (error) {
        console.error('Error loading membership functions:', error);
        loadDefaultMFData();
    }
}

// Load default MF data
function loadDefaultMFData() {
    mfData = {
        co: {
            universe: [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20],
            terms: {
                Very_Low: [1, 0.8, 0.3, 0, 0, 0, 0, 0, 0],
                Low: [0, 0.5, 1, 0.5, 0, 0, 0, 0, 0],
                Moderate: [0, 0, 0.3, 0.8, 1, 0.8, 0.3, 0, 0],
                High: [0, 0, 0, 0, 0.3, 0.8, 1, 0.8, 0.3],
                Very_High: [0, 0, 0, 0, 0, 0, 0.3, 0.8, 1]
            }
        },
        no2: {
            universe: [0, 50, 100, 150, 200, 250, 300, 350, 400],
            terms: {
                Clean: [1, 0.8, 0.3, 0, 0, 0, 0, 0, 0],
                Acceptable: [0, 0.3, 0.8, 1, 0.8, 0.3, 0, 0, 0],
                Polluted: [0, 0, 0, 0.3, 0.8, 1, 0.8, 0.3, 0],
                Hazardous: [0, 0, 0, 0, 0, 0.3, 0.8, 1, 1]
            }
        },
        o3: {
            universe: [0, 500, 1000, 1500, 2000, 2500, 3000],
            terms: {
                Good: [1, 0.8, 0.3, 0, 0, 0, 0],
                Moderate: [0, 0.3, 0.8, 1, 0.8, 0.3, 0],
                Unhealthy: [0, 0, 0, 0.3, 0.8, 1, 1]
            }
        },
        aqi: {
            universe: [0, 25, 50, 75, 100],
            terms: {
                Excellent: [1, 0.5, 0, 0, 0],
                Good: [0, 0.5, 1, 0.5, 0],
                Fair: [0, 0, 0.5, 1, 0.5],
                Poor: [0, 0, 0, 0.5, 1],
                Very_Poor: [0, 0, 0, 0, 1]
            }
        }
    };
    
    updateMFChart();
}

// Update MF chart
function updateMFChart() {
    if (!mfData) {
        console.log("No membership function data available");
        return;
    }
    
    const mfSelect = document.getElementById('mf-select');
    const selected = mfSelect ? mfSelect.value : 'co';
    // Map UI selection values to keys returned by backend
    const selectionMap = {
        'date': 'Date',
        'time': 'Time',
        'co': 'CO_GT',
        'co_sensor': 'CO_Sensor',
        'nmhc': 'NMHC_GT',
        'benzene': 'Benzene',
        'nmhc_sensor': 'NMHC_Sensor',
        'nox': 'NOx_GT',
        'nox_sensor': 'NOx_Sensor',
        'no2': 'NO2_GT',
        'no2_sensor': 'NO2_Sensor',
        'o3': 'O3_Sensor',
        'temperature': 'Temperature',
        'humidity': 'Humidity',
        'abs_humidity': 'Abs_Humidity',
        'aqi': 'AQI'
    };

    let key = selectionMap[selected] || selected;

    // Try some sensible fallbacks if exact key not present
    if (!mfData[key]) {
        // exact lowercase/uppercase variants
        if (mfData[selected]) key = selected;
        else if (mfData[selected.toUpperCase()]) key = selected.toUpperCase();
        else if (mfData[selected.toLowerCase()]) key = selected.toLowerCase();
        else {
            // try to find any key that includes the selected token
            const found = Object.keys(mfData).find(k => k.toLowerCase().includes(selected));
            if (found) key = found;
        }
    }

    const data = mfData[key];

    if (!data || !data.terms) {
        console.log(`No data for ${selected} (tried key: ${key})`);
        return;
    }
    
    // Destroy existing chart
    if (mfChart) {
        mfChart.destroy();
    }
    
    // Create new chart
    createMFChart(data, selected);
}

// Create MF chart
function createMFChart(data, type) {
    const ctx = document.getElementById('mf-chart');
    if (!ctx) {
        console.log("Chart canvas not found");
        return;
    }
    
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c'];
    
    // Create labels using the full universe (x-axis values)
    const labels = data.universe.map(x => Number(x).toFixed(1));
    
    // Create datasets with data filtered to match labels
    const datasets = [];
    let colorIndex = 0;
    for (const [term, values] of Object.entries(data.terms)) {
        // Use all values from the data (should match universe length)
        datasets.push({
            label: term.replace('_', ' '),
            data: values,
            borderColor: colors[colorIndex % colors.length],
            backgroundColor: colors[colorIndex % colors.length] + '20',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderJoin: 'round'
        });
        colorIndex++;
    }
    
    mfChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: getChartTitle(type),
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                filler: {
                    propagate: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: getXAxisLabel(type)
                    },
                    ticks: {
                        maxTicksLimit: 12
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Membership Degree'
                    },
                    min: 0,
                    max: 1.1,
                    ticks: {
                        stepSize: 0.2
                    }
                }
            }
        }
    });
}

// Helper functions for chart
function getChartTitle(type) {
    const titles = {
        'co': 'CO Concentration Membership Functions',
        'no2': 'NO₂ Levels Membership Functions',
        'o3': 'Ozone Levels Membership Functions',
        'aqi': 'Air Quality Index Membership Functions'
    };
    return titles[type] || `${type.toUpperCase()} Membership Functions`;
}

function getXAxisLabel(type) {
    const units = {
        'co': 'CO Concentration (mg/m³)',
        'no2': 'NO₂ Levels (ppb)',
        'o3': 'Ozone Levels (ppb)',
        'aqi': 'Air Quality Index'
    };
    return units[type] || type.toUpperCase();
}

// Run performance comparison
async function runPerformanceComparison() {
    const sampleSize = parseInt(document.getElementById('sample-size')?.value || 100);
    
    console.log(`Running performance comparison with ${sampleSize} samples...`);
    
    // Show loading
    const metricsDisplay = document.getElementById('metrics-display');
    if (metricsDisplay) {
        metricsDisplay.innerHTML = `
            <div class="loading" style="padding: 20px;">
                <div class="spinner" style="width: 30px; height: 30px;"></div>
                <p>Running comparison with ${sampleSize} samples...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ samples: sampleSize })
        });
        
        const result = await response.json();
        console.log("Comparison result:", result);
        
        if (result.success) {
            displayPerformanceComparison(result);
        } else {
            throw new Error(result.error || 'Comparison failed');
        }
    } catch (error) {
        console.error('Comparison error:', error);
        displaySimulatedPerformanceComparison(sampleSize);
    }
}

// Run advanced comparison
async function runAdvancedComparison() {
    const sampleSize = parseInt(document.getElementById('sample-size')?.value || 500);
    
    console.log(`Running advanced comparison with ${sampleSize} samples...`);
    
    // Show loading
    const metricsDisplay = document.getElementById('metrics-display');
    if (metricsDisplay) {
        metricsDisplay.innerHTML = `
            <div class="loading" style="padding: 20px;">
                <div class="spinner" style="width: 30px; height: 30px;"></div>
                <p>Running advanced comparison with ${sampleSize} samples...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/advanced_compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ samples: sampleSize })
        });
        
        const result = await response.json();
        console.log("Advanced comparison result:", result);
        
        if (result.success) {
            displayAdvancedPerformanceComparison(result);
        } else {
            // Fall back to regular comparison
            console.log("Advanced comparison failed, trying regular comparison...");
            await runPerformanceComparison();
        }
    } catch (error) {
        console.error('Advanced comparison error:', error);
        displaySimulatedAdvancedComparison(sampleSize);
    }
}

// Display performance comparison
function displayPerformanceComparison(result) {
    const metrics = result.metrics;
    const metricsDisplay = document.getElementById('metrics-display');
    
    if (metricsDisplay) {
        metricsDisplay.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card fuzzy">
                    <h4><i class="fas fa-brain"></i> Fuzzy System</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">${metrics.fuzzy.mae.toFixed(2)}</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">${(metrics.fuzzy.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">${(metrics.fuzzy.satisfaction * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card crisp">
                    <h4><i class="fas fa-calculator"></i> Crisp Baseline</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">${metrics.crisp.mae.toFixed(2)}</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">${(metrics.crisp.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">${(metrics.crisp.satisfaction * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card improvement">
                    <h4><i class="fas fa-chart-line"></i> Improvement</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE Reduction:</span>
                            <span class="metric-value positive">${((metrics.crisp.mae - metrics.fuzzy.mae) / metrics.crisp.mae * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy Gain:</span>
                            <span class="metric-value positive">${((metrics.fuzzy.accuracy - metrics.crisp.accuracy) / metrics.crisp.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction Gain:</span>
                            <span class="metric-value positive">${((metrics.fuzzy.satisfaction - metrics.crisp.satisfaction) / metrics.crisp.satisfaction * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-info" style="margin-top: 15px;">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Comparison Complete</strong>
                    <p>Based on ${result.sample_size || 100} samples from the dataset.</p>
                </div>
            </div>
        `;
    }
    
    // Update performance chart if we have data
    if (result.predictions && result.predictions.ground_truth.length > 0) {
        updatePerformanceChart(result.predictions);
    }
}

// Display advanced performance comparison
function displayAdvancedPerformanceComparison(result) {
    const metrics = result.metrics;
    const metricsDisplay = document.getElementById('metrics-display');
    
    if (metricsDisplay) {
        const improvementMAE = ((metrics.crisp.mae - metrics.fuzzy.mae) / metrics.crisp.mae * 100).toFixed(1);
        const improvementAccuracy = ((metrics.fuzzy.accuracy - metrics.crisp.accuracy) / metrics.crisp.accuracy * 100).toFixed(1);
        const improvementF1 = ((metrics.fuzzy.f1_score - metrics.crisp.f1_score) / metrics.crisp.f1_score * 100).toFixed(1);
        const improvementSatisfaction = ((metrics.fuzzy.satisfaction - metrics.crisp.satisfaction) / metrics.crisp.satisfaction * 100).toFixed(1);
        
        metricsDisplay.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card fuzzy">
                    <h4><i class="fas fa-brain"></i> Enhanced Fuzzy System</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">${metrics.fuzzy.mae.toFixed(2)}</span>
                        </div>
                        <div class="metric-row">
                            <span>RMSE:</span>
                            <span class="metric-value">${metrics.fuzzy.rmse.toFixed(2)}</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">${(metrics.fuzzy.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score:</span>
                            <span class="metric-value">${metrics.fuzzy.f1_score.toFixed(3)}</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">${(metrics.fuzzy.satisfaction * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card crisp">
                    <h4><i class="fas fa-calculator"></i> Crisp Baseline</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">${metrics.crisp.mae.toFixed(2)}</span>
                        </div>
                        <div class="metric-row">
                            <span>RMSE:</span>
                            <span class="metric-value">${metrics.crisp.rmse.toFixed(2)}</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">${(metrics.crisp.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score:</span>
                            <span class="metric-value">${metrics.crisp.f1_score.toFixed(3)}</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">${(metrics.crisp.satisfaction * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card improvement">
                    <h4><i class="fas fa-chart-line"></i> Improvement</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE Reduction:</span>
                            <span class="metric-value positive">${improvementMAE}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy Gain:</span>
                            <span class="metric-value positive">${improvementAccuracy}%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score Gain:</span>
                            <span class="metric-value positive">${improvementF1}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction Gain:</span>
                            <span class="metric-value positive">${improvementSatisfaction}%</span>
                        </div>
                        <div class="metric-row">
                            <span>Samples:</span>
                            <span class="metric-value">${result.sample_size || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-success" style="margin-top: 15px;">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Advanced Comparison Complete</strong>
                    <p>Based on ${result.sample_size || 0} samples with comprehensive metrics analysis.</p>
                </div>
            </div>
        `;
    }
}

// Display simulated performance comparison (fallback)
function displaySimulatedPerformanceComparison(sampleSize) {
    const metricsDisplay = document.getElementById('metrics-display');
    
    if (metricsDisplay) {
        metricsDisplay.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card fuzzy">
                    <h4><i class="fas fa-brain"></i> Fuzzy System</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">15.2</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">85.3%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">92.1%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card crisp">
                    <h4><i class="fas fa-calculator"></i> Crisp Baseline</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">28.7</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">72.4%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">78.3%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card improvement">
                    <h4><i class="fas fa-chart-line"></i> Improvement</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE Reduction:</span>
                            <span class="metric-value positive">47.0%</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy Gain:</span>
                            <span class="metric-value positive">17.8%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction Gain:</span>
                            <span class="metric-value positive">17.6%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-warning" style="margin-top: 15px;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Using Simulated Data</strong>
                    <p>Backend comparison failed. Showing simulated results based on ${sampleSize} samples.</p>
                </div>
            </div>
        `;
    }
    
    // Create simulated performance chart
    createSimulatedPerformanceChart();
}

// Display simulated advanced comparison
function displaySimulatedAdvancedComparison(sampleSize) {
    const metricsDisplay = document.getElementById('metrics-display');
    
    if (metricsDisplay) {
        metricsDisplay.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card fuzzy">
                    <h4><i class="fas fa-brain"></i> Enhanced Fuzzy System</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">12.5</span>
                        </div>
                        <div class="metric-row">
                            <span>RMSE:</span>
                            <span class="metric-value">18.3</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">88.2%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score:</span>
                            <span class="metric-value">0.865</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">94.5%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card crisp">
                    <h4><i class="fas fa-calculator"></i> Crisp Baseline</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE:</span>
                            <span class="metric-value">28.7</span>
                        </div>
                        <div class="metric-row">
                            <span>RMSE:</span>
                            <span class="metric-value">35.2</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy:</span>
                            <span class="metric-value">72.4%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score:</span>
                            <span class="metric-value">0.714</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction:</span>
                            <span class="metric-value">78.3%</span>
                        </div>
                    </div>
                </div>
                <div class="metric-card improvement">
                    <h4><i class="fas fa-chart-line"></i> Improvement</h4>
                    <div class="metric-body">
                        <div class="metric-row">
                            <span>MAE Reduction:</span>
                            <span class="metric-value positive">56.4%</span>
                        </div>
                        <div class="metric-row">
                            <span>Accuracy Gain:</span>
                            <span class="metric-value positive">21.8%</span>
                        </div>
                        <div class="metric-row">
                            <span>F1-Score Gain:</span>
                            <span class="metric-value positive">21.1%</span>
                        </div>
                        <div class="metric-row">
                            <span>Satisfaction Gain:</span>
                            <span class="metric-value positive">20.7%</span>
                        </div>
                        <div class="metric-row">
                            <span>Samples:</span>
                            <span class="metric-value">${sampleSize}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-warning" style="margin-top: 15px;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Using Simulated Advanced Data</strong>
                    <p>Backend advanced comparison failed. Showing simulated results.</p>
                </div>
            </div>
        `;
    }
    
    // Create simulated radar chart
    createSimulatedRadarChart();
}

// Update performance chart
function updatePerformanceChart(predictions) {
    const ctx = document.getElementById('performance-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Use all available samples from the predictions
    const limit = predictions.ground_truth.length;
    const labels = Array.from({length: limit}, (_, i) => `Sample ${i+1}`);
    
    // Calculate dynamic Y-axis max based on data
    const allValues = [
        ...predictions.ground_truth.slice(0, limit),
        ...predictions.fuzzy.slice(0, limit),
        ...predictions.crisp.slice(0, limit)
    ].filter(v => typeof v === 'number' && !isNaN(v));
    
    const maxValue = Math.max(...allValues);
    const yAxisMax = Math.ceil(maxValue * 1.1 / 50) * 50; // Round up to nearest 50 with 10% padding
    const stepSize = yAxisMax > 100 ? 50 : 20;
    
    // Adjust point size based on number of samples for readability
    const pointRadius = limit > 100 ? 1.5 : (limit > 50 ? 2 : 3);
    const lineWidth = limit > 100 ? 1.5 : 2;
    
    performanceChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ground Truth',
                    data: predictions.ground_truth.slice(0, limit),
                    borderColor: '#2ecc71',
                    backgroundColor: '#2ecc7120',
                    borderWidth: lineWidth,
                    tension: 0.1,
                    pointRadius: pointRadius
                },
                {
                    label: 'Fuzzy System',
                    data: predictions.fuzzy.slice(0, limit),
                    borderColor: '#3498db',
                    backgroundColor: '#3498db20',
                    borderWidth: lineWidth,
                    tension: 0.1,
                    pointRadius: pointRadius
                },
                {
                    label: 'Crisp Baseline',
                    data: predictions.crisp.slice(0, limit),
                    borderColor: '#e74c3c',
                    backgroundColor: '#e74c3c20',
                    borderWidth: lineWidth,
                    tension: 0.1,
                    borderDash: [5, 5],
                    pointRadius: pointRadius
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Performance Comparison',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    title: { 
                        display: true, 
                        text: 'AQI Score' 
                    },
                    min: 0,
                    max: yAxisMax,
                    ticks: {
                        stepSize: stepSize
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Sample Number'
                    }
                }
            }
        }
    });
}

// Create simulated performance chart
function createSimulatedPerformanceChart() {
    const ctx = document.getElementById('performance-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Create simulated data
    const labels = Array.from({length: 20}, (_, i) => `Sample ${i+1}`);
    const groundTruth = Array.from({length: 20}, () => 30 + Math.random() * 40);
    const fuzzyPredictions = groundTruth.map(gt => gt + (Math.random() - 0.5) * 10);
    const crispPredictions = groundTruth.map(gt => gt + (Math.random() - 0.3) * 20);
    
    // Calculate dynamic Y-axis max based on data
    const allValues = [...groundTruth, ...fuzzyPredictions, ...crispPredictions];
    const maxValue = Math.max(...allValues);
    const yAxisMax = Math.ceil(maxValue * 1.1 / 50) * 50; // Round up to nearest 50 with 10% padding
    const stepSize = yAxisMax > 100 ? 50 : 20;
    
    performanceChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ground Truth',
                    data: groundTruth,
                    borderColor: '#2ecc71',
                    backgroundColor: '#2ecc7120',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 3
                },
                {
                    label: 'Fuzzy System',
                    data: fuzzyPredictions,
                    borderColor: '#3498db',
                    backgroundColor: '#3498db20',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 3
                },
                {
                    label: 'Crisp Baseline',
                    data: crispPredictions,
                    borderColor: '#e74c3c',
                    backgroundColor: '#e74c3c20',
                    borderWidth: 2,
                    tension: 0.1,
                    borderDash: [5, 5],
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Simulated Performance Comparison',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    title: { 
                        display: true, 
                        text: 'AQI Score' 
                    },
                    min: 0,
                    max: yAxisMax,
                    ticks: {
                        stepSize: stepSize
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Sample Number'
                    }
                }
            }
        }
    });
}

// Create advanced membership functions chart
function createAdvancedMFChart(selectedParameter = 'CO_GT') {
    console.log(`Creating advanced MF chart for ${selectedParameter}...`);
    if (!mfData) {
        console.log("MF data not available, loading defaults...");
        loadDefaultMFData();
    }
    
    const ctx = document.getElementById('mf-chart-advanced');
    if (!ctx) {
        console.error("Advanced MF chart canvas not found");
        return;
    }
    
    console.log("Advanced MF chart canvas found");
    
    const data = mfData?.[selectedParameter];
    if (!data) {
        console.error(`No MF data available for ${selectedParameter}`);
        return;
    }
    
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    const labels = data.universe.map(x => Number(x).toFixed(1));
    
    const datasets = [];
    let colorIndex = 0;
    for (const [term, values] of Object.entries(data.terms)) {
        datasets.push({
            label: term.replace(/_/g, ' '),
            data: values,
            borderColor: colors[colorIndex % colors.length],
            backgroundColor: colors[colorIndex % colors.length] + '20',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderJoin: 'round'
        });
        colorIndex++;
    }
    
    // Get parameter info for display
    const paramInfo = {
        'CO_GT': 'CO Ground Truth (mg/m³)',
        'CO_Sensor': 'CO Sensor (raw units)',
        'NMHC_GT': 'NMHC Ground Truth (µg/m³)',
        'Benzene': 'Benzene (µg/m³)',
        'NMHC_Sensor': 'NMHC Sensor (raw units)',
        'NOx_GT': 'NOx Ground Truth (µg/m³)',
        'NOx_Sensor': 'NOx Sensor (raw units)',
        'NO2_GT': 'NO2 Ground Truth (µg/m³)',
        'NO2_Sensor': 'NO2 Sensor (raw units)',
        'O3_Sensor': 'O3 Sensor (ppb)',
        'Temperature': 'Temperature (°C)',
        'Humidity': 'Relative Humidity (%)',
        'Abs_Humidity': 'Absolute Humidity (g/m³)',
        'AQI': 'Air Quality Index (0-500)'
    };
    
    try {
        if (advancedMFChart) {
            advancedMFChart.destroy();
        }
        
        advancedMFChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${paramInfo[selectedParameter]} - Membership Functions`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    filler: {
                        propagate: true
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: paramInfo[selectedParameter]
                        },
                        ticks: {
                            maxTicksLimit: 12
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Membership Degree'
                        },
                        min: 0,
                        max: 1.1,
                        ticks: {
                            stepSize: 0.2
                        }
                    }
                }
            }
        });
        console.log("Advanced MF chart created successfully");
    } catch (error) {
        console.error("Error creating advanced MF chart:", error);
    }
}

// Create simulated radar chart
function createSimulatedRadarChart() {
    console.log("Creating simulated radar chart...");
    const ctx = document.getElementById('radar-chart');
    if (!ctx) {
        console.error("Radar chart canvas not found");
        return;
    }
    
    console.log("Radar chart canvas found, creating chart...");
    
    // Destroy existing chart
    if (radarChart) {
        radarChart.destroy();
    }
    
    try {
        radarChart = new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Satisfaction', 'MAE (inverted)'],
                datasets: [
                    {
                        label: 'Fuzzy System',
                        data: [0.88, 0.86, 0.87, 0.865, 0.945, 0.875],
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Crisp System',
                        data: [0.724, 0.71, 0.72, 0.714, 0.783, 0.713],
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance Radar Comparison',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 1,
                        ticks: {
                            stepSize: 0.2
                        }
                    }
                }
            }
        });
        console.log("Radar chart created successfully");
    } catch (error) {
        console.error("Error creating radar chart:", error);
    }
}

// Create simulated rule chart
function createSimulatedRuleChart() {
    console.log("Creating simulated rule chart...");
    const ctx = document.getElementById('rule-chart');
    if (!ctx) {
        console.error("Rule chart canvas not found");
        return;
    }
    
    console.log("Rule chart canvas found, creating chart...");
    
    if (ruleChart) {
        ruleChart.destroy();
    }
    
    // Create simulated rule activation data
    const rules = [
        'CO Very High',
        'NO2 Hazardous',
        'O3 Unhealthy',
        'Hot & Humid',
        'Cold & Polluted',
        'Temperature Impact',
        'Combined Pollutants',
        'Emergency Condition'
    ];
    
    const activations = rules.map(() => Math.random() * 0.8);
    
    try {
        ruleChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: rules,
                datasets: [{
                    label: 'Rule Activation Level',
                    data: activations,
                    backgroundColor: [
                        '#e74c3c', '#e74c3c', '#f39c12', '#f39c12',
                        '#3498db', '#3498db', '#9b59b6', '#c0392b'
                    ],
                    borderColor: [
                        '#c0392b', '#c0392b', '#d68910', '#d68910',
                        '#2980b9', '#2980b9', '#8e44ad', '#a93226'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Fuzzy Rule Activations',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Activation Level (0-1)'
                        },
                        min: 0,
                        max: 1
                    }
                }
            }
        });
        console.log("Rule chart created successfully");
    } catch (error) {
        console.error("Error creating rule chart:", error);
    }
}

// Create simulated comparison chart
function createSimulatedComparisonChart() {
    console.log("Creating simulated comparison chart...");
    const ctx = document.getElementById('comparison-chart');
    if (!ctx) {
        console.error("Comparison chart canvas not found");
        return;
    }
    
    console.log("Comparison chart canvas found, creating chart...");
    
    // Create simulated comparison data
    const labels = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Response Time', 'Interpretability'];
    
    const fuzzyData = [0.85, 0.82, 0.88, 0.85, 0.9, 0.95];
    const crispData = [0.72, 0.68, 0.75, 0.71, 0.95, 0.6];
    
    try {
        new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Fuzzy Logic System',
                        data: fuzzyData,
                        borderColor: '#3498db',
                        backgroundColor: '#3498db20',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#3498db'
                    },
                    {
                        label: 'Crisp Baseline',
                        data: crispData,
                        borderColor: '#e74c3c',
                        backgroundColor: '#e74c3c20',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#e74c3c'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Method Comparison',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 1,
                        ticks: {
                            stepSize: 0.2
                        }
                    }
                }
            }
        });
        console.log("Comparison chart created successfully");
    } catch (error) {
        console.error("Error creating comparison chart:", error);
    }
}

// Switch visualization tab
function switchVisualizationTab(chartType) {
    console.log(`Switching to visualization tab: ${chartType}`);
    
    // Update tab buttons
    document.querySelectorAll('.viz-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.viz-tab[data-chart="${chartType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        console.log(`Activated tab button for: ${chartType}`);
    }
    
    // Show/hide tab contents
    document.querySelectorAll('.viz-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show/hide parameter selector for MF tab
    const paramSelector = document.getElementById('mf-parameter-selector');
    if (paramSelector) {
        paramSelector.style.display = chartType === 'mf' ? 'block' : 'none';
    }
    
    const tabMap = {
        'mf': 'mf-tab-content',
        'rule': 'rule-tab-content',
        'radar': 'radar-tab-content',
        'comparison': 'comparison-tab-content'
    };
    
    const targetTab = tabMap[chartType];
    if (targetTab) {
        const tabElement = document.getElementById(targetTab);
        if (tabElement) {
            tabElement.classList.add('active');
            console.log(`Showed tab content: ${targetTab}`);
            
            // Create appropriate chart for the tab
            if (chartType === 'mf') {
                const selectedParam = document.getElementById('mf-param-select')?.value || 'CO_GT';
                createAdvancedMFChart(selectedParam);
            }
        } else {
            console.warn(`Tab element not found: ${targetTab}`);
        }
    }
    
    // Update description
    const descriptions = {
        'mf': 'Membership functions show how input values map to fuzzy linguistic terms. Select a parameter to visualize.',
        'rule': 'Rule activations show which fuzzy rules are firing for current inputs.',
        'radar': 'Radar chart compares multiple performance metrics at once.',
        'comparison': 'Comparison chart shows performance across different methods.'
    };
    
    const descEl = document.getElementById('viz-description');
    if (descEl) {
        descEl.textContent = descriptions[chartType] || 'Visualization';
    }
}

// Test assessment endpoint
async function testAssessmentEndpoint() {
    console.log("Testing assessment endpoint...");
    
    try {
        const response = await fetch('/test_assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ co: 2.5, no2: 80, o3: 750 })
        });
        
        const result = await response.json();
        console.log("Test endpoint response:", result);
        
        if (result.success) {
            alert(`Test successful! Fuzzy AQI: ${result.fuzzy_aqi}, Category: ${result.category}`);
        } else {
            alert(`Test failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Test endpoint error:', error);
        alert('Test endpoint failed. Check console for details.');
    }
}

// Test assessment endpoint with specific data
async function testAssessmentEndpointWithData(co, no2, o3) {
    try {
        const response = await fetch('/test_assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ co, no2, o3 })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(result);
        }
    } catch (error) {
        console.error('Test assessment error:', error);
        displayError();
    }
}

// Show debug info
function showDebugInfo() {
    const debugInfo = `
        System Debug Information:
        
        Current URL: ${window.location.href}
        API Endpoint: ${window.location.origin}
        
        Current Slider Values (Key Parameters):
        - CO Ground Truth: ${document.getElementById('co-gt-slider')?.value || 'N/A'}
        - CO Sensor: ${document.getElementById('co-sensor-slider')?.value || 'N/A'}
        - NO₂ Ground Truth: ${document.getElementById('no2-gt-slider')?.value || 'N/A'}
        - NO₂ Sensor: ${document.getElementById('no2-sensor-slider')?.value || 'N/A'}
        - O₃ Sensor: ${document.getElementById('o3-sensor-slider')?.value || 'N/A'}
        - Temperature: ${document.getElementById('temp-slider')?.value || 'N/A'}
        - Humidity: ${document.getElementById('humidity-slider')?.value || 'N/A'}
        
        Charts Loaded:
        - MF Chart: ${mfChart ? 'Yes' : 'No'}
        - Performance Chart: ${performanceChart ? 'Yes' : 'No'}
        
        MF Data Loaded: ${mfData ? 'Yes' : 'No'}
        
        To test the system:
        1. Click "Basic Assessment" to test the main endpoint
        2. Click "Test Endpoint" to verify backend connection
        3. Click "Run Comparison" to test performance analysis
    `;
    
    alert(debugInfo);
}

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading-results');
    const content = document.getElementById('results-content');
    
    if (loading) loading.style.display = show ? 'flex' : 'none';
    if (content && show) {
        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Processing fuzzy inference...</p>
            </div>
        `;
    }
}

function displayError() {
    const content = document.getElementById('results-content');
    if (content) {
        content.innerHTML = `
            <div class="error-message">
                <h3><i class="fas fa-exclamation-triangle"></i> Assessment Error</h3>
                <p>Failed to assess air quality. Please try the following:</p>
                <ul style="text-align: left; margin: 15px 0; padding-left: 20px;">
                    <li>Check if the backend server is running</li>
                    <li>Try clicking "Test Endpoint" in the footer</li>
                    <li>Refresh the page and try again</li>
                </ul>
                <button class="btn btn-primary" onclick="testAssessmentEndpoint()" style="margin-top: 10px;">
                    <i class="fas fa-vial"></i> Test Connection
                </button>
            </div>
        `;
    }
}

function showCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.style.display = 'flex';
}

function hideCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.style.display = 'none';
}

// Initialize enhanced visualizations
function initializeEnhancedVisualizations() {
    console.log("Initializing enhanced visualizations...");
    // Create placeholder charts for advanced visualization tabs
    createAdvancedMFChart();
    createSimulatedRuleChart();
    createSimulatedRadarChart();
    createSimulatedComparisonChart();
    console.log("Enhanced visualizations initialization complete");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedVisualizations);
} else {
    initializeEnhancedVisualizations();
}
// Force chart resizing on page load
function forceChartResize() {
    setTimeout(() => {
        // Force all charts to resize
        const charts = ['mfChart', 'performanceChart', 'radarChart', 'ruleChart'];
        charts.forEach(chartName => {
            if (window[chartName]) {
                window[chartName].resize();
            }
            if (window[chartName + 'Instance']) {
                window[chartName + 'Instance'].resize();
            }
        });
        
        // Also trigger window resize event
        window.dispatchEvent(new Event('resize'));
    }, 1000);
}

// Call this after page loads
document.addEventListener('DOMContentLoaded', forceChartResize);
window.addEventListener('load', forceChartResize);
// Export functions for global access
window.assessAirQuality = assessAirQuality;
window.enhancedAssessAirQuality = enhancedAssessAirQuality;
window.testAssessmentEndpoint = testAssessmentEndpoint;
window.showDebugInfo = showDebugInfo;