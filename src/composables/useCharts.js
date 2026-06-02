import { computed } from 'vue'

export function useCharts(invoiceRecords, blockRecords) {
  
  const lineChartData = computed(() => {
    const rawList = invoiceRecords.value || []
    const sortedList = [...rawList].sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return {
      labels: sortedList.map(item => {
        if (!item.date || item.date === 'N/A') return 'N/A'
        return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })
      }),
      datasets: [{
        label: 'Invoices Released (Trend)',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        borderColor: '#10b981',
        pointBackgroundColor: '#064e3b',
        borderWidth: 2,
        tension: 0.2, 
        data: sortedList.map(item => item.value)
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

  //Global canvas configurations for ChartJS instances
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { 
        grid: { color: '#f3f4f6' }, 
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