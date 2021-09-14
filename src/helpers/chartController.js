import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
Chart.defaults.plugins.legend.display = false
Chart.defaults.elements.point.radius = 0
Chart.defaults.borderColor = 'rgba(0, 0, 0, 0)'

import { externalTooltipHandler } from './tooltip'

let chart
export function newChart(data) {
  if (chart) destroyChart()
  if (data.datasets[0].data.length < 1) throw Error()

  let ctx = document.getElementById('chart')
  chart = new Chart(ctx, {
    type: 'line',
    data,
    options: {
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: 8,
            display: false,
          },
        },
        y: {
          grid: {
            color: '#44475C',
            offset: true,
          },
          ticks: {
            maxTicksLimit: 12,
            display: false,
          },
          max: 101,
          min: Math.max(-5, Math.min.apply(Math, data.datasets[0].data) - 5),
        },
      },
      animation: {
        duration: 0,
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          enabled: false,
          position: 'nearest',
          external: externalTooltipHandler,
        },
      },
    },
  })
  return chart
}

export function destroyChart() {
  if (!chart) return
  chart.destroy()
  chart = undefined
}
