import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installed = () => setIsInstalled(true)
    window.addEventListener('appinstalled', installed)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setShow(false)
  }

  if (!show || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-md mx-auto lg:left-auto lg:right-6 lg:bottom-6">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">Install SmartStudent</div>
        <div className="text-xs text-slate-300">Add to home screen for offline access</div>
      </div>
      <button onClick={install} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0">
        Install
      </button>
      <button onClick={() => setShow(false)} className="p-2 hover:bg-slate-800 rounded-lg shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
