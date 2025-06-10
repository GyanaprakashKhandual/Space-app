// Global variables
let allTestData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 2;
let currentFilters = {
  api: '',
  network: '',
  status: '',
  assertion: '',
  search: ''
};

// DOM elements
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const resultsElement = document.getElementById('results');
const summaryCardsElement = document.getElementById('summary-cards');
const searchInput = document.querySelector('.search-bar input');
const apiFilterDropdown = document.querySelectorAll('.filter-dropdown')[0];
const networkFilterDropdown = document.querySelectorAll('.filter-dropdown')[1];
const statusFilterDropdown = document.querySelectorAll('.filter-dropdown')[2];
const assertionFilterDropdown = document.querySelectorAll('.filter-dropdown')[3];


// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initFilters();
});

// Fetch data from API
async function loadData() {
  try {
    showLoading();
    const response = await fetch('https://k6backendjson.onrender.com/testresults');//
    if (!response.ok) throw new Error('Network response was not ok');
    
    allTestData = await response.json();
    filteredData = [...allTestData];
    
    hideLoading();
    renderDashboard();
  } catch (error) {
    console.error('Error fetching data:', error);
    showError();
  }
}

// Initialize filters
function initFilters() {
  populateApiFilter();
  populateNetworkFilter();
  populateStatusFilter();
  populateAssertionFilter();
  setupEventListeners();
}

// Populate API filter dropdown
function populateApiFilter() {
  const dropdownContent = apiFilterDropdown.querySelector('.dropdown-content');
  dropdownContent.innerHTML = '';
  
  // Add "All APIs" option
  const allOption = document.createElement('a');
  allOption.href = '#';
  allOption.innerHTML = '<i class="material-icons">apps</i> All APIs';
  allOption.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilters.api = '';
    apiFilterDropdown.querySelector('.filter-btn').textContent = 'API: All';
    filterData();
  });
  dropdownContent.appendChild(allOption);

  // Add individual API options
  const uniqueApis = [...new Set(allTestData.map(api => api.name))];
  uniqueApis.forEach(api => {
    const option = document.createElement('a');
    option.href = '#';
    option.innerHTML = `<i class="material-icons">api</i> ${api}`;
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.api = api;
      apiFilterDropdown.querySelector('.filter-btn').textContent = `API: ${api.substring(0, 15)}${api.length > 15 ? '...' : ''}`;
      filterData();
    });
    dropdownContent.appendChild(option);
  });
}

// Populate Network filter dropdown
function populateNetworkFilter(speedValue = '') {
  const dropdownContent = networkFilterDropdown.querySelector('.dropdown-content');
  dropdownContent.innerHTML = '';
  
  // Add "All Networks" option
  const allOption = document.createElement('a');
  allOption.href = '#';
  allOption.innerHTML = '<i class="material-icons">network_check</i> All Networks';
  allOption.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilters.network = '';
    networkFilterDropdown.querySelector('.filter-btn').textContent = 'Network: All';
    filterData();
  });
  dropdownContent.appendChild(allOption);

  // Get all unique networks (filtered by speedValue if provided)
  const networks = new Set();
  allTestData.forEach(api => {
    api.tests.forEach(test => {
      if (speedValue && !test.network.toLowerCase().includes(speedValue.toLowerCase())) return;
      networks.add(test.network);
    });
  });

  // Add network options
  Array.from(networks).forEach(network => {
    const option = document.createElement('a');
    option.href = '#';
    option.innerHTML = `<i class="material-icons">speed</i> ${network}`;
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.network = network;
      networkFilterDropdown.querySelector('.filter-btn').textContent = `Network: ${network}`;
      filterData();
    });
    dropdownContent.appendChild(option);
  });
}


// Populate Status filter dropdown
function populateStatusFilter() {
  const dropdownContent = statusFilterDropdown.querySelector('.dropdown-content');
  dropdownContent.innerHTML = '';
  
  const statusOptions = [
    { value: '', icon: 'all_inclusive', label: 'All Statuses' },
    { value: 'pass', icon: 'check_circle', label: 'Passed' },
    { value: 'fail', icon: 'error', label: 'Failed' },
    { value: 'flaky', icon: 'sync_problem', label: 'Flaky' }
  ];

  statusOptions.forEach(status => {
    const option = document.createElement('a');
    option.href = '#';
    option.innerHTML = `<i class="material-icons">${status.icon}</i> ${status.label}`;
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.status = status.value;
      statusFilterDropdown.querySelector('.filter-btn').textContent = `Status: ${status.label}`;
      filterData();
    });
    dropdownContent.appendChild(option);
  });
}

// Populate Assertion filter dropdown
function populateAssertionFilter() {
  const dropdownContent = assertionFilterDropdown.querySelector('.dropdown-content');
  dropdownContent.innerHTML = '';
  
  const assertionOptions = [
    { value: '', icon: 'sort', label: 'Default' },
    { value: 'Most Recent', icon: 'schedule', label: 'Most Recent' },
    { value: 'Duration', icon: 'timer', label: 'Duration' },
    { value: 'Success Rate', icon: 'trending_up', label: 'Success Rate' },
    { value: 'Name', icon: 'sort_by_alpha', label: 'Name' }
  ];

  assertionOptions.forEach(assertion => {
    const option = document.createElement('a');
    option.href = '#';
    option.innerHTML = `<i class="material-icons">${assertion.icon}</i> ${assertion.label}`;
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.assertion = assertion.value;
      assertionFilterDropdown.querySelector('.filter-btn').textContent = `Sort: ${assertion.label}`;
      filterData();
    });
    dropdownContent.appendChild(option);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    filterData();
  });

  // Theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Filter data based on current filters
function filterData() {
  filteredData = allTestData.filter(api => {
    // Search filter
    const matchesSearch = currentFilters.search === '' || 
      api.name.toLowerCase().includes(currentFilters.search) || 
      api.tests.some(test => test.network.toLowerCase().includes(currentFilters.search));

    // API name filter
    const matchesApiFilter = currentFilters.api === '' || 
      api.name.toLowerCase().includes(currentFilters.api.toLowerCase());

    // Network filter
    const matchesNetworkFilter = currentFilters.network === '' || 
      api.tests.some(test => test.network.includes(currentFilters.network));

    // Status filter
    const matchesStatusFilter = currentFilters.status === '' || 
      api.tests.some(test => {
        if (currentFilters.status === 'pass') return test.metrics.status.result === 'pass';
        if (currentFilters.status === 'fail') return test.metrics.status.result === 'fail';
        if (currentFilters.status === 'flaky') return test.metrics.status.result === 'flaky';
        return true;
      });

    return matchesSearch && matchesApiFilter && matchesNetworkFilter && matchesStatusFilter;
  });

  // Apply sorting based on assertion filter
  applySorting(currentFilters.assertion);
  
  // Reset to first page when filtering
  currentPage = 1;
  renderDashboard();
}

// Apply sorting based on assertion filter
function applySorting(assertionFilter) {
  switch(assertionFilter) {
    case 'Most Recent':
      // Assuming we have a timestamp field - using name as proxy in this example
      filteredData.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'Duration':
      filteredData.forEach(api => {
        api.tests.sort((a, b) => {
          const avgA = parseFloat(a.metrics.duration.avg);
          const avgB = parseFloat(b.metrics.duration.avg);
          return avgA - avgB;
        });
      });
      filteredData.sort((a, b) => {
        const avgA = parseFloat(a.tests[0].metrics.duration.avg);
        const avgB = parseFloat(b.tests[0].metrics.duration.avg);
        return avgB - avgA; // Sort by highest duration first
      });
      break;
    case 'Success Rate':
      filteredData.sort((a, b) => {
        const rateA = parseFloat(a.tests[0].metrics.status.passRate);
        const rateB = parseFloat(b.tests[0].metrics.status.passRate);
        return rateB - rateA; // Sort by highest pass rate first
      });
      break;
    case 'Name':
      filteredData.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // No sorting
      break;
  }
}

// Render the entire dashboard
function renderDashboard() {
  renderSummaryCards();
  renderTestResultsTable();
}

// Render summary cards
function renderSummaryCards() {
  // Calculate summary statistics
  let totalApis = 0;
  let totalPassedTests = 0;
  let totalTests = 0;
  let totalResponseTime = 0;
  let responseTimeCount = 0;

  filteredData.forEach(api => {
    api.tests.forEach(test => {
      totalTests++;
      if (test.metrics.status.result === 'pass') {
        totalPassedTests++;
      }
      
      // Calculate average response time
      const avgTime = test.metrics.duration.avg;
      if (avgTime && avgTime !== '0s') {
        const timeValue = parseFloat(avgTime);
        totalResponseTime += timeValue;
        responseTimeCount++;
      }
    });
  });

  totalApis = filteredData.length;
  const avgResponseTime = responseTimeCount > 0 
    ? (totalResponseTime / responseTimeCount).toFixed(2) + 'ms' 
    : 'N/A';
  const passPercentage = totalTests > 0 
    ? ((totalPassedTests / totalTests) * 100).toFixed(1) + '%' 
    : '0%';

  summaryCardsElement.innerHTML = `
    <div class="summary-card">
      <div class="card-icon">
        <i class="material-icons">api</i>
      </div>
      <div class="card-content">
        <h3>Total APIs Tested</h3>
        <p>${totalApis}</p>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon">
        <i class="material-icons">check_circle</i>
      </div>
      <div class="card-content">
        <h3>Passed Tests</h3>
        <p>${passPercentage}</p>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon">
        <i class="material-icons">timer</i>
      </div>
      <div class="card-content">
        <h3>Avg Response Time</h3>
        <p>${avgResponseTime}</p>
      </div>
    </div>
    <div class="summary-card">
      <div class="card-icon">
        <i class="material-icons">network_check</i>
      </div>
      <div class="card-content">
        <h3>Total Tests</h3>
        <p>${totalTests}</p>
      </div>
    </div>
  `;
}

// Render test results table with pagination
function renderTestResultsTable() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  let tableHTML = `
    <div class="table-section">
      <div class="table-header">
        <h2>Test Results</h2>
        <div class="pagination-controls">
          <button class="pagination-btn" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="material-icons">chevron_left</i>
          </button>
          <span>Page ${currentPage} of ${totalPages}</span>
          <button class="pagination-btn" onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="material-icons">chevron_right</i>
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>Network</th>
            <th>Avg Res</th>
            <th>Min Res</th>
            <th>Med Res</th>
            <th>Max Res</th>
            <th>P90</th>
            <th>P95</th>
            <th>Status Passed</th>
            <th>Status Count</th>
            <th>Assertion Pass</th>
            <th>Assertion Count</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (paginatedData.length === 0) {
    tableHTML += `
      <tr>
        <td colspan="13" class="no-results">No test results found matching your criteria</td>
      </tr>
    `;
  } else {
    paginatedData.forEach(api => {
      api.tests.forEach((test, index) => {
        const isPass = test.metrics.status.result === 'pass';
        const isResponsePass = test.metrics.responseTime.result === 'pass';
        
        tableHTML += `
          <tr>
            <td>${api.name}</td>
            <td>${test.network}</td>
            <td>${test.metrics.duration.avg}</td>
            <td>${test.metrics.duration.min}</td>
            <td>${test.metrics.duration.med}</td>
            <td>${test.metrics.duration.max}</td>
            <td>${test.metrics.duration.p90}</td>
            <td>${test.metrics.duration.p95}</td>
            <td class="${isPass ? 'pass' : 'fail'}">${test.metrics.status.passRate}</td>
            <td>${test.metrics.status.passCount}</td>
            <td class="${isResponsePass ? 'pass' : 'fail'}">${test.metrics.responseTime.passRate}</td>
            <td>${test.metrics.responseTime.passCount}</td>
            <td>
              <button class="details-btn" onclick="showTestDetails('${api.name}', ${index})">
                <i class="material-icons">info</i>
              </button>
            </td>
          </tr>
        `;
      });
    });
  }

  tableHTML += `
        </tbody>
      </table>
  `;

  // If results section doesn't exist, create it
  if (!document.querySelector('.table-section')) {
    resultsElement.insertAdjacentHTML('beforeend', tableHTML);
  } else {
    document.querySelector('.table-section').outerHTML = tableHTML;
  }
}

// Change page for pagination
function changePage(offset) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const newPage = currentPage + offset;
  
  if (newPage > 0 && newPage <= totalPages) {
    currentPage = newPage;
    renderTestResultsTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Show test details (modal)
function showTestDetails(apiName, testIndex) {
  const api = filteredData.find(api => api.name === apiName);
  if (!api) return;

  const test = api.tests[testIndex];
  
  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'test-details-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Detailed metrics for ${apiName} - ${test.network}</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="metrics-section">
          <h4><i class="material-icons">check_circle</i> Status Metrics</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Pass Rate:</span>
              <span class="metric-value ${test.metrics.status.result === 'pass' ? 'pass' : 'fail'}">
                ${test.metrics.status.passRate}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Pass Count:</span>
              <span class="metric-value">${test.metrics.status.passCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Fail Count:</span>
              <span class="metric-value">${test.metrics.status.failCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Result:</span>
              <span class="metric-value ${test.metrics.status.result === 'pass' ? 'pass' : 'fail'}">
                ${test.metrics.status.result}
              </span>
            </div>
          </div>
        </div>
        
        <div class="metrics-section">
          <h4><i class="material-icons">timer</i> Response Time Metrics</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Pass Rate:</span>
              <span class="metric-value ${test.metrics.responseTime.result === 'pass' ? 'pass' : 'fail'}">
                ${test.metrics.responseTime.passRate}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Pass Count:</span>
              <span class="metric-value">${test.metrics.responseTime.passCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Fail Count:</span>
              <span class="metric-value">${test.metrics.responseTime.failCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Result:</span>
              <span class="metric-value ${test.metrics.responseTime.result === 'pass' ? 'pass' : 'fail'}">
                ${test.metrics.responseTime.result}
              </span>
            </div>
          </div>
        </div>
        
        <div class="metrics-section">
          <h4><i class="material-icons">speed</i> Duration Metrics</h4>
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Average:</span>
              <span class="metric-value">${test.metrics.duration.avg}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Minimum:</span>
              <span class="metric-value">${test.metrics.duration.min}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Maximum:</span>
              <span class="metric-value">${test.metrics.duration.max}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Median:</span>
              <span class="metric-value">${test.metrics.duration.med}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">90th Percentile:</span>
              <span class="metric-value">${test.metrics.duration.p90}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">95th Percentile:</span>
              <span class="metric-value">${test.metrics.duration.p95}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="close-modal-btn">Close</button>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('.close-modal-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close when clicking outside modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Toggle theme
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('theme-icon');
  const themeToggle = document.querySelector('.theme-toggle');
  
  // Toggle dark mode class
  body.classList.toggle('dark-mode');
  
  // Toggle icon and animate
  themeToggle.classList.add('animate');
  setTimeout(() => {
    if (body.classList.contains('dark-mode')) {
      themeIcon.textContent = 'light_mode';
    } else {
      themeIcon.textContent = 'dark_mode';
    }
    themeToggle.classList.remove('animate');
  }, 150);
  
  // Save preference to localStorage
  const isDark = body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
}

// Loading state functions
function showLoading() {
  loadingElement.style.display = 'flex';
  errorElement.style.display = 'none';
  resultsElement.style.display = 'none';
}

function hideLoading() {
  loadingElement.style.display = 'none';
  errorElement.style.display = 'none';
  resultsElement.style.display = 'block';
}

function showError() {
  loadingElement.style.display = 'none';
  errorElement.style.display = 'flex';
  resultsElement.style.display = 'none';
}

// Check for saved theme preference on load
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-icon').textContent = 'light_mode';
  }
});

// Make functions available globally for HTML onclick handlers
window.changePage = changePage;
window.showTestDetails = showTestDetails;
window.toggleTheme = toggleTheme;