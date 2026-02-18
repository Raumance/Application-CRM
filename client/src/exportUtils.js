// Utilitaires pour l'export PDF et Excel

// Export CSV/Excel simple
export function exportToCSV(data, filename, headers) {
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header.key] || ''
          // Échapper les virgules et guillemets
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

// Export PDF simple (sans bibliothèque externe - génération HTML puis impression)
export function exportToPDF(title, headers, data, filename) {
  const printWindow = window.open('', '_blank')
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          text-align: center;
          color: #1d4ed8;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #1d4ed8;
          color: white;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        @media print {
          @page {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Date d'export : ${new Date().toLocaleDateString('fr-FR')}</p>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${headers
                  .map((h) => {
                    const value = row[h.key] || ''
                    return `<td>${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</td>`
                  })
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}
