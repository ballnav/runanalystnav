(() => {
    const state = {
        performanceChart: null
    };

    function initChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        state.performanceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Good', 'Satisfactory', 'Should Improve'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#198754', '#fd7e14', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function updateCardStyle(elementId, result) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.classList.remove('good-result', 'satisfactory-result', 'improve-result');

        if (result === 'Good') {
            element.classList.add('good-result');
        } else if (result === 'Satisfactory') {
            element.classList.add('satisfactory-result');
        } else if (result === 'Should Improve') {
            element.classList.add('improve-result');
        }
    }

    function calculateTotalFrames() {
        const resultsRows = document.querySelectorAll('#results tbody tr');
        return resultsRows.length;
    }

    function updateSummary(summaryData) {
        const totalFrames = parseInt(summaryData.totalFrames) || calculateTotalFrames();

        document.getElementById('cycle-count').textContent = summaryData.cycleCount;
        document.getElementById('frame-count').textContent = totalFrames;

        document.getElementById('angle-score').textContent = summaryData.angleScore;
        document.getElementById('angle-result').textContent = summaryData.angleRes;
        updateCardStyle('angle-card', summaryData.angleRes);

        document.getElementById('trunk-percentage').textContent = summaryData.trunkLeanPercentage;
        document.getElementById('trunk-value').textContent = summaryData.trunkLeanValue;
        document.getElementById('trunk-result').textContent = summaryData.trunkLeanRes;
        updateCardStyle('trunk-card', summaryData.trunkLeanRes);

        document.getElementById('hip-percentage').textContent = summaryData.hipPercentage;
        document.getElementById('hip-value').textContent = summaryData.hipValue;
        document.getElementById('hip-result').textContent = summaryData.hipRes;
        updateCardStyle('hip-card', summaryData.hipRes);

        document.getElementById('front-knee-percentage').textContent = summaryData.frontKneePercentage;
        document.getElementById('front-knee-value').textContent = summaryData.frontKneeValue;
        document.getElementById('front-knee-result').textContent = summaryData.frontKneeRes;
        updateCardStyle('front-knee-card', summaryData.frontKneeRes);

        document.getElementById('back-knee-percentage').textContent = summaryData.backKneePercentage;
        document.getElementById('back-knee-value').textContent = summaryData.backKneeValue;
        document.getElementById('back-knee-result').textContent = summaryData.backKneeRes;
        updateCardStyle('back-knee-card', summaryData.backKneeRes);

        const goodPercentage = parseFloat(summaryData.GoodPercentage);
        const satisfactoryPercentage = parseFloat(summaryData.SatisfactoryPercentage);
        const improvePercentage = parseFloat(summaryData.Should_ImprovePercentage || summaryData['Should ImprovePercentage']);

        document.getElementById('good-percentage').textContent = summaryData.GoodPercentage;
        document.getElementById('good-count').textContent = `(${summaryData.GoodScore})`;

        document.getElementById('satisfactory-percentage').textContent = summaryData.SatisfactoryPercentage;
        document.getElementById('satisfactory-count').textContent = `(${summaryData.SatisfactoryScore})`;

        document.getElementById('improve-percentage').textContent = summaryData.Should_ImprovePercentage || summaryData['Should ImprovePercentage'];
        document.getElementById('improve-count').textContent = `(${summaryData.Should_ImproveScore || summaryData['Should ImproveScore']})`;

        if (state.performanceChart) {
            state.performanceChart.data.datasets[0].data = [
                goodPercentage,
                satisfactoryPercentage,
                improvePercentage
            ];
            state.performanceChart.update();
        }

        displayRankedResults(summaryData);
    }

    function displayRankedResults(summaryData) {
        const container = document.getElementById('ranked-results');
        if (!container) return;

        const resultCategories = [
            {
                name: 'Good',
                count: parseInt(summaryData.GoodScore),
                percentage: summaryData.GoodPercentage
            },
            {
                name: 'Satisfactory',
                count: parseInt(summaryData.SatisfactoryScore),
                percentage: summaryData.SatisfactoryPercentage
            },
            {
                name: 'Should Improve',
                count: parseInt(summaryData.Should_ImproveScore || summaryData['Should ImproveScore']),
                percentage: summaryData.Should_ImprovePercentage || summaryData['Should ImprovePercentage']
            }
        ];

        resultCategories.sort((a, b) => b.count - a.count);
        const totalFrames = resultCategories.reduce((sum, category) => sum + category.count, 0);

        container.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h6 class="fw-bold">Most Common Performance Categories</h6>
                <span class="text-muted">Total Frames: ${totalFrames}</span>
            </div>
        `;

        resultCategories.forEach((category, index) => {
            let colorClass = '';
            let textClass = '';
            if (category.name === 'Good') {
                colorClass = 'bg-success';
                textClass = 'text-success';
            } else if (category.name === 'Satisfactory') {
                colorClass = 'bg-warning';
                textClass = 'text-warning';
            } else {
                colorClass = 'bg-danger';
                textClass = 'text-danger';
            }

            let rankLabel = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            const widthPercentage = (category.count / totalFrames) * 100;

            const rankItem = `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div class="d-flex align-items-center">
                            <span class="me-2 fs-4">${rankLabel}</span>
                            <span class="fw-bold ${textClass}">${category.name}</span>
                        </div>
                        <div>
                            <strong>${category.count}</strong> frames
                            <span class="ms-2 badge ${colorClass}">${category.percentage}</span>
                        </div>
                    </div>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar ${colorClass}" role="progressbar"
                            style="width: ${widthPercentage}%"
                            aria-valuenow="${category.count}"
                            aria-valuemin="0"
                            aria-valuemax="${totalFrames}">
                            ${widthPercentage.toFixed(1)}%
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML += rankItem;
        });
    }

    function renderResultsTable(results) {
        const resultsContainer = document.querySelector('#results tbody');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        results.forEach((result) => {
            const row = `
                <tr>
                    <td>${result['Frame']}</td>
                    <td>${result['Running Gait Cycle']}</td>
                    <td>${result['Sub Phase']}</td>
                    <td>${result['% Cycle']}</td>
                    <td>${result['Trunk Lean']}</td>
                    <td>${result['Front Knee Angle']}</td>
                    <td>${result['Back Knee Angle']}</td>
                    <td>${result['Front Hip Angle']}</td>
                    <td>${result['Angle Each Body %']}</td>
                    <td>${result['Result']}</td>
                </tr>`;
            resultsContainer.innerHTML += row;
        });
    }

    function handleUploadSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then((response) => response.json())
        .then((data) => {
            const resultsContainer = document.querySelector('#results tbody');
            if (!resultsContainer) return;

            if ('analysis_results' in data) {
                renderResultsTable(data.analysis_results);

                if ('summary_data' in data) {
                    updateSummary(data.summary_data);
                    document.getElementById('summary-section').style.display = 'block';
                } else {
                    document.getElementById('summary-section').style.display = 'none';
                }
            } else if ('error' in data) {
                console.error('Error:', data.error);
                resultsContainer.innerHTML = `<tr><td colspan="10" class="text-danger text-center py-3">Error: ${data.error}</td></tr>`;
                document.getElementById('summary-section').style.display = 'none';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            const resultsContainer = document.querySelector('#results tbody');
            if (resultsContainer) {
                resultsContainer.innerHTML = '<tr><td colspan="10" class="text-danger text-center py-3">Error: Could not process request</td></tr>';
            }
            document.getElementById('summary-section').style.display = 'none';
        });
    }

    function toggleScroll() {
        const scrollButton = document.getElementById('scrollButton');
        if (!scrollButton) return;

        if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            scrollButton.innerHTML = '↓';
        } else {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
            scrollButton.innerHTML = '↑';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initChart();

        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', handleUploadSubmit);
        }

        const scrollButton = document.getElementById('scrollButton');
        if (scrollButton) {
            scrollButton.addEventListener('click', toggleScroll);
        }
    });

    window.toggleScroll = toggleScroll;
    window.updateSummary = updateSummary;
})();
