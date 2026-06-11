import { computed } from 'vue'

export function useCharts(invoiceRecords, blockRecords) {
  
  const lineChartData = computed(() => {
    const rawList = invoiceRecords.value || []
    
    // 1.Group & aggregate records that share the exact same date string
    const dailyAggregation = rawList.reduce((acc, item) => {
      if (!item.date || item.date === 'N/A') return acc
      
      // Standardize the raw date representation
      const dateKey = new Date(item.date).toISOString().split('T')[0]
      const numericValue = parseFloat(item.value || 0)
      
      acc[dateKey] = (acc[dateKey] || 0) + numericValue
      return acc
    }, {})

    // 2.Sort chronologically by timeline dates
    const sortedDates = Object.keys(dailyAggregation).sort((a, b) => new Date(a) - new Date(b))
    
    return {
      // Clean labels formatted to display clearly along the axis
      labels: sortedDates.map(dateStr => 
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })
      ),
      datasets: [{
        label: 'Daily Totals (Trend)',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        borderColor: '#10b981',
        pointBackgroundColor: '#064e3b',
        borderWidth: 2,
        tension: 0.2, 
        // Passes the consolidated sum totals for each individual date
        data: sortedDates.map(dateStr => dailyAggregation[dateStr])
      }]
    }
  })

  const barChartData = computed(() => {
    const dataSource = blockRecords?.value || []
    
    return {
      labels: dataSource.map(item => item.identifier),
      datasets: [{
        label: 'Volume per Block',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: dataSource.map(item => item.value)
      }]
    }
  })

  // Global canvas configurations for ChartJS instances
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { 
        grid: { color: '#1e293b' }, // Dark theme support lines
        ticks: { color: '#9ca3af', font: { size: 10, weight: '500' } } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#9ca3af', font: { size: 10, weight: '500' } } 
      }
    }
  }

  return {
    lineChartData,
    barChartData,
    chartOptions
  }
}