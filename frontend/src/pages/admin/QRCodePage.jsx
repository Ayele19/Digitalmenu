import React, { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Download, FileText, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSettings } from '../../api/settings'
import '../../styles/QRCodePage.css'

const MENU_URL =
  import.meta.env.VITE_MENU_URL || 'http://localhost:5173'

export default function QRCodePage() {
  const qrContainerRef = useRef(null)
  const [downloadingPng, setDownloadingPng] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 60000,
  })

  const cafeName = settings?.cafe_name ?? 'Ethiopian Café'

  async function handleDownloadPng() {
    if (!qrContainerRef.current) return
    setDownloadingPng(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(qrContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `${cafeName.replace(/\s+/g, '-')}-QR.png`
      a.click()
      toast.success('PNG downloaded.')
    } catch (err) {
      toast.error('Failed to download PNG.')
    } finally {
      setDownloadingPng(false)
    }
  }

  async function handleDownloadPdf() {
    if (!qrContainerRef.current) return
    setDownloadingPdf(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(qrContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()

      // Center the QR on the page
      const imgW = 80
      const imgH = (canvas.height / canvas.width) * imgW
      const x = (pageW - imgW) / 2
      const y = 40

      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text(cafeName, pageW / 2, y + imgH + 14, { align: 'center' })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.setTextColor(100)
      pdf.text('Scan to view our menu', pageW / 2, y + imgH + 22, { align: 'center' })

      pdf.save(`${cafeName.replace(/\s+/g, '-')}-QR.pdf`)
      toast.success('PDF downloaded.')
    } catch (err) {
      toast.error('Failed to download PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="qr-page">
      <h1 className="qr-page-title">QR Code Management</h1>

      {/* ── Main card ── */}
      <div className="qr-main-card">
        {/* QR container — captured by html2canvas */}
        <div className="qr-code-container" ref={qrContainerRef}>
          <div className="qr-svg-wrapper">
            <QRCodeSVG
              value={MENU_URL}
              size={256}
              fgColor="#6B3A2A"
              bgColor="#ffffff"
              level="M"
            />
          </div>
          <div className="qr-cafe-name">{cafeName}</div>
        </div>

        {/* Download buttons */}
        <div className="qr-actions">
          <button
            type="button"
            className="qr-btn qr-btn-primary"
            onClick={handleDownloadPng}
            disabled={downloadingPng}
          >
            <Download size={16} aria-hidden="true" />
            {downloadingPng ? 'Downloading…' : 'Download PNG'}
          </button>
          <button
            type="button"
            className="qr-btn qr-btn-secondary"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            <FileText size={16} aria-hidden="true" />
            {downloadingPdf ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ── Info box ── */}
      <div className="qr-info-box" role="note">
        <Info size={18} className="qr-info-icon" aria-hidden="true" />
        <p className="qr-info-text">
          This QR code always points to your menu. It never changes when you update items or prices.
          Print it once and place it on every table.
        </p>
      </div>

      {/* ── Printing tips ── */}
      <div className="qr-tips-card">
        <h2 className="qr-tips-title">Printing Tips</h2>
        <ul className="qr-tips-list">
          <li>
            <span className="qr-tip-bullet">•</span>
            Print at least 3 × 3 cm for reliable scanning from a distance.
          </li>
          <li>
            <span className="qr-tip-bullet">•</span>
            Use high-contrast ink — the default brown on white scans well.
          </li>
          <li>
            <span className="qr-tip-bullet">•</span>
            Laminate table cards to protect from spills.
          </li>
          <li>
            <span className="qr-tip-bullet">•</span>
            Test the scan with both iOS and Android before bulk printing.
          </li>
        </ul>
      </div>
    </div>
  )
}
