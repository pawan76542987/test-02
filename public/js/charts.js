// Chart.js helper integrations for Admin Dashboard and Reports
document.addEventListener('DOMContentLoaded', () => {
  // 1. Category Distribution Chart
  const categoryCanvas = document.getElementById('categoryDistributionChart');
  if (categoryCanvas && window.Chart && window.categoryChartData) {
    new Chart(categoryCanvas, {
      type: 'doughnut',
      data: {
        labels: window.categoryChartData.labels,
        datasets: [
          {
            data: window.categoryChartData.data,
            backgroundColor: [
              '#2563eb',
              '#10b981',
              '#f59e0b',
              '#8b5cf6',
              '#ec4899',
              '#06b6d4',
              '#64748b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } }
          }
        },
        cutout: '68%'
      }
    });
  }

  // 2. Lab Equipment Utilization Chart
  const labCanvas = document.getElementById('labDistributionChart');
  if (labCanvas && window.Chart && window.labChartData) {
    new Chart(labCanvas, {
      type: 'bar',
      data: {
        labels: window.labChartData.labels,
        datasets: [
          {
            label: 'Total Units',
            data: window.labChartData.total,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          },
          {
            label: 'Issued Units',
            data: window.labChartData.issued,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } }
          }
        }
      }
    });
  }
});
